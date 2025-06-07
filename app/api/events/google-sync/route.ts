import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/lib/services/google-calendar";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { googleAccessToken, syncDirection = "both" } = await request.json();

    if (!googleAccessToken) {
      return NextResponse.json(
        { message: "Google access token is required" },
        { status: 400 }
      );
    }

    // Fetch events from both sources
    const [googleEvents, localEvents] = await Promise.all([
      fetchGoogleCalendarEvents(googleAccessToken),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json()),
    ]);

    // Create maps for efficient lookup
    const googleEventsMap = new Map(
      googleEvents.map((event) => [event.id, event])
    );
    const localEventsMap = new Map(
      localEvents.map((event) => [event.googleCalendarId, event])
    );

    // Track events to be synced
    const eventsToSync = new Set();

    // Sync local events to Google Calendar
    if (syncDirection === "toGoogle" || syncDirection === "both") {
      for (const localEvent of localEvents) {
        try {
          if (localEvent.googleCalendarId) {
            // Update existing Google Calendar event
            const googleEvent = googleEventsMap.get(
              localEvent.googleCalendarId
            );
            if (googleEvent) {
              await updateGoogleCalendarEvent(googleAccessToken, localEvent);
              eventsToSync.add(localEvent.id);
            } else {
              // Google event was deleted, create new one
              const googleEventId = await createGoogleCalendarEvent(
                googleAccessToken,
                localEvent
              );
              // Update local event with new Google Calendar ID
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/events/${localEvent.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    ...localEvent,
                    googleCalendarId: googleEventId,
                  }),
                }
              );
              eventsToSync.add(localEvent.id);
            }
          } else {
            // Create new Google Calendar event
            const googleEventId = await createGoogleCalendarEvent(
              googleAccessToken,
              localEvent
            );
            // Update local event with Google Calendar ID
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/events/${localEvent.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...localEvent,
                  googleCalendarId: googleEventId,
                }),
              }
            );
            eventsToSync.add(localEvent.id);
          }
        } catch (error) {
          console.error("Error syncing local event to Google:", error);
        }
      }
    }

    // Sync Google Calendar events to local storage
    if (syncDirection === "fromGoogle" || syncDirection === "both") {
      for (const googleEvent of googleEvents) {
        try {
          const localEvent = localEventsMap.get(googleEvent.id);
          if (localEvent) {
            // Update existing local event
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/events/${localEvent.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...localEvent,
                  ...googleEvent,
                  googleCalendarId: googleEvent.id,
                }),
              }
            );
            eventsToSync.add(localEvent.id);
          } else {
            // Create new local event
            const newEvent = {
              ...googleEvent,
              id: uuidv4(),
              googleCalendarId: googleEvent.id,
            };
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(newEvent),
            });
            eventsToSync.add(newEvent.id);
          }
        } catch (error) {
          console.error("Error syncing Google event to local:", error);
        }
      }
    }

    // Fetch updated events
    const updatedEvents = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).then((res) => res.json());

    return NextResponse.json({
      message: "Sync completed successfully",
      events: updatedEvents,
      syncedEventIds: Array.from(eventsToSync),
    });
  } catch (error) {
    console.error("[GOOGLE_SYNC]", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to sync events",
      },
      { status: 500 }
    );
  }
}
