import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export interface CpdSearchResult {
  id: string;
  title: string;
  topic: string;
  credits: number;
  durationMin: number;
  required: boolean;
  score: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/cpd/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: "backend_error" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [], error: "backend_unavailable" }, { status: 503 });
  }
}
