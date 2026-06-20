import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export interface ApiPartnerMatch {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  region: string;
  score: number;
  reason: string;
  successRate: number;
  acceptanceRate: number;
  avgDaysToClose: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ matches: [], error: "backend_error" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ matches: [], error: "backend_unavailable" }, { status: 503 });
  }
}
