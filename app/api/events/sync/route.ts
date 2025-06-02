import { NextResponse } from "next/server";
import { fetchGoogleCalendarEvents, fetchOutlookCalendarEvents } from "@/lib/services/calendar-sync";
import { Event } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { googleAccessToken, outlookAccessToken } = await request.json();
    if (!googleAccessToken && !outlookAccessToken) {
      return NextResponse.json({ message: "No access tokens provided" }, { status: 400 });
    }

    let events: Event[] = [];
    if (googleAccessToken) {
      const googleEvents = await fetchGoogleCalendarEvents(googleAccessToken);
      events = events.concat(googleEvents);
    }
    if (outlookAccessToken) {
      const outlookEvents = await fetchOutlookCalendarEvents(outlookAccessToken);
      events = events.concat(outlookEvents);
    }

    // Optionally, sort events by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[EVENTS_SYNC_POST] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
