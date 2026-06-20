import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthedClient } from "@/lib/server/google-client";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function fetchGmailThreads(): Promise<object[]> {
  try {
    const auth = await getAuthedClient();
    const gmail = google.gmail({ version: "v1", auth });

    const { data: listData } = await gmail.users.threads.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 10,
    });

    const threadItems = listData.threads ?? [];

    const threads = await Promise.all(
      threadItems.map(async (t) => {
        const { data } = await gmail.users.threads.get({
          userId: "me",
          id: t.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });
        const msg = data.messages?.[data.messages.length - 1];
        const headers = msg?.payload?.headers ?? [];
        const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
        const from = get("From");
        const nameMatch = from.match(/^(.+?)\s*</);
        const senderName = nameMatch ? nameMatch[1].replace(/"/g, "") : from;
        return {
          id: t.id,
          subject: get("Subject") || "(no subject)",
          from: senderName,
          date: get("Date"),
          snippet: data.messages?.[data.messages.length - 1]?.snippet ?? "",
          unread: (msg?.labelIds ?? []).includes("UNREAD"),
        };
      }),
    );

    return threads;
  } catch {
    // Not connected or API error — return empty so pipeline still runs
    return [];
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";

  // Fetch real Gmail threads to pass as context to the briefing pipeline.
  // Falls back to [] silently if Gmail is not connected.
  const gmailThreads = await fetchGmailThreads();

  try {
    const res = await fetch(`${BACKEND_URL}/briefing/generate`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ gmail_threads: gmailThreads }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "backend_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "backend_unavailable" }, { status: 503 });
  }
}
