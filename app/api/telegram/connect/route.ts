import { NextRequest, NextResponse } from "next/server";
import { patchTokens } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { chat_id, username } = await req.json() as { chat_id: string; username?: string };
  if (!chat_id) return NextResponse.json({ error: "chat_id required" }, { status: 400 });
  patchTokens({ telegram: { chat_id, username } });
  return NextResponse.json({ ok: true });
}
