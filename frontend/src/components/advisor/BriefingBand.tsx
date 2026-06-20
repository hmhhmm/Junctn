"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, ListChecks, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { draftFollowup } from "@/lib/api";
import { getClientsByAdvisor } from "@/lib/data";

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

interface Section {
  type: "CALENDAR" | "FOLLOWUPS" | "LD";
  content: string;
}

const SECTION_BORDER: Record<Section["type"], string> = {
  CALENDAR: "border-l-[3px] border-teal-500",
  FOLLOWUPS: "border-l-[3px] border-amber-500",
  LD: "border-l-[3px] border-purple-500",
};

const SECTION_LABEL: Record<Section["type"], string> = {
  CALENDAR: "Today's Calendar",
  FOLLOWUPS: "Follow-ups",
  LD: "Learning & Development",
};

function parseSections(text: string): Section[] {
  const sections: Section[] = [];
  const markers: Array<{ type: Section["type"]; index: number }> = [];

  for (const type of ["CALENDAR", "FOLLOWUPS", "LD"] as Section["type"][]) {
    const idx = text.indexOf(`[${type}]`);
    if (idx !== -1) markers.push({ type, index: idx });
  }
  markers.sort((a, b) => a.index - b.index);

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index + `[${markers[i].type}]`.length;
    const end = markers[i + 1]?.index ?? text.length;
    const content = text.slice(start, end).trim();
    if (content) sections.push({ type: markers[i].type, content });
  }

  return sections;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-ink-faint hover:text-ink">
          <X className="size-4" />
        </button>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Draft follow-up
        </p>
        <h3 className="mb-4 font-display text-[16px] font-bold text-ink">{clientName}</h3>
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

interface BriefingBandProps {
  tokens: string;
  isStreaming: boolean;
  error: string | null;
  fallbackText?: string;
  token?: string;
  advisorId?: string;
}

export function BriefingBand({ tokens, isStreaming, error, fallbackText, token, advisorId }: BriefingBandProps) {
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

  // Extract client names from FOLLOWUPS section for draft buttons (simple heuristic)
  function extractClientName(line: string): string {
    const match = line.match(/^[•\-]\s*([A-Z][a-zA-Z\s]+?)[\s(—]/);
    return match?.[1]?.trim() ?? "";
  }

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
        className="relative overflow-hidden rounded-xl p-7 text-white"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 55%, #0a2218 100%)" }}
      >
        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #0f766e 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }} />

        <div className="relative">
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{ background: "rgba(15,118,110,0.2)", border: "1px solid rgba(94,234,212,0.2)", color: "#5eead4" }}
          >
            <Sparkles className="size-3" />
            Morning Briefing
            {isStreaming && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-teal-400" />
            )}
          </div>

          {error ? (
            <p className="max-w-3xl font-display text-[18px] font-medium text-amber-300">{error}</p>
          ) : !hasAnyText ? (
            /* Skeleton while waiting for first token */
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          ) : hasContent ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.type} className={`pl-4 ${SECTION_BORDER[section.type]}`}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {SECTION_LABEL[section.type]}
                  </p>
                  <div className="space-y-1">
                    {section.content.split("\n").map((line, i) => {
                      const clientName = section.type === "FOLLOWUPS" ? extractClientName(line) : "";
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <p className="flex-1 text-[14px] leading-relaxed opacity-90">{line}</p>
                          {section.type === "FOLLOWUPS" && clientName && token && (
                            <button
                              onClick={() => setDraftTarget({ clientId: resolveClientId(clientName), clientName })}
                              className="mt-0.5 shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
                              title="Draft follow-up message"
                            >
                              <MessageSquare className="size-3.5 text-amber-300" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-teal-400" />
              )}
            </div>
          ) : (
            /* Fallback plain text (no section markers — backend offline) */
            <p className="max-w-3xl text-[14px] leading-relaxed opacity-85">{displayText}</p>
          )}

          {/* Daily quote strip — always show when there's any text and not streaming */}
          {!isStreaming && hasAnyText && !error && (() => {
            const q = getDailyQuote();
            return (
              <div className="mt-5 border-l-2 border-teal-500/40 pl-4">
                <p className="text-[12px] italic leading-relaxed text-white/60">
                  &ldquo;{q.text}&rdquo;
                </p>
                {q.author && (
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                    — {q.author}
                  </p>
                )}
              </div>
            );
          })()}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" className="border-transparent text-white"
              style={{ background: "rgba(255,255,255,0.1)" }} asChild>
              <a href="#followups"><ListChecks className="size-4" />Review follow-ups</a>
            </Button>
            <Button size="sm" className="border-transparent text-white hover:opacity-90"
              style={{ background: "#0f766e" }} asChild>
              <a href="#schedule">See full briefing<ArrowRight className="size-4" /></a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
