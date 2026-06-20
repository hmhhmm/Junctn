"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Zap,
  AlertTriangle,
  Search,
  Sparkles,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  getCpdStatus,
  getCpdCategoryBreakdown,
  getWeeklyPicks,
  modules,
  getAdvisor,
} from "@/lib/data";
import { ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CpdSearchResult } from "@/app/api/cpd/search/route";

const topicColors: Record<string, { bg: string; color: string }> = {
  "Estate & Trust":      { bg: "#ccfbf1", color: "#134e4a" },
  "Tax Planning":        { bg: "#fef3c7", color: "#b45309" },
  Mortgage:              { bg: "#dbeafe", color: "#1e40af" },
  "Corporate Insurance": { bg: "#f3e8ff", color: "#6b21a8" },
  Investments:           { bg: "#dcfce7", color: "#166534" },
  "Legal / Will":        { bg: "#fee2e2", color: "#c53030" },
  "Business Succession": { bg: "#ffedd5", color: "#c2410c" },
  Retirement:            { bg: "#e0f2fe", color: "#0369a1" },
  Compliance:            { bg: "var(--surface-raised)", color: "var(--ink-soft)" },
  Practice:              { bg: "#fce7f3", color: "#9d174d" },
};

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function CpdPage() {
  const { advisorId, completedModuleIds, completeModule } = useStore();
  const cpd = getCpdStatus(advisorId, completedModuleIds);
  const advisor = getAdvisor(advisorId)!;
  const categoryBreakdown = getCpdCategoryBreakdown(advisorId, completedModuleIds);
  const weeklyPicks = getWeeklyPicks(advisorId, completedModuleIds);

  const completed = modules.filter((m) => completedModuleIds.includes(m.id));
  const available = modules.filter((m) => !completedModuleIds.includes(m.id));
  const requiredRemaining = available.filter((m) => m.required);
  const optional = available.filter((m) => !m.required);

  const tone = cpd.remaining === 0 ? "ok" : cpd.daysToDeadline <= 14 ? "warn" : "accent";
  const urgent = cpd.remaining > 0 && cpd.daysToDeadline <= 14;
  const statusLabel = cpd.remaining === 0 ? "Complete" : urgent ? "At risk" : "On track";

  // ── Semantic search ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CpdSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/cpd/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 3, exclude_ids: completedModuleIds }),
      });
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [completedModuleIds]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
            Learning &amp; CPD
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Continuing professional development — tracked under MAS Notice FAA-N13
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium"
          style={{ borderColor: urgent ? "var(--alert)" : "var(--line)", color: urgent ? "var(--alert)" : "var(--ink-soft)" }}
        >
          <ShieldAlert className="size-3.5" />
          {statusLabel} · deadline {fmtDeadline(advisor.cpdDeadline)}
        </div>
      </div>

      {/* Progress hero card */}
      <div
        className="mb-5 flex flex-wrap items-center gap-6 rounded-xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 55%, #0a2218 100%)" }}
      >
        <ProgressRing value={cpd.pct} tone={tone} size={90} stroke={8}>
          <div className="text-center leading-tight">
            <p className="font-display text-[20px] font-bold text-white">{cpd.earned}</p>
            <p className="text-[10px]" style={{ color: "#94a3b8" }}>/ {cpd.required}</p>
          </div>
        </ProgressRing>

        <div className="flex-1">
          <p className="font-display text-[26px] font-bold leading-tight">
            {cpd.remaining === 0 ? "CPD complete!" : `${cpd.remaining} credit${cpd.remaining > 1 ? "s" : ""} to go`}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#94a3b8" }}>
            MAS FAA-N13 deadline: {fmtDeadline(advisor.cpdDeadline)} · {cpd.daysToDeadline} days away
          </p>
          {urgent && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: "#b45309", color: "#fff" }}
            >
              <AlertTriangle className="size-3.5" />
              Urgent — licence compliance at risk
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="font-display text-[22px] font-bold text-white">{completed.length}</p>
            <p className="text-[11px]" style={{ color: "#64748b" }}>Completed</p>
          </div>
          <div className="text-center">
            <p className="font-display text-[22px] font-bold text-white">{available.length}</p>
            <p className="text-[11px]" style={{ color: "#64748b" }}>Available</p>
          </div>
          <div className="text-center">
            <p className="font-display text-[22px] font-bold text-white">{cpd.pct}%</p>
            <p className="text-[11px]" style={{ color: "#64748b" }}>Progress</p>
          </div>
        </div>
      </div>

      {/* Per-category rings */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex gap-4 pb-1" style={{ minWidth: "max-content" }}>
          {categoryBreakdown.filter((c) => c.moduleCount > 0).map((c) => {
            const tc = topicColors[c.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
            const ringTone = c.pct === 100 ? "ok" : c.pct >= 50 ? "accent" : "warn";
            return (
              <div key={c.topic} className="flex flex-col items-center gap-1.5">
                <ProgressRing value={c.pct} tone={ringTone} size={52} stroke={5}>
                  <span className="text-[10px] font-bold text-ink">{c.pct}%</span>
                </ProgressRing>
                <span
                  className="max-w-[72px] rounded-md px-1.5 py-0.5 text-center text-[9px] font-medium leading-tight"
                  style={{ background: tc.bg, color: tc.color }}
                >
                  {c.topic}
                </span>
                <span className="text-[9px] text-ink-faint">{c.completedCount}/{c.moduleCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Semantic search */}
      <div className="mb-5">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-sm">
          {searching
            ? <RefreshCw className="size-4 animate-spin text-ink-faint" />
            : <Search className="size-4 text-ink-faint" />
          }
          <input
            type="text"
            placeholder='Search modules — e.g. "estate planning for HNW clients"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {query && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-accent-ink">
              <Sparkles className="size-3" /> AI
            </span>
          )}
        </div>

        {query && searchResults.length > 0 && (
          <Card className="mt-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-[13px]">
                <Sparkles className="size-3.5 text-accent-ink" />
                Semantic results for &ldquo;{query}&rdquo;
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {searchResults.map((r) => {
                const tc = topicColors[r.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <BookOpen className="size-4 shrink-0 text-ink-faint" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">{r.reason}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{r.durationMin} min</span>
                        <span>+{r.credits} credits</span>
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{r.topic}</span>
                        {r.required && <Badge variant="warn">Required</Badge>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => completeModule(r.id)}>Start</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {query && !searching && searchResults.length === 0 && (
          <p className="mt-2 px-1 text-[12px] text-ink-faint">No modules matched — try different keywords.</p>
        )}
      </div>

      {/* Recommended module */}
      {cpd.recommendedModule && !query && (
        <div
          className="mb-5 flex items-start gap-4 rounded-xl border p-4"
          style={{ borderColor: "#0f766e", background: "#ccfbf1" }}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: "#0f766e" }}>
            <Zap className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">
              Recommended — your clients most need: {cpd.topNeed}
            </p>
            <p className="mt-1 text-[15px] font-bold text-ink">{cpd.recommendedModule.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-ink-soft">
              <span className="flex items-center gap-1"><Clock className="size-3.5" />{cpd.recommendedModule.durationMin} min</span>
              <span>+{cpd.recommendedModule.credits} credits</span>
              {cpd.recommendedModule.required && <Badge variant="warn">Required</Badge>}
            </div>
          </div>
          <Button
            size="sm"
            style={{ background: "#0f766e", color: "#fff" }}
            onClick={() => completeModule(cpd.recommendedModule!.id)}
          >
            Start now
          </Button>
        </div>
      )}

      {/* Weekly picks */}
      {weeklyPicks.length > 0 && !query && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent-ink" />
              This week&apos;s picks — based on your client conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {weeklyPicks.map(({ module: mod, reason }) => {
              const tc = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <Sparkles className="size-4 shrink-0 text-accent-ink" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{mod.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{reason}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{mod.durationMin} min</span>
                      <span>+{mod.credits} credits</span>
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => completeModule(mod.id)}>Start</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Required remaining */}
      {requiredRemaining.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warn" />
              Required modules ({requiredRemaining.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {requiredRemaining.map((mod) => {
              const tc = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <BookOpen className="size-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{mod.durationMin} min</span>
                      <span>+{mod.credits} credits</span>
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => completeModule(mod.id)}>Start</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Optional available */}
      {optional.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-ink-soft" />
              Optional modules ({optional.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {optional.map((mod) => {
              const tc = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <BookOpen className="size-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{mod.durationMin} min</span>
                      <span>+{mod.credits} credits</span>
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => completeModule(mod.id)}>Start</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-ok" />
              Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {completed.map((mod) => {
              const tc = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface-raised p-3 opacity-70">
                  <CheckCircle2 className="size-4 shrink-0 text-ok" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink line-through">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span>{mod.credits} credits earned</span>
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
