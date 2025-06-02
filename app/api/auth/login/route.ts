import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { validateUser } from "@/lib/data/users";
import { type JWTPayload } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate user using file-based store
    const user = await validateUser(email, password);

    if (user) {
      const token = await createToken({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      // Set the token as an HTTP-only cookie
      response.cookies.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[AUTH_LOGIN]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
