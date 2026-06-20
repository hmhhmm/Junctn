"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Phone,
  MapPin,
  Building,
  ExternalLink,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  MessageSquareWarning,
  Network,
  FileWarning,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreateEventDialog } from "@/components/advisor/CreateEventDialog";
import type { Meeting } from "@/lib/types";
import type { AgentMeeting } from "@/hooks/useBriefingStream";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees: string[];
  hangoutLink?: string;
  allDay: boolean;
}

// ─── Mock meeting fallback (same styling as old ScheduleList) ────────────────

const mockFlagStyles = {
  followup: { icon: MessageSquareWarning, cls: "bg-alert-soft text-alert" },
  match: { icon: Network, cls: "bg-surface-raised text-ink-soft" },
  missing: { icon: FileWarning, cls: "bg-warn-soft text-warn" },
  logged: { icon: CheckCircle2, cls: "bg-ok-soft text-ok" },
} as const;

const mockChannelIcon = {
  "In person": MapPin,
  Video,
  Call: Phone,
  Office: Building,
} as const;

function MockMeetings({ meetings }: { meetings: Meeting[] }) {
  return (
    <ul className="flex flex-col">
      {meetings.map((mt, i) => {
        const Flag = mt.flag ? mockFlagStyles[mt.flag.kind] : null;
        const ChannelIcon = mockChannelIcon[mt.channel];
        const Inner = (
          <div className={cn("flex gap-4 py-3.5", i !== meetings.length - 1 && "border-b border-line")}>
            <div className="w-12 shrink-0 pt-0.5 text-right">
              <span className="font-mono text-[13px] font-medium text-ink">{mt.time}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">{mt.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-faint">
                <ChannelIcon className="size-3.5" />
                {mt.channel} · {mt.meta}
              </p>
              {mt.flag && Flag && (
                <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium", Flag.cls)}>
                  <Flag.icon className="size-3.5" />
                  {mt.flag.text}
                </span>
              )}
            </div>
          </div>
        );
        return (
          <li key={mt.id}>
            {mt.clientId ? (
              <Link href={`/advisor/clients/${mt.clientId}`} className="block rounded-md transition-colors hover:bg-surface-hover">
                {Inner}
              </Link>
            ) : Inner}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Real Google Calendar events ─────────────────────────────────────────────

function fmtTime(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function durationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function RealEvents({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="py-2 text-[13px] text-ink-faint">No more events today — clear schedule ahead.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {events.map((evt) => {
        const dur = evt.allDay ? null : durationMin(evt.start, evt.end);
        return (
          <li key={evt.id} className="flex gap-3 rounded-lg border border-line p-3" style={{ background: "var(--surface)" }}>
            <div
              className="mt-0.5 flex w-[52px] shrink-0 flex-col items-center justify-center rounded-md py-1 text-center"
              style={{ background: "var(--accent-soft)" }}
            >
              {evt.allDay ? (
                <span className="text-[10px] font-semibold text-accent-ink">All day</span>
              ) : (
                <>
                  <span className="text-[12px] font-bold leading-tight text-accent-ink">{fmtTime(evt.start)}</span>
                  {dur !== null && <span className="text-[10px] text-accent-ink opacity-70">{dur}m</span>}
                </>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{evt.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                {evt.location && (
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{evt.location}</span>
                )}
                {evt.hangoutLink && (
                  <a href={evt.hangoutLink} target="_blank" rel="noreferrer"
                     className="flex items-center gap-1 font-medium text-accent hover:underline">
                    <Video className="size-3" /> Join call <ExternalLink className="size-2.5" />
                  </a>
                )}
                {!evt.allDay && !evt.hangoutLink && !evt.location && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {fmtTime(evt.start)} – {fmtTime(evt.end)}
                  </span>
                )}
              </div>
              {evt.attendees.length > 0 && (
                <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                  {evt.attendees.slice(0, 3).join(", ")}
                  {evt.attendees.length > 3 && ` +${evt.attendees.length - 3}`}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Smart wrapper ────────────────────────────────────────────────────────────

function agentMeetingToMeeting(m: AgentMeeting): Meeting {
  return {
    id: m.id,
    advisorId: "",
    time: m.time,
    title: m.title,
    channel: m.channel as Meeting["channel"],
    meta: m.meta,
    clientId: m.client_id ?? undefined,
    flag: m.flag ? { kind: m.flag.kind as NonNullable<Meeting["flag"]>["kind"], text: m.flag.text } : undefined,
  };
}

interface Props {
  fallbackMeetings: Meeting[];
  agentMeetings?: AgentMeeting[];
}

export function LiveCalendar({ fallbackMeetings, agentMeetings }: Props) {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", month: "short", day: "numeric" });

  function load() {
    setLoading(true);
    fetch("/api/calendar/events")
      .then((r) => r.json())
      .then((d: { error?: string; events?: CalendarEvent[] }) => {
        if (d.error === "not_connected") {
          setConnected(false);
        } else {
          setConnected(true);
          setEvents(d.events ?? []);
        }
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card id="schedule">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-ink-soft" />
          Today&apos;s schedule
          {connected && (
            <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
              <CheckCircle2 className="size-2.5" /> Live
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint">{today}</span>
          {connected && (
            <CreateEventDialog onCreated={() => setTimeout(load, 800)} />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-ink-faint">
            <RefreshCw className="size-4 animate-spin" /> Loading…
          </div>
        ) : connected && events ? (
          <RealEvents events={events} />
        ) : (
          <>
            <MockMeetings meetings={agentMeetings && agentMeetings.length > 0
              ? agentMeetings.map(agentMeetingToMeeting)
              : fallbackMeetings}
            />
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-ink-faint">
              <CalendarDays className="size-3.5" />
              {agentMeetings && agentMeetings.length > 0
                ? "Showing AI-fetched schedule · "
                : "Showing sample data · "}
              <Link href="/advisor/settings" className="font-medium text-accent hover:underline">
                Connect Google Calendar for live events
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
