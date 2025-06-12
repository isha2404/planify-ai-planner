import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { Event } from "@/lib/types";

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Get events from request body
    const { events } = await request.json();
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { message: "Invalid request: events must be an array" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update each event
      for (const event of events) {
        // Verify the event belongs to the user
        const ownershipCheck = await client.query(
          "SELECT user_id FROM events WHERE id = $1",
          [event.id]
        );

        if (ownershipCheck.rows.length === 0) {
          throw new Error(`Event ${event.id} not found`);
        }

        if (ownershipCheck.rows[0].user_id !== userId) {
          throw new Error(`Not authorized to update event ${event.id}`);
        }

        // Update the event
        await client.query(
          `UPDATE events 
           SET title = $1, 
               start_time = $2, 
               end_time = $3, 
               type = $4, 
               priority = $5, 
               description = $6, 
               attendees = $7
           WHERE id = $8 AND user_id = $9`,
          [
            event.title,
            event.start,
            event.end,
            event.type,
            event.priority,
            event.description,
            event.attendees || [],
            event.id,
            userId,
          ]
        );
      }

      // Commit the transaction
      await client.query("COMMIT");

      return NextResponse.json({ message: "Events updated successfully" });
    } catch (error) {
      // Rollback in case of error
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[API] Error updating events:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update events",
      },
      { status: 500 }
    );
  }
}
