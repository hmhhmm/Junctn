"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, BookOpen, Zap, AlertTriangle, Search,
  Sparkles, RefreshCw, ShieldAlert, GraduationCap, ArrowRight, ChevronDown, Play,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  getCpdStatus, getCpdCategoryBreakdown, getWeeklyPicks, modules, getAdvisor,
} from "@/lib/data";
import { ProgressRing } from "@/components/ui/progress";
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

/* ── Static module learning content ─────────────────────────────────────── */
const MODULE_CONTENT: Record<string, { objectives: string[]; keyTopics: string[]; format: string }> = {
  "mod-1": {
    objectives: ["Understand trust structures used in Singapore estate planning", "Navigate probate process and timeline", "Identify when a trust is more effective than a will"],
    keyTopics: ["Revocable vs irrevocable trusts", "Trustee duties and liabilities", "Probate court process", "Letter of administration"],
    format: "Video lectures + case study workbook",
  },
  "mod-2": {
    objectives: ["Structure estate plans for clients with $5M+ AUM", "Understand cross-border inheritance implications", "Apply discretionary trust strategies"],
    keyTopics: ["Family office structures", "Offshore trust jurisdictions", "Digital asset inheritance", "Blended family considerations"],
    format: "Live workshop + peer discussion",
  },
  "mod-3": {
    objectives: ["Apply 2026 Budget tax changes to client portfolios", "Structure corporate and personal tax efficiently", "Identify RSU and ESOP tax planning opportunities"],
    keyTopics: ["YA2027 progressive tax rates", "Corporate restructuring strategies", "IRAS compliance obligations", "GST registration thresholds"],
    format: "Online self-paced modules",
  },
  "mod-4": {
    objectives: ["Navigate GST registration and compliance", "Advise on cross-border transaction tax treatment"],
    keyTopics: ["GST on imported services", "Zero-rated supplies", "ASEAN tax treaty implications"],
    format: "E-learning + quiz",
  },
  "mod-5": {
    objectives: ["Compare mortgage packages for HDB and private properties", "Advise on refinancing timing and strategies"],
    keyTopics: ["Fixed vs floating rate analysis", "Total Debt Servicing Ratio (TDSR)", "Bridging loan mechanics", "CPF usage for property"],
    format: "Case-based video series",
  },
  "mod-6": {
    objectives: ["Identify keyman insurance gaps in SME clients", "Structure partner buyout coverage correctly"],
    keyTopics: ["Keyman valuation methods", "Group term life vs individual", "Business continuity planning", "Premium financing"],
    format: "Interactive simulations",
  },
  "mod-7": {
    objectives: ["Build diversified portfolios suited to client risk profiles", "Apply modern portfolio theory in practice"],
    keyTopics: ["Asset allocation frameworks", "Correlation and diversification", "Factor investing", "Portfolio rebalancing triggers"],
    format: "Video + interactive portfolio builder",
  },
  "mod-8": {
    objectives: ["Recognise common cognitive biases in client decision-making", "Apply behavioural coaching techniques"],
    keyTopics: ["Loss aversion and framing effects", "Anchoring in market downturns", "Overconfidence bias", "Nudge theory in financial planning"],
    format: "Short-form video series",
  },
  "mod-9": {
    objectives: ["Draft legally compliant wills for Singapore residents", "Advise on LPA and advance care planning"],
    keyTopics: ["Testamentary capacity requirements", "Witness and attestation rules", "Intestacy laws in Singapore", "Muslim inheritance (Faraid) considerations"],
    format: "Lecture + template workbook",
  },
  "mod-10": {
    objectives: ["Create comprehensive succession plans for family businesses", "Structure buy-sell agreements correctly"],
    keyTopics: ["Business valuation methods", "Shareholder agreement design", "Tax-efficient ownership transfer", "Non-family management succession"],
    format: "Masterclass with practitioner Q&A",
  },
  "mod-11": {
    objectives: ["Build retirement income projections for clients aged 50+", "Maximise CPF and SRS strategies"],
    keyTopics: ["CPF Retirement Sums (BRS/FRS/ERS)", "SRS contribution limits and tax relief", "Annuity vs drawdown strategies", "Longevity risk planning"],
    format: "Video + retirement planning calculator",
  },
  "mod-12": {
    objectives: ["Apply SRS to reduce income tax for high earners", "Plan tax-efficient retirement withdrawals"],
    keyTopics: ["SRS withdrawal rules", "Investment options within SRS", "Interaction with CPF LIFE", "Deemed withdrawal triggers"],
    format: "Self-paced e-learning",
  },
  "mod-13": {
    objectives: ["Apply MAS FAA fair dealing obligations", "Identify and manage conflicts of interest"],
    keyTopics: ["5 fair dealing outcomes", "Product suitability assessment", "Complaints handling obligations", "Ethical decision frameworks"],
    format: "Mandatory: video + assessment",
  },
  "mod-14": {
    objectives: ["Conduct proper KYC for new and existing clients", "Identify AML red flags in client transactions"],
    keyTopics: ["Enhanced due diligence triggers", "Politically exposed persons (PEPs)", "Suspicious transaction reporting", "Record-keeping requirements"],
    format: "Mandatory: case studies + quiz",
  },
  "mod-15": {
    objectives: ["Run effective discovery conversations", "Ask questions that uncover hidden client needs"],
    keyTopics: ["GAIN questioning framework", "Active listening techniques", "Non-verbal communication signals", "Building rapport with new clients"],
    format: "Role-play video series + coaching guide",
  },
};

