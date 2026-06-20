"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, Users, Target, GraduationCap, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Referral } from "@/lib/types";

/* ── Keyframe styles injected once ──────────────────────────────────────────── */
const CSS = `
@keyframes ps-slide-in-right {
  from { opacity: 0; transform: translateX(32px) scale(0.97); }
  to   { opacity: 1; transform: translateX(0)    scale(1); }
}
@keyframes ps-slide-in-left {
  from { opacity: 0; transform: translateX(-32px) scale(0.97); }
  to   { opacity: 1; transform: translateX(0)     scale(1); }
}
@keyframes ps-fade-out-left {
  from { opacity: 1; transform: translateX(0)    scale(1); }
  to   { opacity: 0; transform: translateX(-24px) scale(0.97); }
}
@keyframes ps-fade-out-right {
  from { opacity: 1; transform: translateX(0)   scale(1); }
  to   { opacity: 0; transform: translateX(24px) scale(0.97); }
}
.ps-enter-right { animation: ps-slide-in-right 0.32s cubic-bezier(.22,.68,0,1.2) forwards; }
.ps-enter-left  { animation: ps-slide-in-left  0.32s cubic-bezier(.22,.68,0,1.2) forwards; }
.ps-exit-left   { animation: ps-fade-out-left  0.18s ease-in forwards; }
.ps-exit-right  { animation: ps-fade-out-right 0.18s ease-in forwards; }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

type CardData = {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string | number;
  sub: string;
  accent: string;
  bg: string;
  progress?: number;
  statsRow?: { label: string; value: string | number }[];
};

type Props = {
  advisorName: string;
  totalClients: number;
  totalAum: number;
  referrals: Referral[];
  cpdEarned: number;
  cpdRequired: number;
  cpdDaysLeft: number;
  goalTarget?: number;
};

export function PerformanceStack({
  totalClients,
  totalAum,
  referrals,
  cpdEarned,
  cpdRequired,
  cpdDaysLeft,
  goalTarget = 300_000,
}: Props) {
  const closedReferrals  = referrals.filter((r) => r.status === "closed").length;
  const openReferrals    = referrals.filter((r) => r.status === "in_progress" || r.status === "introduced").length;
  const totalReferrals   = referrals.length;
  const estimatedRevenue = closedReferrals * 8_500;
  const goalPct          = Math.min(estimatedRevenue / goalTarget, 1);
  const cpdPct           = Math.min(cpdEarned / cpdRequired, 1);

  const cards: CardData[] = [
    {
      id: "aum",
      label: "Assets Under Management",
      icon: TrendingUp,
      value: `S$${(totalAum / 1_000_000).toFixed(1)}M`,
      sub: "Total book value this quarter",
      accent: "#2dd4bf",
      bg: "rgba(45,212,191,0.06)",
      progress: Math.min(totalAum / 10_000_000, 1),
      statsRow: [
        { label: "Clients", value: totalClients },
        { label: "Avg AUM", value: `S$${(totalAum / Math.max(totalClients, 1) / 1_000_000).toFixed(1)}M` },
        { label: "Target", value: "S$10M" },
      ],
    },
    {
      id: "goal",
      label: "Revenue Goal",
      icon: Target,
      value: `${Math.round(goalPct * 100)}%`,
      sub: `S$${estimatedRevenue.toLocaleString()} earned · target S$${(goalTarget / 1000).toFixed(0)}K`,
      accent: goalPct >= 1 ? "#10b981" : "#f59e0b",
      bg: goalPct >= 1 ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
      progress: goalPct,
      statsRow: [
        { label: "Earned", value: `S$${(estimatedRevenue / 1000).toFixed(0)}K` },
        { label: "Remaining", value: `S$${Math.max(0, (goalTarget - estimatedRevenue) / 1000).toFixed(0)}K` },
        { label: "Referrals", value: closedReferrals },
      ],
    },
    {
      id: "referrals",
      label: "Referral Pipeline",
      icon: Users,
      value: totalReferrals,
      sub: `${closedReferrals} closed · ${openReferrals} in progress`,
      accent: "#818cf8",
      bg: "rgba(129,140,248,0.06)",
      progress: totalReferrals > 0 ? closedReferrals / totalReferrals : 0,
      statsRow: [
        { label: "Closed", value: closedReferrals },
        { label: "Active",  value: openReferrals },
        { label: "Close rate", value: `${totalReferrals > 0 ? Math.round(closedReferrals / totalReferrals * 100) : 0}%` },
      ],
    },
    {
      id: "cpd",
      label: "CPD Compliance",
      icon: GraduationCap,
      value: `${cpdEarned}/${cpdRequired}`,
      sub: `${cpdDaysLeft} days to MAS FAA-N13 deadline`,
      accent: cpdPct >= 1 ? "#10b981" : "#f59e0b",
      bg: cpdPct >= 1 ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
      progress: cpdPct,
      statsRow: [
        { label: "Earned",    value: `${cpdEarned} cr` },
        { label: "Required",  value: `${cpdRequired} cr` },
        { label: "Days left", value: cpdDaysLeft },
      ],
    },
  ];

  const [active, setActive] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "exiting" | "entering">("idle");
  const [exitDir, setExitDir]     = useState<"left" | "right">("left");
  const [enterDir, setEnterDir]   = useState<"left" | "right">("right");
  const nextIndexRef = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => goTo("right"), 6000);
  }

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function goTo(dir: "left" | "right") {
    const next = dir === "right"
      ? (active + 1) % cards.length
      : (active - 1 + cards.length) % cards.length;
    nextIndexRef.current = next;
    setExitDir(dir === "right" ? "left" : "right");
    setEnterDir(dir);
    setAnimState("exiting");
    setTimeout(() => {
      setActive(next);
      setAnimState("entering");
    }, 200);
    setTimeout(() => setAnimState("idle"), 560);
    resetTimer();
  }

  function jumpTo(i: number) {
    if (i === active) return;
    goTo(i > active ? "right" : "left");
    nextIndexRef.current = i;
  }

  const card = cards[active];
  const Icon = card.icon;

  const animClass =
    animState === "exiting"
      ? exitDir === "left" ? "ps-exit-left" : "ps-exit-right"
      : animState === "entering"
      ? enterDir === "right" ? "ps-enter-right" : "ps-enter-left"
      : "";

  return (
    <div className="relative select-none pb-3">
      <StyleTag />

      {/* Depth shadow layers */}
      <div
        className="absolute inset-x-4 bottom-1 h-full rounded-2xl border border-line"
        style={{ background: "var(--surface)", opacity: 0.45, transform: "translateY(6px) scale(0.97)" }}
      />
      <div
        className="absolute inset-x-2 bottom-0 h-full rounded-2xl border border-line"
        style={{ background: "var(--surface)", opacity: 0.65, transform: "translateY(3px) scale(0.985)" }}
      />

      {/* Main card */}
      <div
        key={card.id}
        className={`relative overflow-hidden rounded-2xl border p-6 ${animClass}`}
        style={{
          borderColor: `${card.accent}30`,
          background: card.bg,
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Glow orb */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${card.accent}, transparent 70%)` }}
        />

        {/* Header row */}
        <div className="relative mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 items-center justify-center rounded-xl"
              style={{ background: `${card.accent}18` }}
            >
              <Icon className="size-4" style={{ color: card.accent }} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
              {card.label}
            </span>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo("left")}
              className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-surface-raised"
            >
              <ChevronLeft className="size-4 text-ink-faint" />
            </button>
            <button
              onClick={() => goTo("right")}
              className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-surface-raised"
            >
              <ChevronRight className="size-4 text-ink-faint" />
            </button>
          </div>
        </div>

        {/* Big value */}
        <div className="relative mb-1">
          <p
            className="font-display text-[42px] font-bold leading-none tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            {card.value}
          </p>
        </div>
        <p className="relative mb-5 text-[12px] text-ink-faint">{card.sub}</p>

        {/* Progress bar */}
        {card.progress !== undefined && (
          <div className="relative mb-5">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${card.progress * 100}%`, background: card.accent }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-ink-faint">
              {Math.round(card.progress * 100)}%
            </p>
          </div>
        )}

        {/* Stats row */}
        {card.statsRow && (
          <div
            className="relative grid gap-px overflow-hidden rounded-xl border border-line"
            style={{ gridTemplateColumns: `repeat(${card.statsRow.length}, 1fr)`, background: "var(--line)" }}
          >
            {card.statsRow.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-0.5 px-3 py-2.5"
                style={{ background: "var(--surface)" }}
              >
                <p className="font-display text-[15px] font-bold leading-none text-ink">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-ink-faint">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Dot indicators */}
        <div className="relative mt-4 flex items-center justify-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => jumpTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? "20px" : "6px",
                height: "6px",
                background: i === active ? card.accent : "var(--line)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
