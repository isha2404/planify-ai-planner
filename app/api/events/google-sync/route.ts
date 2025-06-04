import { NextResponse } from "next/server";
import { fetchGoogleCalendarEvents } from "@/lib/services/google-calendar";
import { Event } from "@/lib/types";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "No access token provided" }, { status: 400 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { googleAccessToken } = await request.json();
    if (!googleAccessToken) {
      return NextResponse.json({ message: "No Google access token provided" }, { status: 400 });
    }

    let events: Event[] = [];
    const googleEvents = await fetchGoogleCalendarEvents(googleAccessToken);
    events = events.concat(googleEvents);
    
    // Sort events by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[GOOGLE_CALENDAR_SYNC] Error:", error);
    return NextResponse.json(
      { message: "Failed to sync Google calendar" },
      { status: 500 }
    );
  }
}
