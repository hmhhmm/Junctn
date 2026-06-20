import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/server/google-client";

export function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set in .env.local" }, { status: 503 });
  }
  return NextResponse.redirect(getAuthUrl());
}
