"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Clock, TrendingUp, ChevronRight } from "lucide-react";
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

const STATUS: Record<Client["status"], { label: string; bg: string; color: string }> = {
  review_due: { label: "Review due", bg: "var(--warn-soft)",      color: "var(--warn)" },
  active:     { label: "Active",     bg: "var(--ok-soft)",        color: "var(--ok)" },
  prospect:   { label: "Prospect",   bg: "var(--accent-soft)",    color: "var(--accent-ink)" },
  dormant:    { label: "Dormant",    bg: "var(--surface-raised)", color: "var(--ink-faint)" },
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
              RM{(totalAum / 1_000_000).toFixed(1)}M AUM
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
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors"
              style={on
                ? cfg
                  ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
                  : { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" }
                : { background: "transparent", color: "var(--ink-soft)", borderColor: "var(--line)" }
              }
            >
              {cfg && on && <span className="size-1.5 rounded-full" style={{ background: cfg.color }} />}
              {s === "all" ? "All" : cfg!.label}
              <span className="opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Client list ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] font-medium text-ink">No clients found</p>
          <p className="mt-1 text-[12px] text-ink-faint">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_32px] gap-4 border-b border-line px-5 py-2.5">
            {["Client", "Status", "Needs", "AUM", "Last contact", ""].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-ink-faint">{h}</span>
            ))}
          </div>

          <ul className="divide-y divide-line">
            {filtered.map((client) => {
              const cfg      = STATUS[client.status];
              const isUrgent = client.status === "review_due";
              const isStale  = Date.now() - new Date(client.lastContact).getTime() > 30 * 86_400_000;

              return (
                <li key={client.id}>
                  <Link
                    href={`/advisor/clients/${client.id}`}
                    className="group grid grid-cols-[2fr_1fr_2fr_1fr_1fr_32px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover"
                    style={isUrgent ? { background: "var(--warn-soft)" } : undefined}
                  >
                    {/* Client name + avatar */}
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar initials={client.initials} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{client.name}</p>
                        {client.tags.length > 0 && (
                          <p className="truncate text-[11px] text-ink-faint">{client.tags[0]}</p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>

                    {/* Needs */}
                    <div className="flex flex-wrap gap-1">
                      {client.needs.slice(0, 3).map((n) => (
                        <span
                          key={n}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-soft"
                          style={{ background: "var(--surface-raised)" }}
                        >
                          {n}
                        </span>
                      ))}
                      {client.needs.length > 3 && (
                        <span className="text-[10px] text-ink-faint">+{client.needs.length - 3}</span>
                      )}
                    </div>

                    {/* AUM */}
                    <p className="font-display text-[14px] font-bold text-ink">
                      RM{(client.aum / 1_000_000).toFixed(1)}M
                    </p>

                    {/* Last contact */}
                    <p
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: isStale ? "var(--warn)" : "var(--ink-faint)" }}
                    >
                      <Clock className="size-3 shrink-0" />
                      {relativeDate(client.lastContact)}
                    </p>

                    {/* Arrow */}
                    <ChevronRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
