"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, CheckSquare, X, Plus, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "event" | "task";

interface Props {
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateEventDialog({ onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("event");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ link?: string; title?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Event fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");

  // Task fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(todayStr());
  const [taskNotes, setTaskNotes] = useState("");

  function reset() {
    setTitle(""); setDate(todayStr()); setStartTime(""); setEndTime("");
    setLocation(""); setDescription(""); setAttendees("");
    setTaskTitle(""); setTaskDue(todayStr()); setTaskNotes("");
    setResult(null); setError(null);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      if (mode === "event") {
        if (!title.trim()) { setError("Title is required."); return; }
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            date,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            location: location || undefined,
            description: description || undefined,
            attendees: attendees.split(",").map((e) => e.trim()).filter(Boolean),
          }),
        });
        const d = await res.json() as { event?: { link?: string }; error?: string };
        if (res.status === 403 && d.error === "insufficient_scope") { setError("__reauth__"); return; }
        if (!res.ok || d.error) throw new Error(d.error ?? "Failed to create event");
        setResult({ link: d.event?.link, title: title.trim() });
      } else {
        if (!taskTitle.trim()) { setError("Title is required."); return; }
        const res = await fetch("/api/calendar/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle.trim(),
            due: taskDue ? `${taskDue}T00:00:00Z` : undefined,
            notes: taskNotes || undefined,
          }),
        });
        const d = await res.json() as { task?: { title?: string }; error?: string };
        if (res.status === 403 && d.error === "tasks_api_disabled") { setError("__tasks_disabled__"); return; }
        if (res.status === 403 && d.error === "insufficient_scope") { setError("__reauth__"); return; }
        if (!res.ok || d.error) throw new Error(d.error ?? "Failed to create task");
        setResult({ title: taskTitle.trim() });
      }
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button variant="soft" size="sm">
            <Plus className="size-3.5" /> Add
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line p-6 shadow-2xl"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-[16px] font-semibold text-ink">
              Add to Google Calendar
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-hover hover:text-ink">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {/* Mode tabs */}
          <div className="mt-4 flex gap-1 rounded-xl p-1" style={{ background: "var(--surface-raised)" }}>
            {(["event", "task"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium transition-all"
                style={mode === m
                  ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "var(--ink-soft)" }}
              >
                {m === "event" ? <CalendarDays className="size-3.5" /> : <CheckSquare className="size-3.5" />}
                {m === "event" ? "Event" : "Task"}
              </button>
            ))}
          </div>

          {result ? (
            // Success state
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full"
                   style={{ background: "var(--ok-soft)" }}>
                {mode === "event"
                  ? <CalendarDays className="size-6" style={{ color: "var(--ok)" }} />
                  : <CheckSquare className="size-6" style={{ color: "var(--ok)" }} />}
              </div>
              <p className="text-[14px] font-semibold text-ink">
                {mode === "event" ? "Event created!" : "Task added!"}
              </p>
              <p className="text-[12px] text-ink-soft">&ldquo;{result.title}&rdquo;</p>
              {result.link && (
                <a href={result.link} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                  Open in Google Calendar <ExternalLink className="size-3" />
                </a>
              )}
              <div className="mt-2 flex gap-2">
                <Button variant="soft" size="sm" onClick={() => { reset(); }}>Add another</Button>
                <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Done</Button>
              </div>
            </div>
          ) : (
            // Form
            <div className="mt-5 flex flex-col gap-3">
              {mode === "event" ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Title *</label>
                    <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
                           placeholder="e.g. Client review — Sarah Lim" autoFocus />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Date *</label>
                      <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Start</label>
                      <input type="time" className={inputCls} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">End</label>
                      <input type="time" className={inputCls} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Location</label>
                    <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}
                           placeholder="Address, building, or Meet link" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Attendees</label>
                    <input className={inputCls} value={attendees} onChange={(e) => setAttendees(e.target.value)}
                           placeholder="email@example.com, another@example.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Notes</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Agenda, prep notes…" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Task *</label>
                    <input className={inputCls} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                           placeholder="e.g. Send proposal to David Tan" autoFocus />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Due date</label>
                    <input type="date" className={inputCls} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Notes</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={taskNotes}
                              onChange={(e) => setTaskNotes(e.target.value)}
                              placeholder="Context, client details…" />
                  </div>
                </>
              )}

              {error === "__tasks_disabled__" ? (
                <div className="rounded-lg border p-4" style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: "var(--warn)" }} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--warn)" }}>
                        Google Tasks API not enabled
                      </p>
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                        Enable the Google Tasks API in your Google Cloud Console, then reconnect.
                      </p>
                      <ol className="mt-1.5 list-decimal pl-4 text-[11px]" style={{ color: "var(--ink-soft)" }}>
                        <li>Go to Google Cloud Console → APIs &amp; Services → Library</li>
                        <li>Search &ldquo;Google Tasks API&rdquo; → Enable</li>
                        <li>Go to Settings → Disconnect Google → Connect again</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : error === "__reauth__" ? (
                <div className="rounded-lg border p-4" style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: "var(--warn)" }} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--warn)" }}>
                        {mode === "task" ? "Google Tasks access needed" : "Calendar write access needed"}
                      </p>
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                        Your Google token was granted before {mode === "task" ? "Tasks" : "Calendar write"} permission was added. Reconnect to get the new scope.
                      </p>
                      <a href="/advisor/settings" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                        Go to Settings → Disconnect Google → Connect again
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <p className="rounded-lg px-3 py-2 text-[12px]"
                   style={{ background: "var(--alert-soft)", color: "var(--alert)" }}>
                  {error}
                </p>
              ) : null}

              <Button variant="primary" className="mt-1 w-full" onClick={submit} disabled={loading}>
                {loading
                  ? <><Loader2 className="size-4 animate-spin" /> Creating…</>
                  : mode === "event" ? "Create event" : "Add task"}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
