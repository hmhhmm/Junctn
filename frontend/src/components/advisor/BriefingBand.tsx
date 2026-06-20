"use client";

import { useState } from "react";
import {
  Sparkles, ArrowRight, ListChecks, MessageSquare, X,
  Users, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { draftFollowup } from "@/lib/api";
import { getClientsByAdvisor } from "@/lib/data";
import type { TraceEvent } from "@/hooks/useBriefingStream";

// ── Daily quote ────────────────────────────────────────────────────────────

const ADVISOR_QUOTES = [
  { text: "Your clients don't care how much you know until they know how much you care.", author: "Theodore Roosevelt" },
  { text: "The best investment you can make is in the relationships you build.", author: "Warren Buffett" },
  { text: "Trust is built with consistency.", author: "Lincoln Chafee" },
  { text: "A financial plan is not just a document — it's a promise to your client's future self.", author: "" },
  { text: "Excellence is not a singular act, but a habit. You are what you repeatedly do.", author: "Aristotle" },
  { text: "Great advisors don't just manage wealth — they help clients live purposefully.", author: "" },
  { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it.", author: "Albert Einstein" },
  { text: "Every client interaction is an opportunity to deepen trust that no market event can erode.", author: "" },
  { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
  { text: "In every meeting, listen twice as much as you speak.", author: "" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "The goal of investing is not to simply optimise returns and minimise risk — it's to choose the right balance.", author: "" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return ADVISOR_QUOTES[dayOfYear % ADVISOR_QUOTES.length];
}

// ── Section parsing ────────────────────────────────────────────────────────

interface Section {
  type: "FOLLOWUPS";
  content: string;
}

const SECTION_META: Record<Section["type"], { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  FOLLOWUPS: { label: "Follow-ups", Icon: Users, color: "#fbbf24", bg: "rgba(180,83,9,0.15)" },
};

function parseSections(text: string): Section[] {
  const idx = text.indexOf("[FOLLOWUPS]");
  if (idx === -1) return [];
  const start = idx + "[FOLLOWUPS]".length;
  // Stop at [CALENDAR] or [LD] if either appears after FOLLOWUPS
  const stops = ["[CALENDAR]", "[LD]"]
    .map((tag) => text.indexOf(tag, start))
    .filter((i) => i !== -1);
  const end = stops.length > 0 ? Math.min(...stops) : text.length;
  const content = text.slice(start, end).trim();
  return content.length > 0 ? [{ type: "FOLLOWUPS", content }] : [];
}

function extractClientName(line: string): string {
  const match = line.match(/^[•\-]\s*([A-Z][a-zA-Z\s]+?)[\s(—]/);
  return match?.[1]?.trim() ?? "";
}

// ── Follow-up draft modal ──────────────────────────────────────────────────

interface FollowupDraftModalProps {
  clientId: string;
  clientName: string;
  token: string;
  onClose: () => void;
}

function FollowupDraftModal({ clientId, clientName, token, onClose }: FollowupDraftModalProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await draftFollowup(token, clientId);
      setDraft(res.draft);
    } catch {
      setDraft("Unable to generate draft — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Draft follow-up for ${clientName}`}>
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-ink-faint hover:text-ink" aria-label="Close">
          <X className="size-4" />
        </button>
        <p className="mb-1 text-[11px] font-semibold text-ink-faint">Draft follow-up</p>
        <h3 className="mb-4 text-[16px] font-bold text-ink">{clientName}</h3>
        {!draft ? (
          <Button onClick={generate} disabled={loading} size="sm" className="bg-accent text-white">
            {loading ? "Generating…" : "Generate draft"}
          </Button>
        ) : (
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-surface-raised p-4 font-mono text-[13px] leading-relaxed text-ink">
            {draft}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Agent trace (inline) ───────────────────────────────────────────────────

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

interface InlineTraceProps {
  traceEvents: TraceEvent[];
  isDone: boolean;
}

function InlineTrace({ traceEvents, isDone }: InlineTraceProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-white/50 transition-colors hover:text-white/80"
        aria-expanded={open}
        aria-controls="agent-trace-panel"
      >
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        Agent trace
        {!isDone && <Loader2 className="size-3 animate-spin" />}
        {isDone && <CheckCircle2 className="size-3 text-ok" />}
      </button>

      {open && (
        <div
          id="agent-trace-panel"
          className="mt-2 flex flex-col gap-0 overflow-hidden rounded-lg border border-white/10"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          aria-live="polite"
          aria-label="Agent pipeline trace"
        >
          {traceEvents.length === 0 ? (
            <p className="px-3 py-2.5 text-[11px] text-white/40">Waiting for pipeline…</p>
          ) : (
            traceEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-2.5 border-b border-white/10 px-3 py-2 last:border-0" style={{ background: "rgba(0,0,0,0.2)" }}>
                <div className="mt-0.5 shrink-0">
                  {event.status === "complete"
                    ? <CheckCircle2 className="size-3.5 text-ok" />
                    : <Loader2 className="size-3.5 animate-spin text-teal-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white/80">{AGENT_LABELS[event.agent] ?? event.agent}</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/40">{event.summary}</p>
                </div>
                <p className="shrink-0 text-[9px] text-white/30">{formatTime(event.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── BriefingBand ───────────────────────────────────────────────────────────

interface BriefingBandProps {
  tokens: string;
  isStreaming: boolean;
  error: string | null;
  fallbackText?: string;
  token?: string;
  advisorId?: string;
  traceEvents?: TraceEvent[];
  isDone?: boolean;
  onRetry?: () => void;
}

export function BriefingBand({
  tokens,
  isStreaming,
  error,
  fallbackText,
  token,
  advisorId,
  traceEvents = [],
  isDone = false,
  onRetry,
}: BriefingBandProps) {
  const [draftTarget, setDraftTarget] = useState<{ clientId: string; clientName: string } | null>(null);

  function resolveClientId(name: string): string {
    if (!advisorId) return "";
    const lower = name.toLowerCase();
    const match = getClientsByAdvisor(advisorId).find(
      (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.split(" ")[0].toLowerCase()),
    );
    return match?.id ?? "";
  }

  const displayText = tokens || fallbackText || "";
  const sections = parseSections(displayText);
  const hasContent = sections.length > 0;
  const hasAnyText = displayText.trim().length > 0;
  const showTrace = traceEvents.length > 0 || isStreaming;

  return (
    <>
      {draftTarget && token && (
        <FollowupDraftModal
          clientId={draftTarget.clientId}
          clientName={draftTarget.clientName}
          token={token}
          onClose={() => setDraftTarget(null)}
        />
      )}

      <section
        className="relative overflow-hidden rounded-2xl p-7 text-white"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 55%, #0a2218 100%)" }}
        aria-label="Morning briefing"
      >
        {/* Texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #0f766e 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }} aria-hidden="true" />

        <div className="relative">
          {/* Header chip */}
          <div
            className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
            style={{ background: "rgba(15,118,110,0.22)", border: "1px solid rgba(94,234,212,0.2)", color: "#5eead4" }}
          >
            <Sparkles className="size-3" aria-hidden="true" />
            Morning Briefing
            {isStreaming && (
              <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-teal-400" aria-label="Generating" />
            )}
          </div>

          {/* Content */}
          {error ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[15px] font-medium text-amber-300">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[12px] font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
                >
                  <RefreshCw className="size-3.5" />
                  Retry
                </button>
              )}
            </div>
          ) : !hasAnyText ? (
            /* Skeleton */
            <div className="space-y-2.5" aria-label="Loading briefing" aria-busy="true">
              <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-white/10" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-white/10" />
              <div className="mt-1 h-3.5 w-5/6 animate-pulse rounded-full bg-white/10" />
            </div>
          ) : hasContent ? (
            <div className="space-y-5">
              {sections.map((section) => {
                const meta = SECTION_META[section.type];
                return (
                  <div key={section.type}>
                    {/* Section header — replaces side-stripe */}
                    <div
                      className="mb-2.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                      style={{ background: meta.bg }}
                    >
                      <meta.Icon className="size-3.5 shrink-0" style={{ color: meta.color }} aria-hidden="true" />
                      <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="space-y-1 pl-1">
                      {section.content.split("\n").map((line, i) => {
                        if (!line.trim()) return null;
                        const clientName = section.type === "FOLLOWUPS" ? extractClientName(line) : "";
                        return (
                          <div key={i} className="flex items-start gap-2">
                            <p className="flex-1 text-[14px] leading-relaxed text-white/85">{line}</p>
                            {section.type === "FOLLOWUPS" && clientName && token && (
                              <button
                                onClick={() => setDraftTarget({ clientId: resolveClientId(clientName), clientName })}
                                className="mt-0.5 shrink-0 rounded p-1 text-white/40 transition hover:text-amber-300"
                                title={`Draft follow-up for ${clientName}`}
                                aria-label={`Draft follow-up for ${clientName}`}
                              >
                                <MessageSquare className="size-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {isStreaming && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-teal-400" aria-hidden="true" />
              )}
            </div>
          ) : (
            /* Plain fallback text */
            <p className="max-w-3xl text-[14px] leading-relaxed text-white/85">{displayText}</p>
          )}

          {/* Daily quote */}
          {!isStreaming && hasAnyText && !error && (() => {
            const q = getDailyQuote();
            return (
              <div className="mt-5 rounded-lg border border-white/8 bg-white/4 px-4 py-3" aria-hidden="true">
                <p className="text-[12px] italic leading-relaxed text-white/50">
                  &ldquo;{q.text}&rdquo;
                </p>
                {q.author && (
                  <p className="mt-1 text-[10px] font-semibold text-white/30">— {q.author}</p>
                )}
              </div>
            );
          })()}

          {/* Action buttons */}
          {!error && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                className="border-transparent text-white"
                style={{ background: "rgba(255,255,255,0.1)" }}
                asChild
              >
                <a href="#followups">
                  <ListChecks className="size-4" aria-hidden="true" />
                  Review follow-ups
                </a>
              </Button>
              <Button
                size="sm"
                className="border-transparent text-white hover:opacity-90"
                style={{ background: "#0f766e" }}
                asChild
              >
                <a href="#calendar">
                  Today's schedule
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          )}

          {/* Inline agent trace */}
          {showTrace && (
            <InlineTrace traceEvents={traceEvents} isDone={isDone} />
          )}
        </div>
      </section>
    </>
  );
}
