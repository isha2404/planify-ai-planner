import { NextResponse } from "next/server";

async function exchangeCodeForTokens(code: string) {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    console.log("Token exchange - Redirect URI:", redirectUri); // Debug log

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    console.log("Token exchange - Request params:", {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }); // Debug log

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Token exchange error response:", data);
      throw new Error(
        data.error_description ||
          data.error ||
          "Failed to exchange code for tokens"
      );
    }

    return data;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { message: "No code provided" },
        { status: 400 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    ) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json(
        { message: "Google OAuth credentials not configured" },
        { status: 500 }
      );
    }

    const tokens = await exchangeCodeForTokens(code);

    // Store the refresh token securely (you might want to store this in your database)
    // For now, we'll just return the access token
    return NextResponse.json({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  } catch (error) {
    console.error("[GOOGLE_TOKEN_EXCHANGE]", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to exchange token",
      },
      { status: 500 }
    );
  }
}
