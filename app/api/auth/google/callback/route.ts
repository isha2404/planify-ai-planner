import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // If there's an error, redirect to the main page with an error parameter
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }?error=${error}`
    );
  }

  if (!code) {
    // If no code is provided, redirect to the main page with an error
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }?error=no_code`
    );
  }

  // Redirect back to the main page with the authorization code
  // The frontend will handle exchanging the code for tokens
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?code=${code}`
  );
}
