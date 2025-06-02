import { NextResponse } from "next/server";
// import validateToken from "@/lib/auth";
import { verifyToken } from "@/lib/auth";
import { getEvent, updateEvent, deleteEvent } from "@/lib/data/events";
import { Event } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    try {
      const event = await getEvent(params.id, payload.id);
      if (!event) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
      }
      return NextResponse.json(event);
    } catch (getError) {
      console.error("[EVENT_GET] Get error:", getError);
      return NextResponse.json(
        { message: getError instanceof Error ? getError.message : "Failed to get event" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[EVENT_GET] Auth error:", error);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    try {
      const eventData = await request.json();
      const eventId = params.id;

      // Verify the event exists and belongs to the user
      const existingEvent = await getEvent(eventId, payload.id);
      if (!existingEvent) {
        return NextResponse.json(
          { message: "Event not found or unauthorized" },
          { status: 404 }
        );
      }

      // Validate event data
      if (!eventData.title || !eventData.start || !eventData.end) {
        return NextResponse.json(
          { message: "Missing required event fields" },
          { status: 400 }
        );
      }

      // Validate date range
      const startDate = new Date(eventData.start);
      const endDate = new Date(eventData.end);
      if (startDate >= endDate) {
        return NextResponse.json(
          { message: "Event end time must be after start time" },
          { status: 400 }
        );
      }

      // Update the event
      const updatedEventData: Event = {
        ...existingEvent,
        ...eventData,
        id: eventId,
      };

      const updatedEvent = await updateEvent(eventId, updatedEventData, payload.id);
      if (!updatedEvent) {
        return NextResponse.json(
          { message: "Failed to update event" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(updatedEvent);
    } catch (error) {
      console.error("[EVENT_UPDATE] Operation error:", error);
      return NextResponse.json(
        { 
          message: error instanceof Error 
            ? error.message 
            : "Failed to update event"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[EVENT_UPDATE] Auth error:", error);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    try {
      const success = await deleteEvent(params.id, payload.id);
      if (!success) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Event deleted successfully" });
    } catch (deleteError) {
      console.error("[EVENT_DELETE] Delete error:", deleteError);
      return NextResponse.json(
        { message: deleteError instanceof Error ? deleteError.message : "Failed to delete event" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[EVENT_DELETE] Auth error:", error);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
