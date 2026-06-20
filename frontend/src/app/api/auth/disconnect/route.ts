import { NextRequest, NextResponse } from "next/server";
import { readTokens, writeTokens } from "@/lib/server/tokens";

export async function POST(req: NextRequest) {
  const { service } = await req.json() as { service: "google" | "telegram" };
  const tokens = readTokens();
  if (service === "google") delete tokens.google;
  if (service === "telegram") delete tokens.telegram;
  writeTokens(tokens);
  return NextResponse.json({ ok: true });
}
