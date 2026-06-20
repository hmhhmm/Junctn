import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthedClient } from "@/lib/google-client";

export async function GET() {
  try {
    const auth = await getAuthedClient();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 10,
    });

    const events = (data.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary ?? "No title",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      location: e.location,
      attendees: (e.attendees ?? []).map((a) => a.email).filter(Boolean),
      hangoutLink: e.hangoutLink,
      allDay: !e.start?.dateTime,
    }));

    return NextResponse.json({ events });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ events: [], error: "not_connected" }, { status: 401 });
    }
    console.error("Calendar API error", err);
    return NextResponse.json({ events: [], error: "api_error" }, { status: 500 });
  }
}