const EXAMPLE_PROMPTS = [
  "Estate planning for high-net-worth families",
  "Retirement income strategies for clients near 60",
  "Tax-efficient wealth transfer",
  "Corporate succession and business continuity",
];

type Tab = "all" | "required" | "optional" | "completed";

export default function CpdPage() {
  const { advisorId, completedModuleIds, completeModule } = useStore();
  const cpd = getCpdStatus(advisorId, completedModuleIds);
  const advisor = getAdvisor(advisorId)!;
  const categoryBreakdown = getCpdCategoryBreakdown(advisorId, completedModuleIds);
  const weeklyPicks = getWeeklyPicks(advisorId, completedModuleIds);

  const completed   = modules.filter((m) => completedModuleIds.includes(m.id));
  const available   = modules.filter((m) => !completedModuleIds.includes(m.id));
  const required    = available.filter((m) => m.required);
  const optional    = available.filter((m) => !m.required);

  const urgent      = cpd.remaining > 0 && cpd.daysToDeadline <= 14;
  const tone        = cpd.remaining === 0 ? "ok" : urgent ? "warn" : "accent";
  const statusLabel = cpd.remaining === 0 ? "CPD complete" : urgent ? "At risk" : "On track";

  // ── Semantic search / generator ─────────────────────────────────────────────
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
        body: JSON.stringify({ query: q, top_k: 4, exclude_ids: completedModuleIds }),
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
    const t = setTimeout(() => runSearch(query), 380);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  // ── Library tab ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const libraryModules =
    tab === "required"  ? required  :
    tab === "optional"  ? optional  :
    tab === "completed" ? completed :
    [...required, ...optional, ...completed];

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">

      {/* ── Hero progress banner ──────────────────────────────────────────── */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 60%, #0a2218 100%)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #0f766e, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-20 left-0 size-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #b45309, transparent 70%)" }} />

        <div className="relative flex flex-wrap items-center gap-6">
          {/* Ring */}
          <ProgressRing value={cpd.pct} tone={tone} size={88} stroke={8}>
            <div className="text-center leading-tight">
              <p className="font-display text-[20px] font-bold text-white">{cpd.earned}</p>
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>/ {cpd.required}</p>
            </div>
          </ProgressRing>

          {/* Text */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <GraduationCap className="size-4" style={{ color: "#5eead4" }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#5eead4" }}>
                MAS FAA-N13
              </span>
            </div>
            <p className="font-display text-[26px] font-bold leading-tight">
              {cpd.remaining === 0 ? "CPD complete — well done!" : `${cpd.remaining} credit${cpd.remaining !== 1 ? "s" : ""} remaining`}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "#94a3b8" }}>
              Deadline: {fmtDeadline(advisor.cpdDeadline)} · {cpd.daysToDeadline} days away
            </p>
            {urgent && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: "#b45309" }}>
                <AlertTriangle className="size-3.5" />
                Urgent — complete remaining modules to protect your licence
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-5">
            {[
              { label: "Completed", value: completed.length },
              { label: "Remaining", value: available.length },
              { label: "Progress",  value: `${cpd.pct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-display text-[22px] font-bold text-white">{value}</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance status pill */}
        <div
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{ borderColor: urgent ? "#b45309" : "#0f766e", color: urgent ? "#fbbf24" : "#5eead4" }}
        >
          <ShieldAlert className="size-3" />
          {statusLabel}
        </div>
      </div>

      {/* ── Category breakdown rings ──────────────────────────────────────── */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-4 pb-1" style={{ minWidth: "max-content" }}>
          {categoryBreakdown.filter((c) => c.moduleCount > 0).map((c) => {
            const tc = topicColors[c.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
            const ringTone = c.pct === 100 ? "ok" : c.pct >= 50 ? "accent" : "warn";
            return (
              <div key={c.topic} className="flex flex-col items-center gap-1.5">
                <ProgressRing value={c.pct} tone={ringTone} size={52} stroke={5}>
                  <span className="text-[10px] font-bold text-ink">{c.pct}%</span>
                </ProgressRing>
                <span className="max-w-[72px] rounded-md px-1.5 py-0.5 text-center text-[9px] font-medium leading-tight"
                  style={{ background: tc.bg, color: tc.color }}>
                  {c.topic}
                </span>
                <span className="text-[9px] text-ink-faint">{c.completedCount}/{c.moduleCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Learning Path Generator ────────────────────────────────────── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent-ink" />
          <h2 className="text-[14px] font-semibold text-ink">Learning path generator</h2>
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>AI</span>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/50">
            {searching
              ? <RefreshCw className="size-4 animate-spin shrink-0 text-ink-faint" />
              : <Search className="size-4 shrink-0 text-ink-faint" />
            }
            <input
              type="text"
              placeholder='Describe a client need or topic — e.g. "estate planning for HNW families"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="text-[12px] text-ink-faint hover:text-ink">clear</button>
            )}
          </div>

          {/* Example prompts */}
          {!query && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search results */}
        {query && searchResults.length > 0 && (
          <Card className="mt-3 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-[13px]">
                <Sparkles className="size-3.5 text-accent-ink" />
                AI-curated path for &ldquo;{query}&rdquo;
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {searchResults.map((r, i) => {
                const tc = topicColors[r.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
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
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: tc.bg, color: tc.color }}>{r.topic}</span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint"><Clock className="size-3" />{r.durationMin} min</span>
                        <span className="text-[11px] text-ink-faint">+{r.credits} credits</span>
                        {r.required && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Required</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => completeModule(r.id)}>
                      Start <ArrowRight className="size-3.5" />
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

      {/* ── AI Recommendation highlight ───────────────────────────────────── */}
      {cpd.recommendedModule && !query && (
        <div
          className="mb-6 flex items-start gap-4 rounded-xl border p-4"
          style={{ borderColor: "#0f766e60", background: "rgba(15,118,110,0.06)" }}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "#0f766e" }}>
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
              {cpd.recommendedModule.required && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Required</span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            style={{ background: "#0f766e", color: "#fff" }}
            onClick={() => completeModule(cpd.recommendedModule!.id)}
          >
            Start now <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── Weekly picks ─────────────────────────────────────────────────── */}
      {weeklyPicks.length > 0 && !query && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent-ink" />
              This week&apos;s picks — matched to your client conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {weeklyPicks.map(({ module: mod, reason }) => {
              const tc = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(45,212,191,0.1)" }}>
                    <Sparkles className="size-3.5 text-accent-ink" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{mod.title}</p>
                    <p className="mt-0.5 text-[11px] text-accent-ink">{reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-faint"><Clock className="size-3" />{mod.durationMin} min</span>
                      <span className="text-[11px] text-ink-faint">+{mod.credits} credits</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => completeModule(mod.id)}>
                    Start <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Living Library ────────────────────────────────────────────────── */}
      {!query && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-ink-soft" />
              <h2 className="text-[14px] font-semibold text-ink">Learning library</h2>
              <span className="text-[12px] text-ink-faint">({libraryModules.length} modules)</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-line p-0.5" style={{ background: "var(--surface-raised)" }}>
              {(["all", "required", "optional", "completed"] as Tab[]).map((t) => {
                const count =
                  t === "required"  ? required.length  :
                  t === "optional"  ? optional.length  :
                  t === "completed" ? completed.length :
                  modules.length;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all"
                    style={tab === t
                      ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                      : { color: "var(--ink-faint)" }}
                  >
                    {t} {count > 0 && <span className="ml-0.5 opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required warning banner */}
          {tab === "required" && required.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-600">
              <AlertTriangle className="size-3.5 shrink-0" />
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
              const isDone    = completedModuleIds.includes(mod.id);
              const isOpen    = expandedId === mod.id;
              const tc        = topicColors[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              const content   = MODULE_CONTENT[mod.id];

              return (
                <div
                  key={mod.id}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    isDone ? "border-line opacity-65" : isOpen ? "border-accent/40" : "border-line hover:border-accent/25"
                  }`}
                  style={{ background: isDone ? "var(--surface-raised)" : isOpen ? "var(--accent-soft)" : "var(--surface)" }}
                >
                  {/* Header row — always visible, clickable to expand */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : mod.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {isDone
                        ? <CheckCircle2 className="size-5 text-ok" />
                        : mod.required
                        ? <AlertTriangle className="size-5 text-warn" />
                        : <BookOpen className="size-5 text-ink-faint" />
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title */}
                      <p className={`text-[13px] font-semibold leading-snug text-ink ${isDone ? "line-through opacity-60" : ""}`}>
                        {mod.title}
                      </p>
                      {/* Meta row */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: tc.bg, color: tc.color }}
                        >
                          {mod.topic}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Clock className="size-3" />{mod.durationMin} min
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          {isDone ? `${mod.credits} cr earned` : `+${mod.credits} credits`}
                        </span>
                        {mod.required && !isDone && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                            Required
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className="size-4 shrink-0 text-ink-faint transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>

                  {/* Expanded content */}
                  {isOpen && content && (
                    <div className="border-t border-line/60 px-4 pb-4 pt-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Format
                      </p>
                      <p className="mb-3 text-[12px] text-ink-soft">{content.format}</p>

                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Learning objectives
                      </p>
                      <ul className="mb-3 flex flex-col gap-1">
                        {content.objectives.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-ink-soft">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent-ink" />
                            {o}
                          </li>
                        ))}
                      </ul>

                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Key topics covered
                      </p>
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {content.keyTopics.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {!isDone && (
                        <Button
                          size="sm"
                          className="w-full"
                          style={{ background: "#0f766e", color: "#fff" }}
                          onClick={() => { completeModule(mod.id); setExpandedId(null); }}
                        >
                          <Play className="size-3.5" /> Start module
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
