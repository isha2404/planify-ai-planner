import { NextResponse } from "next/server";
// Make sure validateToken is exported from "@/lib/auth"
import { verifyToken } from "@/lib/auth";
// If validateToken is a default export, use:
// import validateToken from "@/lib/auth";
import { getAllEvents, createEvent } from "@/lib/data/events";
import { Event } from "@/lib/types";

// Import JWTPayload type if it exists, or define it here
import type { JWTPayload } from "@/lib/auth"; // Adjust the path if needed
// If not available, define it as follows:
// type JWTPayload = { [key: string]: any };

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const events = await getAllEvents(payload.id);
    return NextResponse.json(events);
  } catch (error) {
    console.error("[EVENTS_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    console.log("[EVENTS_POST] Token:", token?.substring(0, 20) + "...");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    console.log("[EVENTS_POST] Token payload:", payload);

    if (!payload || !payload.id) {
      return NextResponse.json(
        { message: "Invalid token or missing user ID" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("[EVENTS_POST] Creating event:", {
      body,
      userId: payload.id,
      tokenExpiry: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : "unknown",
    });

    const event = await createEvent(body as Omit<Event, "id">, payload.id);
    console.log("[EVENTS_POST] Event created:", event);
    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENTS_POST] Error:", error);
    if (error instanceof Error) {
      console.error("[EVENTS_POST] Error details:", error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
