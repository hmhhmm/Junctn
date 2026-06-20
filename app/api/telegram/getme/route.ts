import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 503 });

  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json() as { ok: boolean; result?: { username: string; first_name: string } };
  if (!data.ok) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  return NextResponse.json({ username: data.result?.username, name: data.result?.first_name });
}
