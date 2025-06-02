import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { addUser, findUserByEmail } from "@/lib/data/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Create and save new user
    const newUser = await addUser({ email, password, name });
    const token = await createToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
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
  } catch (error) {
    console.error("[AUTH_SIGNUP]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
