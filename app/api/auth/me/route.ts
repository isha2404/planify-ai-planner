import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { type JWTPayload } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token.value);

    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { iat, exp, ...user } = payload;
    return NextResponse.json(user);
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
