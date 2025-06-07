import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { pool } from "@/lib/db";

interface Event {
  id: string;
  title: string;
  start_time: string | Date;
  end_time: string | Date;
  created_at?: string | Date;
  user_id: string;
  type: string;
  priority: string;
  description?: string;
  attendees?: string[];
  google_calendar_id?: string;
}

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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get all events for the user
      const { rows: events } = await client.query<Event>(
        "SELECT * FROM events WHERE user_id = $1 ORDER BY start_time",
        [payload.id]
      );

      // Group events by title, start time, and end time
      const eventGroups = new Map<string, Event[]>();
      events.forEach((event: Event) => {
        const key = `${event.title}_${event.start_time}_${event.end_time}`;
        if (!eventGroups.has(key)) {
          eventGroups.set(key, []);
        }
        eventGroups.get(key)?.push(event);
      });

      // Process each group of duplicate events
      const deletedEvents: Event[] = [];
      const keptEvents: Event[] = [];

      for (const [key, group] of Array.from(eventGroups.entries())) {
        if (group.length > 1) {
          // Sort by creation time (assuming there's a created_at column)
          // If no created_at, use id as a fallback
          group.sort((a: Event, b: Event) => {
            if (a.created_at && b.created_at) {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            }
            return a.id.localeCompare(b.id);
          });

          // Keep the oldest event (first in the sorted array)
          const eventToKeep = group[0];
          keptEvents.push(eventToKeep);

          // Delete the rest
          for (let i = 1; i < group.length; i++) {
            const eventToDelete = group[i];
            await client.query("DELETE FROM events WHERE id = $1", [
              eventToDelete.id,
            ]);
            deletedEvents.push(eventToDelete);
          }
        } else {
          // No duplicates, keep the single event
          keptEvents.push(group[0]);
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        message: "Cleanup completed successfully",
        stats: {
          totalEvents: events.length,
          keptEvents: keptEvents.length,
          deletedEvents: deletedEvents.length,
        },
        deletedEvents: deletedEvents.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start_time,
          end: e.end_time,
        })),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[EVENTS_CLEANUP]", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
