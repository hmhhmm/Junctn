"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Network, GraduationCap, AlertTriangle,
  MessageSquareWarning, FileWarning, ShieldCheck, ChevronRight,
  Sparkles, RefreshCw, ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getMorningBriefing, getCriticalGaps, getClient } from "@/lib/data";
import { login, generateBriefing } from "@/lib/api";
import { useBriefingStream } from "@/hooks/useBriefingStream";
import { BriefingBand } from "@/components/advisor/BriefingBand";
import { AgentTracePanel } from "@/components/advisor/AgentTracePanel";
import { MetricCard } from "@/components/advisor/MetricCard";
import { LiveCalendar } from "@/components/advisor/LiveCalendar";
import { LiveGmail } from "@/components/advisor/LiveGmail";
import { CpdCard } from "@/components/advisor/CpdCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import type { ApiPartnerMatch } from "@/app/api/match/route";

export default function AdvisorDashboard() {
  const { advisorId, referrals, completedModuleIds, accessToken, setAccessToken } = useStore();
  const brief = getMorningBriefing(advisorId, referrals, completedModuleIds);
  const gaps = getCriticalGaps();
  const topGap = gaps[0];

  const attention = brief.suggestions.filter((s) => s.kind === "followup");
  const missingMeetings = brief.meetings.filter((m) => m.flag?.kind === "missing");

  // ── Briefing streaming ──────────────────────────────────────────────────────
  const [jobId, setJobId] = useState<string | null>(null);
  const [backendError, setBackendError] = useState(false);

  const { tokens, traceEvents, isDone, error } = useBriefingStream(jobId);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let token = accessToken;
        if (!token) {
          const res = await login(advisorId);
          token = res.access_token;
          setAccessToken(token);
        }
        if (cancelled) return;

        const { job_id } = await generateBriefing(token);
        if (!cancelled) setJobId(job_id);
      } catch {
        if (!cancelled) setBackendError(true);
      }
    }

    setJobId(null);
    setBackendError(false);
    init();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId]);

  const streamError = backendError
    ? "Briefing unavailable — please refresh"
    : error;

  // ── Live partner matches from embedding search ──────────────────────────────
  const [matches, setMatches] = useState<ApiPartnerMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);

  useEffect(() => {
    const topicHints = brief.suggestions
      .filter((s) => s.kind === "partner_match")
      .map((s) => s.trigger)
      .join(". ");

    const query = topicHints || "estate planning trust retirement investments tax mortgage";

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 3, advisor_region: brief.advisor?.district }),
    })
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setMatchLoading(false));
  }, [advisorId]); // eslint-disable-line react-hooks/exhaustive-deps

  function getMatchClient() {
    const clients = brief.suggestions
      .filter((s) => s.kind === "partner_match" && s.payload.clientId)
      .map((s) => getClient(s.payload.clientId!))
      .filter(Boolean);
    return clients[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <BriefingBand
        tokens={tokens}
        isStreaming={!!jobId && !isDone}
        error={streamError}
        fallbackText={brief.briefingText}
        token={accessToken ?? undefined}
      />

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

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left */}
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

          <LiveGmail maxItems={5} />
        </div>

        {/* Right rail: live AI partner matches + CPD */}
        <div className="flex flex-col gap-5">
          <Card id="partners">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <Network className="size-4 text-ink-soft" />
                Partner matches
                {!matchLoading && (
                  <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                    <Sparkles className="size-2.5" /> AI
                  </span>
                )}
              </CardTitle>
              {!matchLoading && (
                <span className="text-[11px] text-ink-faint">{matches.length} ready</span>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {matchLoading ? (
                <div className="flex items-center gap-2 py-2 text-[13px] text-ink-faint">
                  <RefreshCw className="size-4 animate-spin" /> Matching…
                </div>
              ) : matches.length === 0 ? (
                <p className="text-[13px] text-ink-faint">No matches at this time.</p>
              ) : (
                matches.map((m) => {
                  const matchClient = getMatchClient();
                  return (
                    <div key={m.id} className="rounded-md border border-line p-3.5">
                      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-accent-ink">
                        <Sparkles className="size-3" />
                        {m.reason}
                      </p>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={m.initials} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
                          <p className="text-[11px] text-ink-faint">{m.specialty} · {m.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-[18px] font-bold leading-none text-accent-ink">{m.score}</p>
                          <p className="text-[10px] uppercase tracking-wide text-ink-faint">match</p>
                        </div>
                      </div>
                      {matchClient ? (
                        <IntroduceDialog
                          clientId={matchClient.id}
                          partnerId={m.id}
                          reason={m.reason}
                          trigger={
                            <Button variant="soft" size="sm" className="mt-2.5 w-full">
                              Introduce {matchClient.name.split(" ")[0]}
                              <ArrowRight className="size-4" />
                            </Button>
                          }
                        />
                      ) : (
                        <Link href="/advisor/clients"
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-surface-hover">
                          View clients <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
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

      {/* Agent trace panel — fixed right sidebar */}
      {jobId && (
        <AgentTracePanel traceEvents={traceEvents} isDone={isDone} />
      )}
    </div>
  );
}
