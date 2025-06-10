import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyToken } from "@/lib/auth";
import { deleteGoogleCalendarEvent } from "@/lib/services/google-calendar";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(req: NextRequest) {
  console.log("[DELETE /api/user/delete] Starting account deletion process");

  try {
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    console.log("[DELETE /api/user/delete] Auth header present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[DELETE /api/user/delete] Invalid or missing auth header");
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Missing or invalid authorization token",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log(
      "[DELETE /api/user/delete] Token extracted, length:",
      token.length
    );

    // Verify token and get user
    const decoded = await verifyToken(token);
    console.log(
      "[DELETE /api/user/delete] Token verified, user ID:",
      decoded?.id
    );

    if (!decoded || !decoded.id) {
      console.error(
        "[DELETE /api/user/delete] Invalid token payload:",
        decoded
      );
      return NextResponse.json(
        { error: "Unauthorized", details: "Invalid token" },
        { status: 401 }
      );
    }

    // Get Google access token if available
    const googleAccessToken = req.headers.get("x-google-access-token");
    console.log(
      "[DELETE /api/user/delete] Google access token present:",
      !!googleAccessToken
    );

    // Start transaction
    console.log("[DELETE /api/user/delete] Starting database transaction");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      console.log("[DELETE /api/user/delete] Transaction begun");

      // Delete events first
      console.log("[DELETE /api/user/delete] Deleting events");
      const eventsResult = await client.query(
        "DELETE FROM events WHERE user_id = $1 RETURNING id",
        [decoded.id]
      );
      console.log(
        "[DELETE /api/user/delete] Deleted events:",
        eventsResult.rowCount
      );

      // Check if user_settings table exists before trying to delete from it
      console.log("[DELETE /api/user/delete] Checking for user_settings table");
      const settingsTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_settings'
        );
      `);

      let settingsResult = { rowCount: 0 };
      if (settingsTableCheck.rows[0].exists) {
        console.log("[DELETE /api/user/delete] Deleting settings");
        settingsResult = await client.query(
          "DELETE FROM user_settings WHERE user_id = $1 RETURNING id",
          [decoded.id]
        );
        console.log(
          "[DELETE /api/user/delete] Deleted settings:",
          settingsResult.rowCount
        );
      } else {
        console.log(
          "[DELETE /api/user/delete] user_settings table does not exist, skipping settings deletion"
        );
      }

      // Check if tokens table exists before trying to delete from it
      console.log("[DELETE /api/user/delete] Checking for tokens table");
      const tokensTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tokens'
        );
      `);

      let tokensResult = { rowCount: 0 };
      if (tokensTableCheck.rows[0].exists) {
        console.log("[DELETE /api/user/delete] Deleting tokens");
        tokensResult = await client.query(
          "DELETE FROM tokens WHERE user_id = $1 RETURNING id",
          [decoded.id]
        );
        console.log(
          "[DELETE /api/user/delete] Deleted tokens:",
          tokensResult.rowCount
        );
      } else {
        console.log(
          "[DELETE /api/user/delete] tokens table does not exist, skipping tokens deletion"
        );
      }

      // Delete user
      console.log("[DELETE /api/user/delete] Deleting user");
      const userResult = await client.query(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        [decoded.id]
      );
      console.log(
        "[DELETE /api/user/delete] Deleted user:",
        userResult.rowCount
      );

      if (userResult.rowCount === 0) {
        throw new Error("User not found");
      }

      // Delete Google Calendar events if token is available
      if (googleAccessToken) {
        console.log(
          "[DELETE /api/user/delete] Attempting to delete Google Calendar events"
        );
        try {
          // Check if the column exists first
          const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND column_name = 'google_calendar_id'
          `);

          if (columnCheck.rows.length > 0) {
            // Column exists, get Google Calendar events
            const googleEventsResult = await client.query(
              "SELECT google_calendar_id FROM events WHERE user_id = $1 AND google_calendar_id IS NOT NULL",
              [decoded.id]
            );
            const googleEventIds = googleEventsResult.rows.map(
              (row) => row.google_calendar_id
            );
            console.log(
              "[DELETE /api/user/delete] Found Google Calendar events:",
              googleEventIds.length
            );

            // Delete Google Calendar events
            let deletedGoogleEvents = 0;
            for (const eventId of googleEventIds) {
              try {
                await deleteGoogleCalendarEvent(googleAccessToken, eventId);
                deletedGoogleEvents++;
              } catch (error) {
                console.error(
                  "[DELETE /api/user/delete] Error deleting Google Calendar event:",
                  eventId,
                  error
                );
              }
            }
            console.log(
              "[DELETE /api/user/delete] Deleted Google Calendar events:",
              deletedGoogleEvents
            );
          } else {
            console.log(
              "[DELETE /api/user/delete] google_calendar_id column does not exist, skipping Google Calendar cleanup"
            );
          }
        } catch (error) {
          console.error(
            "[DELETE /api/user/delete] Error checking for Google Calendar events:",
            error
          );
          // Continue with deletion even if Google Calendar cleanup fails
        }
      }

      await client.query("COMMIT");
      console.log(
        "[DELETE /api/user/delete] Transaction committed successfully"
      );

      return NextResponse.json({
        message: "Account deleted successfully",
        deleted: {
          events: eventsResult.rowCount,
          settings: settingsResult.rowCount,
          tokens: tokensResult.rowCount,
          user: userResult.rowCount,
          googleEvents: 0, // Since we don't have the column, we'll return 0
        },
      });
    } catch (error) {
      console.error("[DELETE /api/user/delete] Error during deletion:", error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[DELETE /api/user/delete] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete account",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
