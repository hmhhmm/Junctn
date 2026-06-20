import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";
  try {
    const res = await fetch(`${BACKEND_URL}/briefing/generate`, {
      method: "POST",
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "backend_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "backend_unavailable" }, { status: 503 });
  }
}
