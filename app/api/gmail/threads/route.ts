import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthedClient } from "@/lib/google-client";

export async function GET() {
  try {
    const auth = await getAuthedClient();
    const gmail = google.gmail({ version: "v1", auth });

    // Fetch 8 most recent inbox threads
    const { data: listData } = await gmail.users.threads.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 8,
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
        const get = (name: string) =>
          headers.find((h) => h.name === name)?.value ?? "";

        const from = get("From");
        const nameMatch = from.match(/^(.+?)\s*</) ;
        const senderName = nameMatch ? nameMatch[1].replace(/"/g, "") : from;

        return {
          id: t.id,
          subject: get("Subject") || "(no subject)",
          from: senderName,
          fromEmail: from.match(/<(.+?)>/)?.[1] ?? from,
          date: get("Date"),
          snippet: data.messages?.[0]?.snippet ?? "",
          unread: (msg?.labelIds ?? []).includes("UNREAD"),
          messageCount: data.messages?.length ?? 1,
        };
      }),
    );

    return NextResponse.json({ threads });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ threads: [], error: "not_connected" }, { status: 401 });
    }
    console.error("Gmail API error", err);
    return NextResponse.json({ threads: [], error: "api_error" }, { status: 500 });
  }
}
