import { Pool, QueryResult } from "pg";
import { Event } from "../types";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Disable SSL in development
  ssl: false,
});

// Test the database connection
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

export async function getAllEvents(userId: string): Promise<Event[]> {
  const { rows } = await pool.query<Event>(
    "SELECT id, title, start_time as start, end_time as end, type, priority, description, attendees FROM events WHERE user_id = $1 ORDER BY start_time",
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    start: row.start instanceof Date ? row.start.toISOString() : row.start,
    end: row.end instanceof Date ? row.end.toISOString() : row.end,
    attendees: row.attendees || [],
  }));
}

export async function getEvent(
  id: string,
  userId: string
): Promise<Event | null> {
  const { rows } = await pool.query<Event>(
    "SELECT id, title, start_time as start, end_time as end, type, priority, description, attendees FROM events WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  if (rows.length === 0) return null;

  const event = rows[0];
  return {
    ...event,
    start:
      event.start instanceof Date ? event.start.toISOString() : event.start,
    end: event.end instanceof Date ? event.end.toISOString() : event.end,
    attendees: event.attendees || [],
  };
}

export async function createEvent(
  event: Omit<Event, "id">,
  userId: string
): Promise<Event> {
  const client = await pool.connect();
  try {
    console.log("[DB] Creating event:", { event, userId });
    await client.query("BEGIN");

    const { rows } = await client.query<Event>(
      `INSERT INTO events (
        title, start_time, end_time, type, priority, description, attendees, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, title, start_time as start, end_time as end, type, priority, description, attendees`,
      [
        event.title,
        event.start,
        event.end,
        event.type,
        event.priority,
        event.description || null,
        event.attendees || [],
        userId,
      ]
    );

    await client.query("COMMIT");
    console.log("[DB] Event created successfully:", rows[0]);

    const created = rows[0];
    return {
      ...created,
      start:
        created.start instanceof Date
          ? created.start.toISOString()
          : created.start,
      end:
        created.end instanceof Date ? created.end.toISOString() : created.end,
      attendees: created.attendees || [],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[DB] Error creating event:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEvent(
  id: string,
  event: Partial<Event>,
  userId: string
): Promise<Event | null> {
  const client = await pool.connect();
  try {
    console.log("[DB] Updating event:", { id, event, userId });
    await client.query("BEGIN");

    const setFields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (event.title !== undefined) {
      setFields.push(`title = $${valueIndex}`);
      values.push(event.title);
      valueIndex++;
    }
    if (event.start !== undefined) {
      setFields.push(`start_time = $${valueIndex}`);
      values.push(event.start);
      valueIndex++;
    }
    if (event.end !== undefined) {
      setFields.push(`end_time = $${valueIndex}`);
      values.push(event.end);
      valueIndex++;
    }
    if (event.type !== undefined) {
      setFields.push(`type = $${valueIndex}`);
      values.push(event.type);
      valueIndex++;
    }
    if (event.priority !== undefined) {
      setFields.push(`priority = $${valueIndex}`);
      values.push(event.priority);
      valueIndex++;
    }
    if (event.description !== undefined) {
      setFields.push(`description = $${valueIndex}`);
      values.push(event.description);
      valueIndex++;
    }
    if (event.attendees !== undefined) {
      setFields.push(`attendees = $${valueIndex}`);
      values.push(event.attendees);
      valueIndex++;
    }

    if (setFields.length === 0) return null;

    values.push(id, userId);
    const { rows } = await client.query<Event>(
      `UPDATE events SET ${setFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
      RETURNING id, title, start_time as start, end_time as end, type, priority, description, attendees`,
      values
    );

    await client.query("COMMIT");
    console.log("[DB] Event updated successfully:", rows[0]);

    if (rows.length === 0) return null;

    const updated = rows[0];
    return {
      ...updated,
      start:
        updated.start instanceof Date
          ? updated.start.toISOString()
          : updated.start,
      end:
        updated.end instanceof Date ? updated.end.toISOString() : updated.end,
      attendees: updated.attendees || [],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[DB] Error updating event:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteEvent(
  id: string,
  userId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM events WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function saveEvent(
  event: Event & { userId: string }
): Promise<Event> {
  const { rows } = await pool.query(
    `INSERT INTO events (id, user_id, title, start_time, end_time, type, priority, description, attendees)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE
     SET title = $3, start_time = $4, end_time = $5, type = $6, priority = $7, description = $8, attendees = $9
     RETURNING id, title, start_time as start, end_time as end, type, priority, description, attendees`,
    [
      event.id,
      event.userId,
      event.title,
      event.start,
      event.end,
      event.type,
      event.priority,
      event.description,
      event.attendees || [],
    ]
  );

  return {
    ...rows[0],
    start:
      rows[0].start instanceof Date
        ? rows[0].start.toISOString()
        : rows[0].start,
    end: rows[0].end instanceof Date ? rows[0].end.toISOString() : rows[0].end,
    attendees: rows[0].attendees || [],
  };
}

export async function cleanupOldEvents(userId: string): Promise<void> {
  const currentDate = new Date();
  await pool.query("DELETE FROM events WHERE user_id = $1 AND end_time < $2", [
    userId,
    currentDate,
  ]);
}

export async function updateEventDetails(
  event: Event & { userId: string }
): Promise<Event> {
  const { rows } = await pool.query(
    `UPDATE events 
     SET title = $3, start_time = $4, end_time = $5, type = $6, priority = $7, description = $8, attendees = $9
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, start_time as start, end_time as end, type, priority, description, attendees`,
    [
      event.id,
      event.userId,
      event.title,
      event.start,
      event.end,
      event.type,
      event.priority,
      event.description,
      event.attendees || [],
    ]
  );

  if (rows.length === 0) {
    throw new Error("Event not found or not authorized");
  }

  return {
    ...rows[0],
    start:
      rows[0].start instanceof Date
        ? rows[0].start.toISOString()
        : rows[0].start,
    end: rows[0].end instanceof Date ? rows[0].end.toISOString() : rows[0].end,
    attendees: rows[0].attendees || [],
  };
}

export async function syncEvents(
  userId: string,
  newEvents: Event[]
): Promise<Event[]> {
  // First, get all existing events
  const existingEvents = await getAllEvents(userId);

  // Clean up old events
  await cleanupOldEvents(userId);

  // Update or insert new events
  for (const event of newEvents) {
    const existingEvent = existingEvents.find((e) => e.id === event.id);
    if (existingEvent) {
      // Update if the event has changed
      if (JSON.stringify(existingEvent) !== JSON.stringify(event)) {
        await updateEventDetails({ ...event, userId });
      }
    } else {
      // Insert new event
      await saveEvent({ ...event, userId });
    }
  }

  // Return all current events
  return getAllEvents(userId);
}
