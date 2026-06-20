"use client";

import { GraduationCap, Clock, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCpdStatus } from "@/lib/data";
import { useStore } from "@/lib/store";

export function CpdCard({ advisorId }: { advisorId: string }) {
  const { completedModuleIds, completeModule } = useStore();
  const cpd = getCpdStatus(advisorId, completedModuleIds);
  const urgent = cpd.remaining > 0 && cpd.daysToDeadline <= 14;
  const tone = urgent ? "warn" : cpd.remaining > 0 ? "accent" : "ok";

  return (
    <Card id="cpd" className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <GraduationCap className="size-4 text-ink-soft" />
          Learning &amp; CPD
        </CardTitle>
        {urgent && <Badge variant="warn">{cpd.daysToDeadline} days left</Badge>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <ProgressRing value={cpd.pct} tone={tone} size={72} stroke={7}>
            <div className="text-center leading-none">
              <p className="font-display text-[16px] font-bold text-ink">{cpd.earned}</p>
              <p className="text-[9px] text-ink-faint">/ {cpd.required}</p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">
              {cpd.remaining > 0
                ? `${cpd.remaining} credit${cpd.remaining > 1 ? "s" : ""} short this quarter`
                : "CPD requirement met "}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              <abbr title="MAS Financial Advisers Act Notice 13 — Singapore's mandatory CPD requirement for licensed advisors" className="cursor-help no-underline">MAS FAA-N13</abbr>
              {" "}· {cpd.daysToDeadline} days to deadline
            </p>
          </div>
        </div>

        {cpd.recommendedModule && (
          <div className="mt-4 rounded-md border border-line p-3">
            <p className="mb-1.5 text-[11px] font-medium text-ink-faint">
              Recommended for {cpd.topNeed}
            </p>
            <p className="text-[13px] font-semibold text-ink">{cpd.recommendedModule.title}</p>
            <p className="mt-1 flex items-center gap-3 text-[11px] text-ink-faint">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {cpd.recommendedModule.durationMin} min
              </span>
              <span>+{cpd.recommendedModule.credits} credits</span>
              <Badge variant="accent">{cpd.recommendedModule.topic}</Badge>
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5 w-full"
              onClick={() => completeModule(cpd.recommendedModule!.id)}
            >
              Start module
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
