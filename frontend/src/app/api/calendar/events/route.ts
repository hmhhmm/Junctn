import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthedClient } from "@/lib/server/google-client";

export async function GET() {
  try {
    const auth = await getAuthedClient();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(), // full day, not just from now
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

interface CreateEventBody {
  title: string;
  date: string;         // YYYY-MM-DD
  startTime?: string;   // HH:MM — omit for all-day
  endTime?: string;     // HH:MM
  location?: string;
  description?: string;
  attendees?: string[]; // email addresses
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateEventBody;
    const { title, date, startTime, endTime, location, description, attendees } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "title and date are required" }, { status: 400 });
    }

    const auth = await getAuthedClient();
    const calendar = google.calendar({ version: "v3", auth });

    const isAllDay = !startTime;

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        location,
        description,
        ...(isAllDay
          ? { start: { date }, end: { date } }
          : {
              start: { dateTime: `${date}T${startTime}:00`, timeZone: "Asia/Singapore" },
              end:   { dateTime: `${date}T${endTime ?? startTime}:00`, timeZone: "Asia/Singapore" },
            }),
        attendees: attendees?.map((email) => ({ email })),
      },
    });
    return NextResponse.json({ event: { id: data.id, link: data.htmlLink } });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }
    const status = (err as { code?: number }).code;
    if (status === 403) {
      return NextResponse.json({ error: "insufficient_scope" }, { status: 403 });
    }
    console.error("Create event error", err);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
