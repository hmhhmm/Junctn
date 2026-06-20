"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getEcosystemGaps, REGIONS, SPECIALTIES } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CoverageMatrix() {
  const gaps = getEcosystemGaps();
  const cell = (region: string, specialty: string) =>
    gaps.find((g) => g.region === region && g.specialty === specialty)!;

  return (
    <Card id="coverage">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Partnership coverage map</CardTitle>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            Region × specialty. Red cells = unmet client demand with no partner.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-accent" /> covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#ededf3]" /> none, no demand
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-alert" /> gap
          </span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-0">
        <div className="min-w-[640px]">
          {/* header row */}
          <div className="grid grid-cols-[180px_repeat(4,1fr)] gap-1.5">
            <div />
            {REGIONS.map((r) => (
              <div key={r} className="pb-1.5 text-center text-[12px] font-semibold text-ink-soft">
                {r}
              </div>
            ))}
          </div>
          {/* rows */}
          <div className="flex flex-col gap-1.5">
            {SPECIALTIES.map((s) => (
              <div key={s} className="grid grid-cols-[180px_repeat(4,1fr)] gap-1.5">
                <div className="flex items-center text-[12px] font-medium text-ink">{s}</div>
                {REGIONS.map((r) => {
                  const c = cell(r, s);
                  const isGap = c.severity === "none";
                  const covered = c.coverage > 0;
                  return (
                    <div
                      key={r}
                      className={cn(
                        "relative flex h-14 flex-col items-center justify-center rounded-md text-center transition-transform hover:scale-[1.03]",
                        isGap
                          ? "bg-alert text-white shadow-sm ring-1 ring-alert"
                          : covered
                            ? c.coverage > 1
                              ? "bg-accent text-white"
                              : "bg-accent/70 text-white"
                            : "bg-surface-raised text-ink-faint",
                      )}
                      title={`${s} · ${r}: ${c.coverage} partner(s), ${c.demand} client need(s)`}
                    >
                      {isGap && <AlertTriangle className="mb-0.5 size-3.5" />}
                      <span className="text-[13px] font-bold leading-none">
                        {covered ? c.coverage : isGap ? "0" : "—"}
                      </span>
                      <span className="mt-0.5 text-[9px] font-medium opacity-90">
                        {isGap ? `${c.demand} need` : covered ? "partner" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
