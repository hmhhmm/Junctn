"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Network,
  MessageSquare,
  Phone,
  Mail,
  Users as UsersIcon,
  StickyNote,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getClient, getPartner, getAdvisor, getNewsForClient } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { RelationshipCard } from "@/components/advisor/RelationshipCard";
import { EvidenceRail } from "@/components/advisor/EvidenceRail";
import { ClientAdvisorBot } from "@/components/advisor/ClientAdvisorBot";
import type { ApiPartnerMatch } from "@/app/api/match/route";

const channelIcon = {
  Meeting: UsersIcon,
  Call: Phone,
  Email: Mail,
  WhatsApp: MessageSquare,
  Note: StickyNote,
} as const;

export default function ClientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { referrals } = useStore();
  const client = getClient(id);
  if (!client) return notFound();

  const advisor = getAdvisor(client.advisorId)!;
  const openReferrals = referrals.filter((r) => r.clientId === id);
  const sources = client.notes.filter((n) => n.source);
  const fmtAum = `RM${(client.aum / 1_000_000).toFixed(2)}M`;

  return (
    <ClientPageInner
      client={client}
      advisor={advisor}
      openReferrals={openReferrals}
      sources={sources}
      fmtAum={fmtAum}
    />
  );
}

function ClientPageInner({
  client,
  advisor,
  openReferrals,
  sources,
  fmtAum,
}: {
  client: NonNullable<ReturnType<typeof getClient>>;
  advisor: NonNullable<ReturnType<typeof getAdvisor>>;
  openReferrals: ReturnType<typeof useStore>["referrals"];
  sources: NonNullable<ReturnType<typeof getClient>>["notes"];
  fmtAum: string;
}) {
  const [matches, setMatches] = useState<ApiPartnerMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [botOpen, setBotOpen] = useState(false);
  const newsItems = getNewsForClient(client);

  useEffect(() => {
    const shell = document.getElementById("app-layout") as HTMLElement | null;
    if (!shell) return;
    shell.style.transition = "padding-right 300ms cubic-bezier(0.22,1,0.36,1)";
    shell.style.paddingRight = botOpen ? "340px" : "0";
    return () => { shell.style.paddingRight = ""; shell.style.transition = ""; };
  }, [botOpen]);

  useEffect(() => {
    const query = [
      ...client.needs,
      ...client.notes.map((n) => n.summary),
    ].join(". ");

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 2, advisor_region: advisor.district }),
    })
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setMatchLoading(false));
  }, [client.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      <Link
        href="/advisor"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to workspace
      </Link>

      {/* Profile header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar initials={client.initials} size="lg" />
          <div>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
              {client.name}
            </h1>
            <p className="text-[13px] text-ink-soft">
              Managed by {advisor.name} · {advisor.district} district
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <Badge key={t} variant="neutral">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">AUM</p>
            <p className="font-display text-[20px] font-bold text-ink">{fmtAum}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">Status</p>
            <p className="mt-1">
              <Badge variant={client.status === "review_due" ? "warn" : "ok"}>
                {client.status.replace("_", " ")}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {/* Left: needs + timeline + referrals */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Needs &amp; objectives</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 pt-0">
              {client.needs.map((n) => (
                <Badge key={n} variant="accent">{n}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact history</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="relative ml-1 border-l border-line">
                {client.notes.length === 0 && (
                  <li className="py-2 pl-5 text-[13px] text-ink-faint">No interactions logged yet.</li>
                )}
                {client.notes.map((note) => {
                  const Icon = channelIcon[note.channel];
                  return (
                    <li key={note.id} className="relative py-3 pl-6">
                      <span className="absolute -left-[9px] top-4 flex size-[18px] items-center justify-center rounded-full border border-line bg-surface text-ink-soft">
                        <Icon className="size-2.5" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-ink">{note.channel}</span>
                        <span className="text-[11px] text-ink-faint">{note.date}</span>
                        {note.source && (
                          <Badge variant="neutral" className="ml-auto">
                            {note.source}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-ink-soft">{note.summary}</p>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Network className="size-4 text-ink-soft" />
                Partner referrals
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {openReferrals.length === 0 && (
                <p className="text-[13px] text-ink-faint">No referrals for this client yet.</p>
              )}
              {openReferrals.map((r) => {
                const partner = getPartner(r.partnerId)!;
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-md border border-line p-3">
                    <Avatar initials={partner.initials} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{partner.name}</p>
                      <p className="text-[11px] text-ink-faint">{r.reason}</p>
                    </div>
                    <ReferralStatusBadge status={r.status} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: relationship intelligence */}
        <div className="flex flex-col gap-5">
          <RelationshipCard client={client} />

          <EvidenceRail items={newsItems} clientName={client.name} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                Client memory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="flex flex-col gap-2.5">
                {sources.map((s) => (
                  <li key={s.id} className="flex gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                    <div>
                      <p className="text-[13px] text-ink">{s.summary}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        Source: {s.channel}, {s.date}
                      </p>
                    </div>
                  </li>
                ))}
                {sources.length === 0 && (
                  <p className="text-[13px] text-ink-faint">
                    No memory yet — captured notes will surface here with their source.
                  </p>
                )}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-ink-faint">
                <ShieldCheck className="size-3.5 text-ok" />
                Summarised from your own logged notes — every line cites its source.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Network className="size-4 text-ink-soft" />
                Suggested partners
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {matchLoading ? (
                <div className="flex items-center gap-2 py-2 text-[13px] text-ink-faint">
                  <RefreshCw className="size-4 animate-spin" /> Finding best matches…
                </div>
              ) : matches.length === 0 ? (
                <p className="text-[13px] text-ink-faint">No strong matches found.</p>
              ) : (
                matches.map((m) => (
                  <div key={m.id} className="rounded-md border border-line p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={m.initials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
                        <p className="text-[11px] text-ink-faint">{m.specialty} · {m.region}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-[16px] font-bold leading-none text-accent-ink">{m.score}</p>
                        <p className="text-[10px] uppercase tracking-wide text-ink-faint">match</p>
                      </div>
                    </div>
                    <p className="mt-2 rounded bg-surface-raised px-2 py-1.5 text-[11px] text-ink-soft">
                      {m.reason}
                    </p>
                    <IntroduceDialog
                      clientId={client.id}
                      partnerId={m.id}
                      reason={m.reason}
                      trigger={
                        <Button variant="soft" size="sm" className="mt-2.5 w-full">
                          Introduce {client.name.split(" ")[0]}
                          <ArrowRight className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed full-height sidebar */}
      <ClientAdvisorBot client={client} open={botOpen} onToggle={() => setBotOpen(v => !v)} />
    </div>
  );
}
