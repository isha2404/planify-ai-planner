import { Event } from "../types";

// Define the scopes we need for Google Calendar
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function initiateGoogleAuth() {
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID not configured");
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    console.log("Redirect URI:", redirectUri); // Debug log

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES.join(" "),
    });

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
    console.log("Auth URL:", authUrl); // Debug log

    window.location.href = authUrl;
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    throw error;
  }
}

export async function fetchGoogleCalendarEvents(
  accessToken: string
): Promise<Event[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google Calendar events");
  }

  const data = await response.json();

  // Convert Google Calendar events to our Event format
  return data.items.map((item: any) => ({
    id: item.id,
    title: item.summary,
    start: item.start.dateTime || item.start.date,
    end: item.end.dateTime || item.end.date,
    type: "meeting",
    priority: "medium",
    description: item.description || "",
    attendees: item.attendees?.map((attendee: any) => attendee.email) || [],
  }));
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: Event
): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: event.attendees?.map((email) => ({ email })) || [],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create Google Calendar event");
  }

  const data = await response.json();
  return data.id;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  event: Event
): Promise<void> {
  if (!event.id) {
    throw new Error("Event ID is required for update");
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: event.attendees?.map((email) => ({ email })) || [],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update Google Calendar event");
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete Google Calendar event");
  }
}
