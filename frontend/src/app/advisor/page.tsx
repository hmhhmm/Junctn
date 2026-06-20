"use client";

import Link from "next/link";
import {
  Users,
  Network,
  GraduationCap,
  AlertTriangle,
  MessageSquareWarning,
  FileWarning,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getMorningBriefing, getCriticalGaps, getClient } from "@/lib/data";
import { BriefingBand } from "@/components/advisor/BriefingBand";
import { MetricCard } from "@/components/advisor/MetricCard";
import { LiveCalendar } from "@/components/advisor/LiveCalendar";
import { LiveGmail } from "@/components/advisor/LiveGmail";
import { PartnerMatchCard } from "@/components/advisor/PartnerMatchCard";
import { CpdCard } from "@/components/advisor/CpdCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdvisorDashboard() {
  const { advisorId, referrals } = useStore();
  const brief = getMorningBriefing(advisorId, referrals);
  const gaps = getCriticalGaps();
  const topGap = gaps[0];

  const matches = brief.suggestions.filter((s) => s.kind === "partner_match");
  const attention = brief.suggestions.filter((s) => s.kind === "followup");
  const missingMeetings = brief.meetings.filter((m) => m.flag?.kind === "missing");

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <BriefingBand text={brief.briefingText} />

      {/* Metric row */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active clients" value={brief.stats.activeClients}
          hint="In your book this quarter" icon={Users} />
        <MetricCard label="Open referrals" value={brief.stats.openReferrals}
          hint="Suggested, introduced or in progress" icon={Network} tone="accent" />
        <MetricCard label="CPD this quarter" value={`${brief.cpd.earned}/${brief.cpd.required}`}
          icon={GraduationCap} tone={brief.cpd.remaining > 0 ? "warn" : "neutral"}
          progress={brief.cpd.pct} progressTone={brief.cpd.remaining > 0 ? "warn" : "ok"}
          hint={`${brief.cpd.daysToDeadline} days to deadline`} />
        <MetricCard label="Ecosystem gap" value={topGap ? topGap.specialty : "None"}
          hint={topGap ? `No partner in ${topGap.region} · ${topGap.demand} clients affected` : "Full coverage"}
          icon={AlertTriangle} tone="alert" />
      </div>

      {/* Balanced two-column layout */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">

        {/* ── Left: workspace ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <LiveCalendar fallbackMeetings={brief.meetings} />

          {(attention.length > 0 || missingMeetings.length > 0) && (
            <Card id="followups">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <MessageSquareWarning className="size-4 text-alert" />
                  Needs your attention
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                {attention.map((s) => {
                  const client = s.payload.clientId ? getClient(s.payload.clientId) : null;
                  return (
                    <Link key={s.id} href={client ? `/advisor/clients/${client.id}` : "#"}
                      className="group flex items-start gap-3 rounded-md border border-line p-3 transition-colors hover:bg-surface-hover">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-alert-soft text-alert">
                        <MessageSquareWarning className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{s.payload.title}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-accent-ink">{s.trigger}</p>
                        {s.payload.detail && <p className="mt-0.5 text-[12px] text-ink-faint">{s.payload.detail}</p>}
                      </div>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
                {missingMeetings.map((m) => (
                  <Link key={m.id} href={m.clientId ? `/advisor/clients/${m.clientId}` : "#"}
                    className="group flex items-start gap-3 rounded-md border border-line p-3 transition-colors hover:bg-surface-hover">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-warn-soft text-warn">
                      <FileWarning className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">
                        Capture notes for {getClient(m.clientId!)?.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-accent-ink">{m.flag?.text}</p>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Gmail in left column — keeps right rail lean */}
          <LiveGmail maxItems={5} />
        </div>

        {/* ── Right rail: partner intel + progress ─────────────────────── */}
        <div className="flex flex-col gap-5">
          <Card id="partners">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <Network className="size-4 text-ink-soft" />
                Partner matches
              </CardTitle>
              <span className="text-[11px] text-ink-faint">{matches.length} ready</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {matches.map((s) => <PartnerMatchCard key={s.id} suggestion={s} />)}
            </CardContent>
          </Card>

          <div className="flex flex-1 flex-col">
            <CpdCard advisorId={advisorId} />
          </div>
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] text-ink-faint">
        <ShieldCheck className="size-4 text-ok" />
        Every suggestion shows its source. Introductions are logged and require your approval
        before any partner is contacted.
      </p>
    </div>
  );
}
