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
  Clock,
  Heart,
  Newspaper,
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

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ClientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { referrals } = useStore();
  const client = getClient(id);
  if (!client) return notFound();

  const advisor      = getAdvisor(client.advisorId)!;
  const openReferrals = referrals.filter((r) => r.clientId === id);
  const sources       = client.notes.filter((n) => n.source);
  const fmtAum        = `RM${(client.aum / 1_000_000).toFixed(2)}M`;

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
  const [matches, setMatches]       = useState<ApiPartnerMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [botOpen, setBotOpen]       = useState(false);
  const [railTab, setRailTab]       = useState<"relationship" | "news" | "partners">("relationship");
  const newsItems = getNewsForClient(client);
  const isStale   = Date.now() - new Date(client.lastContact).getTime() > 30 * 86_400_000;

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

      {/* Back nav */}
      <Link
        href="/advisor/clients"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to clients
      </Link>

      {/* ── Profile header ─────────────────────────────────────────── */}
      <div className="mb-5 overflow-hidden rounded-xl border border-line bg-surface shadow-card">

        {/* Identity row */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-5">
          <Avatar initials={client.initials} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">
              {client.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              Managed by {advisor.name} · {advisor.district} district
            </p>
            {client.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {client.tags.map((t) => (
                  <Badge key={t} variant="neutral">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stat strip */}
        <div className="flex divide-x divide-line border-t border-line">
          <div className="flex flex-1 flex-col items-start gap-0.5 px-5 py-3.5">
            <p className="text-[11px] text-ink-faint">AUM</p>
            <p className="font-display text-[18px] font-bold leading-none text-ink">{fmtAum}</p>
          </div>
          <div className="flex flex-1 flex-col items-start gap-1 px-5 py-3.5">
            <p className="text-[11px] text-ink-faint">Status</p>
            <Badge variant={client.status === "review_due" ? "warn" : "ok"}>
              {client.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col items-start gap-0.5 px-5 py-3.5">
            <p className="text-[11px] text-ink-faint">Last contact</p>
            <p
              className="flex items-center gap-1 text-[13px] font-medium"
              style={{ color: isStale ? "var(--warn)" : "var(--ink)" }}
            >
              <Clock className="size-3.5" />
              {relativeDate(client.lastContact)}
            </p>
          </div>
          <div className="flex flex-1 flex-col items-start gap-0.5 px-5 py-3.5">
            <p className="text-[11px] text-ink-faint">Open referrals</p>
            <p className="text-[13px] font-medium text-ink">
              {openReferrals.length === 0 ? "None" : `${openReferrals.length} active`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Needs strip ────────────────────────────────────────────── */}
      {client.needs.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3">
          <span className="mr-1 shrink-0 text-[11px] font-semibold text-ink-faint">Needs</span>
          {client.needs.map((n) => (
            <Badge key={n} variant="accent">{n}</Badge>
          ))}
        </div>
      )}

      {/* ── Two-column body ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">

        {/* Left: contact history + referrals */}
        <div className="flex flex-col gap-5">

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
                          <Badge variant="neutral" className="ml-auto">{note.source}</Badge>
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
              {openReferrals.length === 0 ? (
                <p className="text-[13px] text-ink-faint">No referrals for this client yet.</p>
              ) : (
                openReferrals.map((r) => {
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
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right rail — tabbed intelligence panel */}
        <div className="flex flex-col gap-0">

          {/* Tab strip */}
          <div className="mb-3 flex rounded-xl border border-line bg-surface p-1 shadow-sm">
            {(
              [
                { key: "relationship", label: "Relationship", Icon: Heart },
                { key: "news",         label: "News",         Icon: Newspaper },
                { key: "partners",     label: "Partners",     Icon: Network },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setRailTab(key)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors"
                style={railTab === key
                  ? { background: "var(--surface-raised)", color: "var(--ink)" }
                  : { color: "var(--ink-faint)" }}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Relationship */}
          {railTab === "relationship" && (
            <RelationshipCard client={client} />
          )}

          {/* Tab: News / evidence */}
          {railTab === "news" && (
            newsItems.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center text-[13px] text-ink-faint">
                No relevant news found for this client.
              </div>
            ) : (
              <EvidenceRail items={newsItems} clientName={client.name} />
            )
          )}

          {/* Tab: Partners — memory + suggested matches */}
          {railTab === "partners" && (
            <div className="flex flex-col gap-4">

              {/* Suggested partners */}
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
                            <p className="text-[10px] text-ink-faint">match</p>
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

              {/* Client memory */}
              <Card>
                <CardHeader>
                  <CardTitle>Client memory</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="flex flex-col gap-2.5">
                    {sources.map((s) => (
                      <li key={s.id} className="flex gap-2.5">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                        <div>
                          <p className="text-[13px] text-ink">{s.summary}</p>
                          <p className="mt-0.5 text-[11px] text-ink-faint">{s.channel} · {s.date}</p>
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

            </div>
          )}
        </div>
      </div>

      {/* Bot sidebar */}
      <ClientAdvisorBot client={client} open={botOpen} onToggle={() => setBotOpen(v => !v)} />
    </div>
  );
}
