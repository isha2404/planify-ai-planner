import { Event } from "../types";

// Fetch Google Calendar events
type GoogleEvent = any; // Replace with actual Google event type if needed
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<Event[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch Google Calendar events");
  const data = await response.json();
  return (data.items || []).map((item: GoogleEvent) => ({
    id: item.id,
    title: item.summary || "(No title)",
    start: item.start?.dateTime || item.start?.date,
    end: item.end?.dateTime || item.end?.date,
    type: "meeting", // You may want to map this more specifically
    priority: "medium", // Default, or map from event
    attendees: item.attendees?.map((a: any) => a.email),
    description: item.description,
  }));
}

// Fetch Outlook Calendar events
type OutlookEvent = any; // Replace with actual Outlook event type if needed
export async function fetchOutlookCalendarEvents(accessToken: string): Promise<Event[]> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch Outlook Calendar events");
  const data = await response.json();
  return (data.value || []).map((item: OutlookEvent) => ({
    id: item.id,
    title: item.subject || "(No title)",
    start: item.start?.dateTime,
    end: item.end?.dateTime,
    type: "meeting", // You may want to map this more specifically
    priority: "medium", // Default, or map from event
    attendees: item.attendees?.map((a: any) => a.emailAddress?.address),
    description: item.bodyPreview,
  }));
}
