"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Clock, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { getClientsByAdvisor } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import type { Client } from "@/lib/types";

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Theme-aware status styling — soft rgba tints read well in both light & dark
const STATUS: Record<Client["status"], { label: string; dot: string; tint: string }> = {
  review_due: { label: "Review due", dot: "#f59e0b", tint: "rgba(245,158,11,0.14)" },
  active:     { label: "Active",     dot: "#10b981", tint: "rgba(16,185,129,0.14)" },
  prospect:   { label: "Prospect",   dot: "#06b6d4", tint: "rgba(6,182,212,0.14)" },
  dormant:    { label: "Dormant",    dot: "#94a3b8", tint: "rgba(148,163,184,0.14)" },
};

const STATUS_ORDER: Client["status"][] = ["review_due", "active", "prospect", "dormant"];

export default function ClientsPage() {
  const { advisorId } = useStore();
  const allClients    = getClientsByAdvisor(advisorId);
  const [query, setQuery]         = useState("");
  const [activeFilter, setFilter] = useState<Client["status"] | "all">("all");

  const filtered = allClients
    .filter((c) => activeFilter === "all" || c.status === activeFilter)
    .filter((c) => {
      const q = query.trim().toLowerCase();
      return !q || c.name.toLowerCase().includes(q)
        || c.needs.some((n) => n.toLowerCase().includes(q))
        || c.tags.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const totalAum = allClients.reduce((s, c) => s + c.aum, 0);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">Client book</h1>
          <p className="mt-1 flex items-center gap-3 text-[12px] text-ink-faint">
            <span>{allClients.length} clients</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="size-3" />
              S${(totalAum / 1_000_000).toFixed(1)}M AUM
            </span>
          </p>
        </div>

        {/* Search */}
        <div className="flex w-full max-w-[280px] items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-sm">
          <Search className="size-3.5 shrink-0 text-ink-faint" />
          <input
            type="text"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
      </div>

      {/* ── Filter pills ───────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", ...STATUS_ORDER] as const).map((s) => {
          const count = s === "all" ? allClients.length : allClients.filter((c) => c.status === s).length;
          const cfg   = s !== "all" ? STATUS[s] : null;
          const on    = activeFilter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={on
                ? cfg
                  ? { background: cfg.tint, color: cfg.dot, boxShadow: `0 0 0 1.5px ${cfg.dot}` }
                  : { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-raised)", color: "var(--ink-soft)" }
              }
            >
              {cfg && <span className="size-1.5 rounded-full" style={{ background: on ? cfg.dot : "var(--ink-faint)" }} />}
              {s === "all" ? "All" : cfg!.label}
              <span className="opacity-50">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Client grid ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] font-medium text-ink">No clients found</p>
          <p className="mt-1 text-[12px] text-ink-faint">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
            const cfg      = STATUS[client.status];
            const isUrgent = client.status === "review_due";
            const isStale  = Date.now() - new Date(client.lastContact).getTime() > 30 * 86_400_000;

            return (
              <Link
                key={client.id}
                href={`/advisor/clients/${client.id}`}
                className="group flex flex-col rounded-xl border p-4 transition-all hover:shadow-md"
                style={isUrgent
                  ? { borderColor: "rgba(245,158,11,0.45)", background: "rgba(245,158,11,0.05)" }
                  : { borderColor: "var(--line)", background: "var(--surface)" }
                }
              >
                {/* Top: avatar + status */}
                <div className="flex items-start justify-between gap-2">
                  <Avatar initials={client.initials} size="md" />
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: cfg.tint, color: cfg.dot }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Name */}
                <p className="mt-3 truncate text-[15px] font-semibold text-ink">{client.name}</p>

                {/* Needs */}
                <div className="mt-2 flex min-h-[22px] flex-wrap gap-1">
                  {client.needs.slice(0, 2).map((n) => (
                    <span
                      key={n}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
                    >
                      {n}
                    </span>
                  ))}
                  {client.needs.length > 2 && (
                    <span className="self-center text-[10px] text-ink-faint">+{client.needs.length - 2}</span>
                  )}
                </div>

                {/* Footer: AUM + last contact — pinned to bottom */}
                <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
                  <div>
                    <p className="font-display text-[18px] font-bold leading-none text-ink">
                      S${(client.aum / 1_000_000).toFixed(1)}M
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">AUM</p>
                  </div>
                  <p
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: isStale ? "var(--warn)" : "var(--ink-faint)" }}
                  >
                    <Clock className="size-3" />
                    {relativeDate(client.lastContact)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
