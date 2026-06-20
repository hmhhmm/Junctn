"use client";

import { useState } from "react";
import { MapPin, Star, ChevronDown, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  partners,
  getClientsByAdvisor,
  matchPartners,
  SPECIALTIES,
  REGIONS,
} from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import { Button } from "@/components/ui/button";

const specialtyColors: Record<string, { bg: string; color: string }> = {
  "Estate & Trust": { bg: "#ccfbf1", color: "#134e4a" },
  "Tax Planning": { bg: "#fef3c7", color: "#b45309" },
  Mortgage: { bg: "#dbeafe", color: "#1e40af" },
  "Corporate Insurance": { bg: "#f3e8ff", color: "#6b21a8" },
  Investments: { bg: "#dcfce7", color: "#166534" },
  "Legal / Will": { bg: "#fee2e2", color: "#c53030" },
  "Business Succession": { bg: "#ffedd5", color: "#c2410c" },
  Retirement: { bg: "#e0f2fe", color: "#0369a1" },
};

export default function PartnersPage() {
  const { advisorId } = useStore();
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  const myClients = getClientsByAdvisor(advisorId).filter((c) => c.status !== "dormant");

  const filtered = partners.filter((p) => {
    if (filterSpecialty !== "all" && p.specialty !== filterSpecialty) return false;
    if (filterRegion !== "all" && p.region !== filterRegion) return false;
    return true;
  });

  // Pre-compute the best match score for each partner across all my clients
  const partnerScores: Record<string, { score: number; clientId: string; reason: string }> = {};
  for (const client of myClients) {
    const matches = matchPartners(client);
    for (const m of matches) {
      const existing = partnerScores[m.partner.id];
      if (!existing || m.score > existing.score) {
        partnerScores[m.partner.id] = {
          score: m.score,
          clientId: client.id,
          reason: m.reason,
        };
      }
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const sa = partnerScores[a.id]?.score ?? 0;
    const sb = partnerScores[b.id]?.score ?? 0;
    return sb - sa;
  });

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
          Partner network
        </h1>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {partners.length} specialist partners · Scores show best match across your active clients.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-8 text-[13px] text-ink shadow-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#0f766e" } as React.CSSProperties}
          >
            <option value="all">All specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        </div>

        <div className="relative">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-8 text-[13px] text-ink shadow-sm focus:outline-none"
          >
            <option value="all">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        </div>

        {(filterSpecialty !== "all" || filterRegion !== "all") && (
          <button
            onClick={() => { setFilterSpecialty("all"); setFilterRegion("all"); }}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink-soft hover:text-ink"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto self-center text-[12px] text-ink-faint">
          {sorted.length} partner{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Partner grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((partner) => {
          const sc = specialtyColors[partner.specialty] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
          const matchData = partnerScores[partner.id];
          const hasMatch = matchData && matchData.score > 0;

          return (
            <div
              key={partner.id}
              className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
              style={hasMatch && matchData.score >= 70 ? { borderLeft: "3px solid #0f766e" } : {}}
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <Avatar initials={partner.initials} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{partner.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {partner.specialty}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                      <MapPin className="size-3" />
                      {partner.region}
                    </span>
                  </div>
                </div>

                {/* Match score badge */}
                {hasMatch && (
                  <div className="flex flex-col items-center">
                    <p
                      className="font-display text-[20px] font-bold"
                      style={{ color: matchData.score >= 70 ? "#0f766e" : "#94a3b8" }}
                    >
                      {matchData.score}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-ink-faint">match</p>
                  </div>
                )}
              </div>

              {/* Stats strip */}
              <div
                className="mt-3 flex gap-4 rounded-lg p-2.5 text-center"
                style={{ background: "var(--surface-raised)" }}
              >
                <div className="flex-1">
                  <p className="font-display text-[16px] font-bold text-ink">
                    {Math.round(partner.successRate * 100)}%
                  </p>
                  <p className="text-[10px] text-ink-faint">Success</p>
                </div>
                <div className="flex-1">
                  <p className="font-display text-[16px] font-bold text-ink">
                    {Math.round(partner.acceptanceRate * 100)}%
                  </p>
                  <p className="text-[10px] text-ink-faint">Acceptance</p>
                </div>
                <div className="flex-1">
                  <p className="font-display text-[16px] font-bold text-ink">
                    {partner.avgDaysToClose}d
                  </p>
                  <p className="text-[10px] text-ink-faint">Avg close</p>
                </div>
              </div>

              {/* Match reason */}
              {matchData?.reason && (
                <p className="mt-3 rounded-lg p-2.5 text-[12px] leading-relaxed text-ink-soft"
                   style={{ background: "#ccfbf1" }}>
                  <Star className="mr-1 inline size-3 text-accent-ink" />
                  {matchData.reason}
                </p>
              )}

              {/* Introduce CTA */}
              {matchData?.clientId && (
                <div className="mt-3">
                  <IntroduceDialog
                    clientId={matchData.clientId}
                    partnerId={partner.id}
                    reason={matchData.reason}
                    trigger={
                      <Button variant="soft" size="sm" className="w-full">
                        Introduce a client
                        <ArrowRight className="size-4" />
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="py-16 text-center text-[14px] text-ink-faint">
          No partners match your filters.
        </p>
      )}
    </div>
  );
}
