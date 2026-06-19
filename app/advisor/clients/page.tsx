"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpRight, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { getClientsByAdvisor } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import type { Client } from "@/lib/types";

const statusConfig: Record<
  Client["status"],
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "#166534", bg: "#dcfce7" },
  prospect: { label: "Prospect", color: "#134e4a", bg: "#ccfbf1" },
  review_due: { label: "Review due", color: "#b45309", bg: "#fef3c7" },
  dormant: { label: "Dormant", color: "#64748b", bg: "#f1f5f9" },
};

const statusOrder: Client["status"][] = ["review_due", "active", "prospect", "dormant"];

export default function ClientsPage() {
  const { advisorId } = useStore();
  const allClients = getClientsByAdvisor(advisorId);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<Client["status"] | "all">("all");

  const filtered = allClients
    .filter((c) =>
      filterStatus === "all" ? true : c.status === filterStatus,
    )
    .filter((c) =>
      query.trim() === ""
        ? true
        : c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          c.needs.some((n) => n.toLowerCase().includes(query.toLowerCase())),
    )
    .sort(
      (a, b) =>
        statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
    );

  const totalAum = allClients.reduce((s, c) => s + c.aum, 0);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
            Client book
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {allClients.length} clients · S${(totalAum / 1_000_000).toFixed(1)}M total AUM
          </p>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...statusOrder] as const).map((s) => {
            const cfg = s === "all" ? null : statusConfig[s];
            const count = s === "all"
              ? allClients.length
              : allClients.filter((c) => c.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                style={
                  filterStatus === s
                    ? { background: cfg?.bg ?? "#0f1923", color: cfg?.color ?? "#fff" }
                    : { background: "#f1f5f9", color: "#64748b" }
                }
              >
                {s === "all" ? "All" : cfg!.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-sm">
        <Search className="size-4 text-ink-faint" />
        <input
          type="text"
          placeholder="Search by name, tag, or need…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      {/* Client list */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-[14px] text-ink-faint">No clients match your filter.</p>
        )}
        {filtered.map((client) => {
          const cfg = statusConfig[client.status];
          const aumM = (client.aum / 1_000_000).toFixed(2);
          const reviewDue = client.status === "review_due";
          return (
            <Link
              key={client.id}
              href={`/advisor/clients/${client.id}`}
              className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0f766e]/30"
              style={reviewDue ? { borderLeft: "3px solid #b45309" } : {}}
            >
              <Avatar initials={client.initials} size="lg" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-semibold text-ink">{client.name}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {reviewDue && (
                    <span className="flex items-center gap-1 text-[11px] text-warn">
                      <AlertCircle className="size-3" />
                      Review due
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {client.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[11px]"
                      style={{ background: "#f1f5f9", color: "#64748b" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {client.needs.map((n) => (
                    <span
                      key={n}
                      className="rounded-md px-2 py-0.5 text-[11px]"
                      style={{ background: "#ccfbf1", color: "#134e4a" }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-ink-faint" />
                  <span className="font-display text-[18px] font-bold text-ink">
                    S${aumM}M
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                  <Clock className="size-3" />
                  Last contact {client.lastContact}
                </div>
              </div>

              <ArrowUpRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-ink" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
