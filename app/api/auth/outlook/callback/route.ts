import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("access_token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=no_token", request.url));
  }

  // Store the token in the user's session or database
  // For now, we'll redirect back to the main page with the token
  return NextResponse.redirect(
    new URL(`/?provider=outlook&token=${token}`, request.url)
  );
}
