"use client";

import { AlertTriangle, Lock, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { getCriticalGaps, getTopPartners } from "@/lib/data";
import { OrgMetrics } from "@/components/org/OrgMetrics";
import { CoverageMatrix } from "@/components/org/CoverageMatrix";
import { PipelineFunnel } from "@/components/org/PipelineFunnel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export default function OrgView() {
  const { referrals } = useStore();
  const gaps = getCriticalGaps();
  const topPartners = getTopPartners(referrals, 5);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
            Organisation overview
          </h1>
          <p className="text-[13px] text-ink-soft">
            Network health across the advisor force — coverage, pipeline, compliance.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-ink-soft">
          <Lock className="size-3.5 text-ok" />
          Aggregate &amp; anonymised — no individual client data
        </span>
      </div>

      <OrgMetrics />

      {/* Critical gaps callout */}
      {gaps.length > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-alert/30 bg-alert-soft/50 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-alert text-white">
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-ink">
              {gaps.length} coverage gap{gaps.length > 1 ? "s" : ""} affecting client demand
            </p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {gaps
                .slice(0, 3)
                .map((g) => `${g.specialty} in ${g.region} (${g.demand} client${g.demand > 1 ? "s" : ""})`)
                .join(" · ")}
              . Recruiting or partnering here unlocks referrals already being routed cross-region.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <CoverageMatrix />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <PipelineFunnel />

        {/* Top partners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Trophy className="size-4 text-ink-soft" />
              Top partners by closed referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {topPartners.map(({ partner, closed, total }, i) => (
              <div key={partner.id} className="flex items-center gap-3 rounded-md border border-line p-2.5">
                <span className="w-4 text-center font-mono text-[12px] font-bold text-ink-faint">
                  {i + 1}
                </span>
                <Avatar initials={partner.initials} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{partner.name}</p>
                  <p className="text-[11px] text-ink-faint">
                    {partner.specialty} · {partner.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-ink">{closed}</p>
                  <p className="text-[10px] text-ink-faint">of {total}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] text-ink-faint">
        <Lock className="size-4 text-ok" />
        The organisation view never exposes one client&apos;s data to another. All figures are
        aggregated across advisors and regions.
      </p>
    </div>
  );
}
