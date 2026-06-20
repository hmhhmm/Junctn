"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CheckCircle2, BookOpen, AlertTriangle, Search,
  Sparkles, RefreshCw, GraduationCap, ArrowRight,
  ChevronDown, Play, Zap, PartyPopper,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  getCpdStatus, getCpdCategoryBreakdown, getWeeklyPicks, modules, getAdvisor,
} from "@/lib/data";
import { ProgressRing } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOPIC_TOKEN, SHORT_LABEL, FALLBACK_SECTIONS, MODULE_CONTENT } from "@/lib/cpd-content";
import type { CpdSearchResult } from "@/app/api/cpd/search/route";

type Tab = "all" | "required" | "optional" | "completed";

const EXAMPLE_PROMPTS = [
  "Estate planning for high-net-worth families",
  "Retirement income strategies for clients near 60",
  "Tax-efficient wealth transfer",
  "Corporate succession and business continuity",
];

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function CpdPage() {
  const router = useRouter();
  const { advisorId, completedModuleIds, completeModule } = useStore();
  const cpd = getCpdStatus(advisorId, completedModuleIds);
  const advisor = getAdvisor(advisorId)!;
  const categoryBreakdown = getCpdCategoryBreakdown(advisorId, completedModuleIds);
  const weeklyPicks = getWeeklyPicks(advisorId, completedModuleIds);

  const completed = modules.filter((m) => completedModuleIds.includes(m.id));
  const available = modules.filter((m) => !completedModuleIds.includes(m.id));
  const required  = available.filter((m) => m.required);
  const optional  = available.filter((m) => !m.required);

  const urgent      = cpd.remaining > 0 && cpd.daysToDeadline <= 14;
  const tone        = cpd.remaining === 0 ? "ok" : urgent ? "warn" : "accent";
  const statusLabel = cpd.remaining === 0 ? "CPD complete" : urgent ? "At risk" : "On track";

  // ── "Up next" — recommended module + first weekly pick, deduped ──────────
  const upNextIds = new Set<string>();
  const upNext: Array<{ mod: (typeof modules)[0]; reason: string }> = [];

  if (cpd.recommendedModule && !upNextIds.has(cpd.recommendedModule.id)) {
    upNextIds.add(cpd.recommendedModule.id);
    upNext.push({ mod: cpd.recommendedModule, reason: `Matched to your clients' most common need: ${cpd.topNeed}` });
  }
  for (const { module: m, reason } of weeklyPicks) {
    if (upNext.length >= 3) break;
    if (!upNextIds.has(m.id)) {
      upNextIds.add(m.id);
      upNext.push({ mod: m, reason });
    }
  }

  // ── AI search ────────────────────────────────────────────────────────────
  const [query, setQuery]               = useState("");
  const [searchResults, setSearchResults] = useState<CpdSearchResult[]>([]);
  const [searching, setSearching]       = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/cpd/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 4, exclude_ids: completedModuleIds }),
      });
      setSearchResults((await res.json()).results ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [completedModuleIds]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 380);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  // ── Library ──────────────────────────────────────────────────────────────
  const [tab, setTab]           = useState<Tab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const libraryModules =
    tab === "required"  ? required  :
    tab === "optional"  ? optional  :
    tab === "completed" ? completed :
    [...required, ...optional, ...completed];

  return (
    <div className="mx-auto max-w-[860px] px-4 py-7 sm:px-6">

      {/* ── Status header ────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-surface p-5">
        <ProgressRing value={cpd.pct} tone={tone} size={76} stroke={7}>
          <div className="text-center leading-tight">
            <p className="font-display text-[18px] font-bold text-ink">{cpd.earned}</p>
            <p className="text-[10px] text-ink-faint">/ {cpd.required}</p>
          </div>
        </ProgressRing>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <GraduationCap className="size-3.5 text-ink-faint" aria-hidden="true" />
            <span className="text-[11px] text-ink-faint">MAS FAA-N13</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={
                tone === "ok"   ? { background: "var(--ok-soft)",   color: "var(--ok)" }   :
                tone === "warn" ? { background: "var(--warn-soft)", color: "var(--warn)" } :
                                  { background: "var(--accent-soft)", color: "var(--accent-ink)" }
              }
            >
              {statusLabel}
            </span>
          </div>

          {cpd.remaining === 0 ? (
            <p className="font-display text-[20px] font-bold text-ink">
              CPD complete — well done!
            </p>
          ) : (
            <p className="font-display text-[20px] font-bold text-ink">
              {cpd.remaining} credit{cpd.remaining !== 1 ? "s" : ""} remaining
            </p>
          )}

          <p className="mt-1 text-[12px] text-ink-faint">
            Deadline: {fmtDeadline(advisor.cpdDeadline)} · {cpd.daysToDeadline} days away
          </p>
        </div>

        {urgent && (
          <div
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold"
            style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
          >
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            Complete required modules to protect your licence
          </div>
        )}
      </div>

      {/* ── Category strip ───────────────────────────────────────────────── */}
      <div className="mb-7 overflow-x-auto pb-1" aria-label="Progress by topic">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {categoryBreakdown.filter((c) => c.moduleCount > 0).map((c) => {
            const tc = TOPIC_TOKEN[c.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
            const ringTone = c.pct === 100 ? "ok" : c.pct >= 50 ? "accent" : "warn";
            const label = SHORT_LABEL[c.topic] ?? c.topic;
            return (
              <div key={c.topic} className="flex flex-col items-center gap-1.5">
                <ProgressRing value={c.pct} tone={ringTone} size={44} stroke={4}>
                  <span className="text-[9px] font-bold text-ink">{c.pct}%</span>
                </ProgressRing>
                <span
                  className="rounded-md px-1.5 py-0.5 text-center text-[9px] font-semibold whitespace-nowrap"
                  style={{ background: tc.bg, color: tc.color }}
                >
                  {label}
                </span>
                <span className="text-[9px] text-ink-faint">{c.completedCount}/{c.moduleCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Up next / Celebration ────────────────────────────────────────── */}
      {cpd.remaining === 0 ? (
        <div className="mb-7 flex flex-col items-center gap-3 rounded-2xl border border-ok/30 bg-ok-soft py-8 text-center">
          <PartyPopper className="size-8 text-ok" aria-hidden="true" />
          <p className="font-display text-[18px] font-bold text-ink">All CPD credits earned</p>
          <p className="text-[13px] text-ink-faint">
            You've met the MAS FAA-N13 requirement for this period. Keep exploring the library below to stay sharp.
          </p>
        </div>
      ) : upNext.length > 0 && !query ? (
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-4 text-accent-ink" aria-hidden="true" />
            <h2 className="text-[14px] font-semibold text-ink">Up next</h2>
          </div>
          <div className="flex flex-col gap-2">
            {upNext.map(({ mod, reason }, i) => {
              const tc = TOPIC_TOKEN[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div
                  key={mod.id}
                  className="flex items-start gap-3 rounded-xl border border-line p-4"
                  style={i === 0 ? { borderColor: "var(--accent-ink)", background: "var(--accent-soft)" } : {}}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: i === 0 ? "var(--accent-ink)" : "var(--surface-raised)" }}>
                    {i === 0
                      ? <Zap className="size-3.5 text-white" aria-hidden="true" />
                      : <Sparkles className="size-3.5 text-ink-faint" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{mod.title}</p>
                    <p className="mt-0.5 text-[11px] text-accent-ink">{reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                        <Clock className="size-3" aria-hidden="true" />{mod.durationMin} min
                      </span>
                      <span className="text-[11px] text-ink-faint">+{mod.credits} credits</span>
                      {mod.required && (
                        <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn">Required</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    style={i === 0 ? { background: "var(--accent-ink)", color: "#fff" } : {}}
                    variant={i === 0 ? undefined : "secondary"}
                    onClick={() => router.push(`/advisor/cpd/${mod.id}`)}
                  >
                    Start <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── AI Learning Path Generator ────────────────────────────────────── */}
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent-ink" aria-hidden="true" />
          <h2 className="text-[14px] font-semibold text-ink">Learning path generator</h2>
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>AI</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent-ink/50">
          {searching
            ? <RefreshCw className="size-4 shrink-0 animate-spin text-ink-faint" aria-hidden="true" />
            : <Search className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />}
          <input
            type="text"
            placeholder='Describe a client need — e.g. "estate planning for HNW families"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
            aria-label="Search learning modules"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[12px] text-ink-faint hover:text-ink">
              clear
            </button>
          )}
        </div>

        {!query && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((p) => (
              <button key={p} onClick={() => setQuery(p)}
                className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent-ink/40 hover:text-ink">
                {p}
              </button>
            ))}
          </div>
        )}

        {query && searchResults.length > 0 && (
          <Card className="mt-3 border-accent-ink/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-[13px]">
                <Sparkles className="size-3.5 text-accent-ink" aria-hidden="true" />
                AI-curated path for &ldquo;{query}&rdquo;
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {searchResults.map((r, i) => {
                const tc = TOPIC_TOKEN[r.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
                return (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink-faint"
                      style={{ background: "var(--surface-raised)" }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-accent-ink">{r.reason}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: tc.bg, color: tc.color }}>{r.topic}</span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Clock className="size-3" aria-hidden="true" />{r.durationMin} min
                        </span>
                        <span className="text-[11px] text-ink-faint">+{r.credits} credits</span>
                        {r.required && (
                          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn">Required</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => router.push(`/advisor/cpd/${r.id}`)}>
                      Open <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        {query && !searching && searchResults.length === 0 && (
          <p className="mt-2 px-1 text-[12px] text-ink-faint">
            No modules matched — try different keywords or browse the library below.
          </p>
        )}
      </div>

      {/* ── Learning library ──────────────────────────────────────────────── */}
      {!query && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-ink-soft" aria-hidden="true" />
              <h2 className="text-[14px] font-semibold text-ink">Learning library</h2>
              <span className="text-[12px] text-ink-faint">({libraryModules.length})</span>
            </div>
            <div className="flex gap-1 rounded-lg border border-line p-0.5"
              style={{ background: "var(--surface-raised)" }}
              role="tablist"
              aria-label="Filter modules"
            >
              {(["all", "required", "optional", "completed"] as Tab[]).map((t) => {
                const count =
                  t === "required"  ? required.length  :
                  t === "optional"  ? optional.length  :
                  t === "completed" ? completed.length :
                  modules.length;
                return (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className="rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all"
                    style={tab === t
                      ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                      : { color: "var(--ink-faint)" }}
                  >
                    {t} <span className="ml-0.5 opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "required" && required.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-[12px] font-medium text-warn">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              {required.length} required module{required.length !== 1 ? "s" : ""} must be completed before the deadline.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {libraryModules.length === 0 && (
              <p className="py-6 text-center text-[13px] text-ink-faint">
                {tab === "completed" ? "No modules completed yet." : "No modules in this category."}
              </p>
            )}
            {libraryModules.map((mod) => {
              const isDone  = completedModuleIds.includes(mod.id);
              const isOpen  = expandedId === mod.id;
              const tc      = TOPIC_TOKEN[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              const content = MODULE_CONTENT[mod.id];
              const hasFull = !!(content?.sections?.length);

              return (
                <div
                  key={mod.id}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    isDone ? "border-line opacity-65" : isOpen ? "border-accent-ink/40" : "border-line hover:border-accent-ink/25"
                  }`}
                  style={{ background: isDone ? "var(--surface-raised)" : isOpen ? "var(--accent-soft)" : "var(--surface)" }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : mod.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className="shrink-0">
                      {isDone
                        ? <CheckCircle2 className="size-5 text-ok" aria-hidden="true" />
                        : mod.required
                        ? <AlertTriangle className="size-5 text-warn" aria-hidden="true" />
                        : <BookOpen className="size-5 text-ink-faint" aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-semibold leading-snug text-ink ${isDone ? "line-through opacity-60" : ""}`}>
                        {mod.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Clock className="size-3" aria-hidden="true" />{mod.durationMin} min
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          {isDone ? `${mod.credits} cr earned` : `+${mod.credits} credits`}
                        </span>
                        {mod.required && !isDone && (
                          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn">Required</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className="size-4 shrink-0 text-ink-faint transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-line/60 px-4 pb-4 pt-3">
                      {content ? (
                        <>
                          <p className="mb-2 text-[12px] text-ink-soft">{content.format}</p>
                          <ul className="mb-3 flex flex-col gap-1">
                            {content.objectives.map((o, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-ink-soft">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent-ink" aria-hidden="true" />{o}
                              </li>
                            ))}
                          </ul>
                          <div className="mb-4 flex flex-wrap gap-1.5">
                            {content.keyTopics.map((t) => (
                              <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft">{t}</span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {(FALLBACK_SECTIONS[mod.id] ?? []).map((s) => (
                            <span key={s.title} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft">{s.title}</span>
                          ))}
                        </div>
                      )}

                      {!isDone && (
                        <Button
                          size="sm"
                          className="w-full"
                          style={{ background: "var(--accent-ink)", color: "#fff" }}
                          onClick={() => router.push(`/advisor/cpd/${mod.id}`)}
                        >
                          <Play className="size-3.5" aria-hidden="true" />
                          {hasFull ? "Start course" : "Start module"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
