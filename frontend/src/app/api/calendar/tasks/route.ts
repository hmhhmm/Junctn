import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthedClient } from "@/lib/server/google-client";

export async function GET() {
  try {
    const auth = await getAuthedClient();
    const tasks = google.tasks({ version: "v1", auth });

    const { data } = await tasks.tasks.list({
      tasklist: "@default",
      showCompleted: false,
      maxResults: 20,
    });

    const items = (data.items ?? []).map((t) => ({
      id: t.id,
      title: t.title ?? "",
      due: t.due,
      notes: t.notes,
      status: t.status,
    }));

    return NextResponse.json({ tasks: items });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ tasks: [], error: "not_connected" }, { status: 401 });
    }
    console.error("Tasks API error", err);
    return NextResponse.json({ tasks: [], error: "api_error" }, { status: 500 });
  }
}

interface CreateTaskBody {
  title: string;
  due?: string;    // RFC 3339 date string e.g. "2024-06-20T00:00:00Z"
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateTaskBody;
    const { title, due, notes } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const auth = await getAuthedClient();
    const tasks = google.tasks({ version: "v1", auth });

    const { data } = await tasks.tasks.insert({
      tasklist: "@default",
      requestBody: { title, due, notes, status: "needsAction" },
    });

    return NextResponse.json({ task: { id: data.id, title: data.title } });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }
    if ((err as { code?: number }).code === 403) {
      const msg = (err as { message?: string }).message ?? "";
      console.error("[Tasks 403] Google error:", msg);
      const error =
        msg.includes("has not been used") || msg.includes("is not enabled") || msg.includes("accessNotConfigured")
          ? "tasks_api_disabled"
          : "insufficient_scope";
      return NextResponse.json({ error }, { status: 403 });
    }
    console.error("Create task error", err);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, completed } = await req.json() as { id: string; completed: boolean };
    const auth = await getAuthedClient();
    const tasks = google.tasks({ version: "v1", auth });

    await tasks.tasks.patch({
      tasklist: "@default",
      task: id,
      requestBody: { status: completed ? "completed" : "needsAction" },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
