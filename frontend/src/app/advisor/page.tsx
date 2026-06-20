"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Network, MessageSquareWarning, FileWarning, ShieldCheck,
  ChevronRight, Sparkles, ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getMorningBriefing, getCriticalGaps, getClient } from "@/lib/data";
import { login, generateBriefing } from "@/lib/api";
import { useBriefingStream } from "@/hooks/useBriefingStream";
import { BriefingBand } from "@/components/advisor/BriefingBand";
import { LiveCalendar } from "@/components/advisor/LiveCalendar";
import { LiveGmail } from "@/components/advisor/LiveGmail";
import { CpdCard } from "@/components/advisor/CpdCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import type { ApiPartnerMatch } from "@/app/api/match/route";

// ── Metric strip ────────────────────────────────────────────────────────────

function MetricStrip({
  activeClients,
  openReferrals,
  cpdEarned,
  cpdRequired,
  gap,
}: {
  activeClients: number;
  openReferrals: number;
  cpdEarned: number;
  cpdRequired: number;
  gap: string | null;
}) {
  const items = [
    { label: `${activeClients} active clients`, href: "/advisor/clients", tone: "neutral" as const },
    { label: `${openReferrals} open referral${openReferrals !== 1 ? "s" : ""}`, href: "/advisor/clients", tone: openReferrals > 0 ? "accent" as const : "neutral" as const },
    { label: `${cpdEarned}/${cpdRequired} CPD credits`, href: "/advisor/cpd", tone: cpdEarned >= cpdRequired ? "ok" as const : "warn" as const },
    ...(gap ? [{ label: `Gap: ${gap}`, href: "/advisor/partners", tone: "alert" as const }] : []),
  ];

  const toneClass: Record<string, string> = {
    neutral: "text-ink-soft",
    accent: "text-accent-ink",
    warn: "text-warn",
    ok: "text-ok",
    alert: "text-alert",
  };

  return (
    <nav aria-label="Advisor metrics" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 py-2.5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="hidden text-ink-faint/40 sm:inline" aria-hidden="true">·</span>}
          <Link
            href={item.href}
            className={`text-[13px] font-medium underline-offset-2 transition-colors hover:underline ${toneClass[item.tone]}`}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

// ── Attention rail ──────────────────────────────────────────────────────────

interface AttentionItem {
  id: string;
  kind: "followup" | "missing";
  title: string;
  trigger: string;
  detail?: string;
  href: string;
}

function AttentionRail({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div id="followups" className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <MessageSquareWarning className="size-4 text-alert" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-ink">Needs your attention</h2>
        <span className="flex size-5 items-center justify-center rounded-full bg-alert-soft text-[10px] font-bold text-alert">
          {items.length}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <span
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: item.kind === "followup" ? "var(--alert-soft)" : "var(--warn-soft)",
                  color: item.kind === "followup" ? "var(--alert)" : "var(--warn)",
                }}
                aria-hidden="true"
              >
                {item.kind === "followup"
                  ? <MessageSquareWarning className="size-3.5" />
                  : <FileWarning className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 text-[11px] font-medium text-accent-ink">{item.trigger}</p>
                {item.detail && <p className="mt-0.5 text-[12px] text-ink-faint">{item.detail}</p>}
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdvisorDashboard() {
  const { advisorId, referrals, completedModuleIds, accessToken, setAccessToken } = useStore();
  const brief = getMorningBriefing(advisorId, referrals, completedModuleIds);
  const gaps = getCriticalGaps();
  const topGap = gaps[0];

  // ── Briefing streaming ──────────────────────────────────────────────────
  const _sessionKey = `briefing_job_${advisorId}`;
  const [jobId, setJobId] = useState<string | null>(
    () => sessionStorage.getItem(_sessionKey),
  );
  const [backendError, setBackendError] = useState(false);
  const { tokens, traceEvents, isDone, error } = useBriefingStream(jobId);

  const startBriefing = useCallback(async (force = false) => {
    // Reuse the existing job for this session (tab switch / back-navigation).
    // A hard refresh clears sessionStorage, so a new pipeline is triggered.
    const existing = sessionStorage.getItem(_sessionKey);
    if (existing && !force) {
      setJobId(existing);
      return;
    }
    setJobId(null);
    setBackendError(false);
    try {
      let tok = accessToken;
      if (!tok) {
        const res = await login(advisorId);
        tok = res.access_token;
        setAccessToken(tok);
      }
      const { job_id } = await generateBriefing(tok);
      sessionStorage.setItem(_sessionKey, job_id);
      setJobId(job_id);
    } catch {
      setBackendError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId, accessToken]);

  useEffect(() => {
    startBriefing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId]);

  const streamError = backendError || error ? "Briefing couldn't load" : null;

  // ── Attention items ─────────────────────────────────────────────────────
  const attentionItems: AttentionItem[] = [
    ...brief.suggestions
      .filter((s) => s.kind === "followup")
      .map((s) => {
        const client = s.payload.clientId ? getClient(s.payload.clientId) : null;
        return {
          id: s.id,
          kind: "followup" as const,
          title: s.payload.title as string,
          trigger: s.trigger,
          detail: s.payload.detail as string | undefined,
          href: client ? `/advisor/clients/${client.id}` : "#",
        };
      }),
    ...brief.meetings
      .filter((m) => m.flag?.kind === "missing")
      .map((m) => ({
        id: m.id,
        kind: "missing" as const,
        title: `Capture notes for ${getClient(m.clientId!)?.name ?? "client"}`,
        trigger: m.flag?.text ?? "",
        href: m.clientId ? `/advisor/clients/${m.clientId}` : "#",
      })),
  ];

  // ── Partner matches ─────────────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId]);

  function getMatchClient() {
    return brief.suggestions
      .filter((s) => s.kind === "partner_match" && s.payload.clientId)
      .map((s) => getClient(s.payload.clientId!))
      .filter(Boolean)[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">

      {/* ── Briefing hero ───────────────────────────────────────────────── */}
      <BriefingBand
        tokens={tokens}
        isStreaming={!!jobId && !isDone}
        error={streamError}
        fallbackText={brief.briefingText}
        token={accessToken ?? undefined}
        advisorId={advisorId}
        traceEvents={traceEvents}
        isDone={isDone}
        onRetry={() => startBriefing(true)}
      />

      {/* ── Metric strip ────────────────────────────────────────────────── */}
      <MetricStrip
        activeClients={brief.stats.activeClients}
        openReferrals={brief.stats.openReferrals}
        cpdEarned={brief.cpd.earned}
        cpdRequired={brief.cpd.required}
        gap={topGap?.specialty ?? null}
      />

      {/* ── Attention rail ──────────────────────────────────────────────── */}
      {attentionItems.length > 0 && (
        <div className="mt-1 mb-5">
          <AttentionRail items={attentionItems} />
        </div>
      )}

      {/* ── Two-column body ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* Left: schedule context */}
        <div className="flex flex-col gap-5">
          <div id="calendar">
            <LiveCalendar fallbackMeetings={brief.meetings} />
          </div>
          <LiveGmail maxItems={5} />
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-5">

          {/* Partner matches */}
          <Card id="partners">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <Network className="size-4 text-ink-soft" aria-hidden="true" />
                Partner matches
                {!matchLoading && (
                  <span
                    className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "var(--ok-soft)", color: "var(--ok)" }}
                  >
                    <Sparkles className="size-2.5" aria-hidden="true" /> AI
                  </span>
                )}
              </CardTitle>
              {!matchLoading && (
                <span className="text-[11px] text-ink-faint">{matches.length} ready</span>
              )}
            </CardHeader>

            <CardContent className="flex flex-col gap-3 pt-0">
              {matchLoading ? (
                /* Skeleton rows — no spinner in content */
                <div className="flex flex-col gap-2.5" aria-label="Loading partner matches" aria-busy="true">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-line p-3">
                      <div className="size-9 animate-pulse rounded-full bg-surface-raised" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-raised" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-surface-raised" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <p className="text-[13px] text-ink-faint">No matches at this time.</p>
              ) : (
                matches.map((m) => {
                  const matchClient = getMatchClient();
                  return (
                    <div key={m.id} className="rounded-lg border border-line p-3.5">
                      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-accent-ink">
                        <Sparkles className="size-3" aria-hidden="true" />
                        {m.reason}
                      </p>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={m.initials} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
                          <p className="text-[11px] text-ink-faint">{m.specialty} · {m.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[18px] font-bold leading-none text-accent-ink">{m.score}</p>
                          <p className="text-[10px] uppercase tracking-wide text-ink-faint">match</p>
                        </div>
                      </div>
                      {matchClient ? (
                        <IntroduceDialog
                          clientId={matchClient.id}
                          partnerId={m.id}
                          reason={m.reason}
                          trigger={
                            <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-hover">
                              Introduce {matchClient.name.split(" ")[0]}
                              <ArrowRight className="size-3.5" aria-hidden="true" />
                            </button>
                          }
                        />
                      ) : (
                        <Link
                          href="/advisor/clients"
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-surface-hover"
                        >
                          View clients <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* CPD */}
          <CpdCard advisorId={advisorId} />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <p className="mt-8 flex items-center justify-center gap-2 text-center text-[12px] text-ink-faint">
        <ShieldCheck className="size-4 text-ok" aria-hidden="true" />
        Every suggestion shows its source. Introductions are logged and require your approval
        before any partner is contacted.
      </p>
    </div>
  );
}
