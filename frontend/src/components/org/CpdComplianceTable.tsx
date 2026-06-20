"use client";

import { ShieldAlert, Download, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getOrgCpdCompliance } from "@/lib/data";
import { useStore } from "@/lib/store";

const statusConfig = {
  complete:  { label: "Complete",  icon: CheckCircle2,  bg: "var(--ok-soft)",   color: "var(--ok)",   border: "var(--ok)" },
  on_track:  { label: "On track",  icon: Clock,         bg: "var(--accent-soft)", color: "var(--accent-ink)", border: "var(--accent)" },
  at_risk:   { label: "At risk",   icon: AlertTriangle, bg: "var(--alert-soft)", color: "var(--alert)", border: "var(--alert)" },
} as const;

export function CpdComplianceTable() {
  const { pushToast, advisorId, completedModuleIds } = useStore();
  const rows = getOrgCpdCompliance(advisorId, completedModuleIds);
  const atRiskCount = rows.filter((r) => r.status === "at_risk").length;
  const completeCount = rows.filter((r) => r.status === "complete").length;

  function exportReport() {
    pushToast("Compliance report generated", "MAS FAA-N13 export ready — PDF sent to ops@junctn.sg");
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-ink-soft" />
            CPD Compliance — MAS FAA-N13
          </CardTitle>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            All licensed advisors must meet CPD requirements or risk licence suspension under the Financial Advisers Act.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportReport}>
          <Download className="size-3.5" />
          Export report
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary strip */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px]">
            <CheckCircle2 className="size-3.5 text-ok" />
            <span className="font-semibold text-ink">{completeCount}</span>
            <span className="text-ink-soft">compliant</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px]">
            <Clock className="size-3.5 text-accent-ink" />
            <span className="font-semibold text-ink">{rows.length - atRiskCount - completeCount}</span>
            <span className="text-ink-soft">on track</span>
          </div>
          {atRiskCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px]"
                 style={{ borderColor: "var(--alert)", background: "var(--alert-soft)" }}>
              <AlertTriangle className="size-3.5 text-alert" />
              <span className="font-semibold text-alert">{atRiskCount}</span>
              <span className="text-alert">at risk — deadline &lt;14 days</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex flex-col gap-2">
          {rows
            .sort((a, b) => {
              const order = { at_risk: 0, on_track: 1, complete: 2 };
              return order[a.status] - order[b.status];
            })
            .map(({ advisor, daysToDeadline, status }) => {
              const cfg = statusConfig[status];
              const Icon = cfg.icon;
              const pct = Math.min(100, Math.round((advisor.cpdEarned / advisor.cpdRequired) * 100));
              return (
                <div
                  key={advisor.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={
                    status === "at_risk"
                      ? { borderLeftColor: "var(--alert)", borderLeftWidth: "3px", borderLeftStyle: "solid" }
                      : {}
                  }
                >
                  <Avatar initials={advisor.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{advisor.name}</p>
                    <p className="text-[11px] text-ink-faint">{advisor.title} · {advisor.district}</p>
                  </div>

                  {/* Credits bar */}
                  <div className="hidden w-28 sm:block">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink">{advisor.cpdEarned}/{advisor.cpdRequired}</span>
                      <span className="text-ink-faint">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: status === "complete" ? "var(--ok)" : status === "at_risk" ? "var(--alert)" : "var(--accent)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="hidden w-20 text-right text-[11px] sm:block">
                    <p className="font-medium text-ink">{daysToDeadline}d</p>
                    <p className="text-ink-faint">to deadline</p>
                  </div>

                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <Icon className="size-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
