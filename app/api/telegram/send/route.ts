import { NextRequest, NextResponse } from "next/server";
import { readTokens } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { text } = await req.json() as { text: string };
  const tokens = readTokens();

  if (!tokens.telegram?.chat_id) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tokens.telegram.chat_id, text, parse_mode: "HTML" }),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
