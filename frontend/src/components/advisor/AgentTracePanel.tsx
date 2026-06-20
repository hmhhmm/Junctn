"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import type { TraceEvent } from "@/hooks/useBriefingStream";

const AGENT_LABELS: Record<string, string> = {
  planner: "Planner",
  calendar_agent: "Calendar",
  client_memory_agent: "Client Memory",
  followup_agent: "Follow-ups",
  synthesiser: "Synthesiser",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

interface AgentTracePanelProps {
  traceEvents: TraceEvent[];
  isDone: boolean;
}

export function AgentTracePanel({ traceEvents, isDone }: AgentTracePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 transition-all duration-300"
      style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
    >
      {/* Collapse toggle tab */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-24 w-6 items-center justify-center rounded-l-md border border-r-0 border-line bg-surface text-ink-faint hover:text-ink"
        title={collapsed ? "Show agent trace" : "Hide agent trace"}
      >
        {collapsed ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>

      {/* Panel body */}
      {!collapsed && (
        <div className="flex w-72 flex-col rounded-l-none rounded-r-none border border-line bg-surface shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">
              Agent Trace
            </span>
            {isDone ? (
              <span className="flex items-center gap-1 text-[10px] text-ok">
                <CheckCircle2 className="size-3" /> Complete
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-accent">
                <Loader2 className="size-3 animate-spin" /> Running
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0 overflow-y-auto" style={{ maxHeight: "420px" }}>
            {traceEvents.length === 0 ? (
              <p className="px-3 py-4 text-[11px] text-ink-faint">Waiting for pipeline…</p>
            ) : (
              traceEvents.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 border-b border-line px-3 py-2.5 last:border-0"
                >
                  <div className="mt-0.5 shrink-0">
                    {event.status === "complete" ? (
                      <CheckCircle2 className="size-3.5 text-ok" />
                    ) : (
                      <Loader2 className="size-3.5 animate-spin text-accent" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-ink">
                      {AGENT_LABELS[event.agent] ?? event.agent}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-ink-faint">{event.summary}</p>
                    <p className="mt-0.5 text-[9px] text-ink-faint opacity-60">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
