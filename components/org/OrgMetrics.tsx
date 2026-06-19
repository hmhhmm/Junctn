"use client";

import { Users, Network, TrendingUp, GraduationCap } from "lucide-react";
import { useStore } from "@/lib/store";
import { getOrgMetrics } from "@/lib/data";
import { MetricCard } from "@/components/advisor/MetricCard";

export function OrgMetrics() {
  const { referrals } = useStore();
  const m = getOrgMetrics(referrals);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Advisors"
        value={m.totalAdvisors}
        hint={`${m.totalClients} clients · ${m.totalPartners} partners`}
        icon={Users}
      />
      <MetricCard
        label="Active referrals"
        value={m.activeReferrals}
        hint="Across the network right now"
        icon={Network}
        tone="accent"
      />
      <MetricCard
        label="Network close-rate"
        value={`${Math.round(m.closeRate * 100)}%`}
        hint="Of decided referrals"
        icon={TrendingUp}
        progress={m.closeRate * 100}
        progressTone="ok"
      />
      <MetricCard
        label="CPD compliance"
        value={`${Math.round(m.cpdCompliance * 100)}%`}
        hint={`${m.criticalGaps} coverage gaps to close`}
        icon={GraduationCap}
        tone={m.cpdCompliance < 1 ? "warn" : "neutral"}
        progress={m.cpdCompliance * 100}
        progressTone={m.cpdCompliance < 1 ? "warn" : "ok"}
      />
    </div>
  );
}
