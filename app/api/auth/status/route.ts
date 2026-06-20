import { NextResponse } from "next/server";
import { readTokens } from "@/lib/tokens";

export function GET() {
  const tokens = readTokens();
  return NextResponse.json({
    google: tokens.google
      ? { connected: true, email: tokens.google.email }
      : { connected: false },
    telegram: tokens.telegram
      ? { connected: true, username: tokens.telegram.username }
      : { connected: false },
    googleCredsConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    telegramCredsConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}
