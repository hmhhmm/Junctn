"use client";

import { Clock, CheckCircle2, BookOpen, Zap, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { getCpdStatus, modules } from "@/lib/data";
import { ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const topicColors: Record<string, { bg: string; color: string }> = {
  "Estate & Trust": { bg: "#ccfbf1", color: "#134e4a" },
  "Tax Planning": { bg: "#fef3c7", color: "#b45309" },
  Mortgage: { bg: "#dbeafe", color: "#1e40af" },
  "Corporate Insurance": { bg: "#f3e8ff", color: "#6b21a8" },
  Investments: { bg: "#dcfce7", color: "#166534" },
  "Legal / Will": { bg: "#fee2e2", color: "#c53030" },
  "Business Succession": { bg: "#ffedd5", color: "#c2410c" },
  Retirement: { bg: "#e0f2fe", color: "#0369a1" },
  Compliance: { bg: "#f1f5f9", color: "#475569" },
  Practice: { bg: "#fce7f3", color: "#9d174d" },
};

export default function CpdPage() {
  const { advisorId } = useStore();
  const cpd = getCpdStatus(advisorId);

  const completed = modules.filter((m) => m.completedByAdvisor.includes(advisorId));
  const available = modules.filter((m) => !m.completedByAdvisor.includes(advisorId));

  const requiredRemaining = available.filter((m) => m.required);
  const optional = available.filter((m) => !m.required);

  const tone = cpd.remaining === 0 ? "ok" : cpd.daysToDeadline <= 14 ? "warn" : "accent";
  const urgent = cpd.remaining > 0 && cpd.daysToDeadline <= 14;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
          Learning &amp; CPD
        </h1>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          Continuing professional development — track progress and discover modules.
        </p>
      </div>

      {/* Progress hero card */}
      <div
        className="mb-6 flex flex-wrap items-center gap-6 rounded-xl p-6 text-white"
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
            {cpd.remaining === 0
              ? "CPD complete!"
              : `${cpd.remaining} credit${cpd.remaining > 1 ? "s" : ""} to go`}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#94a3b8" }}>
            Deadline: 30 Jun 2026 · {cpd.daysToDeadline} days away
          </p>
          {urgent && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: "#b45309", color: "#fff" }}
            >
              <AlertTriangle className="size-3.5" />
              Urgent — less than 2 weeks remaining
            </div>
          )}
        </div>

        {/* Stats strip */}
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

      {/* Recommended module */}
      {cpd.recommendedModule && (
        <div
          className="mb-6 flex items-start gap-4 rounded-xl border p-4"
          style={{ borderColor: "#0f766e", background: "#ccfbf1" }}
        >
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "#0f766e" }}
          >
            <Zap className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">
              Recommended for you — your clients most need: {cpd.topNeed}
            </p>
            <p className="mt-1 text-[15px] font-bold text-ink">{cpd.recommendedModule.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-ink-soft">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {cpd.recommendedModule.durationMin} min
              </span>
              <span>+{cpd.recommendedModule.credits} credits</span>
              {cpd.recommendedModule.required && (
                <Badge variant="warn">Required</Badge>
              )}
            </div>
          </div>
          <Button size="sm" style={{ background: "#0f766e", color: "#fff" }}>
            Start now
          </Button>
        </div>
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
              const tc = topicColors[mod.topic] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 rounded-lg border border-line p-3"
                >
                  <BookOpen className="size-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {mod.durationMin} min
                      </span>
                      <span>+{mod.credits} credits</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: tc.bg, color: tc.color }}
                      >
                        {mod.topic}
                      </span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Start
                  </Button>
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
              const tc = topicColors[mod.topic] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 rounded-lg border border-line p-3"
                >
                  <BookOpen className="size-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {mod.durationMin} min
                      </span>
                      <span>+{mod.credits} credits</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: tc.bg, color: tc.color }}
                      >
                        {mod.topic}
                      </span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Start
                  </Button>
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
              const tc = topicColors[mod.topic] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-[#fafaf8] p-3 opacity-70"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-ok" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink line-through">{mod.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <span>{mod.credits} credits earned</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: tc.bg, color: tc.color }}
                      >
                        {mod.topic}
                      </span>
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
