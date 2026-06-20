"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { partners, getClientsByAdvisor, SPECIALTIES, REGIONS } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import { Button } from "@/components/ui/button";
import type { ApiPartnerMatch } from "@/app/api/match/route";


export default function PartnersPage() {
  const { advisorId } = useStore();
  const myClients     = getClientsByAdvisor(advisorId).filter((c) => c.status !== "dormant");
  const topClient     = myClients[0] ?? null;

  // AI recommendations
  const [recommended, setRecommended] = useState<ApiPartnerMatch[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const query = myClients.flatMap((c) => c.needs).slice(0, 10).join(", ")
      || "estate planning investments retirement tax";

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 3 }),
    })
      .then((r) => r.json())
      .then((d) => setRecommended(d.matches ?? []))
      .catch(() => setRecommended([]))
      .finally(() => setLoading(false));
  }, [advisorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browse filters
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterRegion,    setFilterRegion]    = useState("all");

  const browseList = partners.filter(
    (p) =>
      (filterSpecialty === "all" || p.specialty === filterSpecialty) &&
      (filterRegion    === "all" || p.region    === filterRegion),
  );

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-8">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">Partner network</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          {partners.length} specialists · AI finds the right match for each client
        </p>
      </div>

      {/* ── AI Recommended ────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-accent-ink" />
          <h2 className="text-[14px] font-semibold text-ink">Recommended for your clients</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-ink-faint">
            <RefreshCw className="size-4 animate-spin" /> Finding matches…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recommended.map((m) => {
              return (
                <div
                  key={m.id}
                  className="flex flex-col rounded-xl border bg-surface p-4 shadow-sm"
                  style={{ borderColor: "rgba(45,212,191,0.4)" }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.initials} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        {m.specialty} · {m.region}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[20px] font-bold leading-none text-accent-ink">{m.score}</p>
                      <p className="text-[9px] uppercase tracking-wider text-ink-faint">match</p>
                    </div>
                  </div>

                  {topClient && (
                    <div className="mt-3">
                      <IntroduceDialog
                        clientId={topClient.id}
                        partnerId={m.id}
                        reason={m.reason}
                        trigger={
                          <Button variant="primary" size="sm" className="w-full">
                            Introduce <ArrowRight className="size-3.5" />
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-ink-faint">Browse all</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* ── Browse ─────────────────────────────────────────────────── */}
      <section>
        {/* Filters — labelled rows for clarity */}
        <div className="mb-6 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-[68px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Specialty
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...SPECIALTIES].map((s) => (
                <button key={s} onClick={() => setFilterSpecialty(s)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                  style={filterSpecialty === s
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--surface-raised)", color: "var(--ink-soft)" }}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-[68px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Region
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {["all", ...REGIONS].map((r) => (
                <button key={r} onClick={() => setFilterRegion(r)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                  style={filterRegion === r
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--surface-raised)", color: "var(--ink-soft)" }}>
                  {r === "all" ? "All" : r}
                </button>
              ))}
              {(filterSpecialty !== "all" || filterRegion !== "all") && (
                <button onClick={() => { setFilterSpecialty("all"); setFilterRegion("all"); }}
                  className="ml-2 text-[12px] text-ink-faint underline-offset-2 hover:text-ink hover:underline">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="mb-3 text-[12px] text-ink-faint">
          Showing {browseList.length} of {partners.length} partners
        </p>

        {/* Specialist grid — taller cards, success metric fills the middle */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {browseList.map((partner) => {
            return (
              <div key={partner.id}
                className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-md">
                {/* Top: avatar + name + success */}
                <div className="flex items-start gap-3">
                  <Avatar initials={partner.initials} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{partner.name}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                      {partner.specialty} · {partner.region}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-[18px] font-bold leading-none text-ink">
                      {Math.round(partner.successRate * 100)}%
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-faint">success</p>
                  </div>
                </div>

                {/* Action — divider + balanced ghost button */}
                {topClient && (
                  <div className="mt-3.5 border-t border-line pt-3">
                    <IntroduceDialog
                      clientId={topClient.id}
                      partnerId={partner.id}
                      reason={`${partner.specialty} specialist`}
                      trigger={
                        <button className="group/btn flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-semibold text-accent-ink transition-colors hover:bg-accent-soft">
                          Introduce
                          <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {browseList.length === 0 && (
          <p className="py-12 text-center text-[13px] text-ink-faint">No partners match these filters.</p>
        )}
      </section>
    </div>
  );
}
