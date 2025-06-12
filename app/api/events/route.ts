import { NextResponse } from "next/server";
// Make sure validateToken is exported from "@/lib/auth"
import { verifyToken } from "@/lib/auth";
// If validateToken is a default export, use:
// import validateToken from "@/lib/auth";
import { getAllEvents, createEvent } from "@/lib/data/events";
import { Event } from "@/lib/types";
import { findUsersByEmails } from "@/lib/data/users";

// Import JWTPayload type if it exists, or define it here
import type { JWTPayload } from "@/lib/auth"; // Adjust the path if needed
// If not available, define it as follows:
// type JWTPayload = { [key: string]: any };

export async function GET(request: Request) {
  try {
    // Verify authentication
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    console.log("[EVENTS_GET] Fetching events for user:", payload.id);
    const events = await getAllEvents(payload.id);
    console.log("[EVENTS_GET] Found events:", events.length);
    return NextResponse.json(events);
  } catch (error) {
    console.error("[EVENTS_GET] error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { title, description, start, end, type, priority, attendees } =
      await request.json();

    // Validate required fields
    if (!title || !start || !end || !type) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { message: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create the event
    const event = await createEvent({
      title,
      description,
      start: startDate,
      end: endDate,
      type,
      priority: priority || "medium",
      user_id: payload.id,
      attendees: attendees || [],
    });

    // If this is a team meeting with attendees, handle notifications
    if (type === "meeting" && attendees && attendees.length > 0) {
      try {
        // Find existing users in the database
        const existingUsers = await findUsersByEmails(attendees);
        const existingUserEmails = existingUsers.map((user) => user.email);
        const nonExistingEmails = attendees.filter(
          (email) => !existingUserEmails.includes(email)
        );

        // Try to send notifications, but don't fail if it doesn't work
        try {
          // Send notifications to existing users
          if (existingUsers.length > 0) {
            const notifyResponse = await fetch(
              `${request.headers.get("origin")}/api/events/notify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  event,
                  attendees: existingUserEmails,
                  existingUsers: true,
                }),
              }
            );

            if (!notifyResponse.ok) {
              console.log(
                "Email notifications not sent (this is okay if SMTP is not configured):",
                await notifyResponse.text()
              );
            }
          }

          // Send invitations to non-existing users
          if (nonExistingEmails.length > 0) {
            const inviteResponse = await fetch(
              `${request.headers.get("origin")}/api/events/notify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  event,
                  attendees: nonExistingEmails,
                  existingUsers: false,
                }),
              }
            );

            if (!inviteResponse.ok) {
              console.log(
                "Email invitations not sent (this is okay if SMTP is not configured):",
                await inviteResponse.text()
              );
            }
          }
        } catch (error) {
          // Log but don't fail if email sending fails
          console.log(
            "Email notifications skipped (SMTP not configured):",
            error
          );
        }

        // Return success response with or without notification status
        return NextResponse.json({
          ...event,
          notificationStatus: {
            existingUsersNotified: existingUsers.length,
            invitationsSent: nonExistingEmails.length,
            existingUserEmails,
            nonExistingEmails,
            emailNotificationsEnabled: false, // Indicate that emails were not sent
          },
        });
      } catch (error) {
        console.error("Error processing attendees:", error);
        // Don't fail the event creation if notification fails
        return NextResponse.json(event);
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENTS_POST] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to create event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
