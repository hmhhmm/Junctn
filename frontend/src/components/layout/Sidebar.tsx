"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  advisors,
  partners,
  getClientsByAdvisor,
  getCpdStatus,
  suggestions,
} from "@/lib/data";

const roles = [
  { key: "advisor", label: "Advisor", href: "/advisor" },
  { key: "partner", label: "Partner", href: "/partner" },
  { key: "org", label: "Org", href: "/org" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { advisorId, setAdvisorId, partnerId, setPartnerId } = useStore();

  const role = pathname.startsWith("/partner")
    ? "partner"
    : pathname.startsWith("/org")
      ? "org"
      : "advisor";

  // Live nav badge data
  const activeClients = getClientsByAdvisor(advisorId).filter(
    (c) => c.status !== "dormant",
  ).length;
  const cpd = getCpdStatus(advisorId);
  const matchCount = suggestions.filter(
    (s) => s.advisorId === advisorId && s.kind === "partner_match",
  ).length;

  const nav =
    role === "advisor"
      ? [
          { label: "Dashboard", href: "/advisor", badge: null, badgeWarn: false },
          { label: "Clients", href: "/advisor/clients", badge: String(activeClients), badgeWarn: false },
          {
            label: "Learning & CPD",
            href: "/advisor/cpd",
            badge: `${cpd.earned}/${cpd.required}`,
            badgeWarn: cpd.remaining > 0,
          },
          {
            label: "Partner matches",
            href: "/advisor/partners",
            badge: matchCount > 0 ? String(matchCount) : null,
            badgeWarn: false,
          },
          { label: "Architecture", href: "/advisor/architecture", badge: null, badgeWarn: false },
        ]
      : role === "partner"
        ? [{ label: "Referral inbox", href: "/partner", badge: null, badgeWarn: false }]
        : [
            { label: "Overview", href: "/org", badge: null, badgeWarn: false },
            { label: "Coverage map", href: "/org#coverage", badge: null, badgeWarn: false },
            { label: "Referral pipeline", href: "/org#pipeline", badge: null, badgeWarn: false },
          ];

  const currentAdvisor = advisors.find((a) => a.id === advisorId)!;
  const currentPartner = partners.find((p) => p.id === partnerId)!;

  return (
    <aside
      className="flex h-full w-[240px] shrink-0 flex-col"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* ── Wordmark ─────────────────────────────── */}
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-[22px] font-black leading-none tracking-[0.2em] text-white">
          JUNCTN
        </h1>
        <p className="mt-2 text-[10px] leading-snug" style={{ color: "#1e3a5f" }}>
          where every relationship meets
        </p>
      </div>

      {/* ── Separator ────────────────────────────── */}
      <div className="mx-5 mb-3" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

      {/* ── Role badge ───────────────────────────── */}
      <div className="px-5 pb-3">
        <p
          className="mb-1.5 text-[9px] font-semibold uppercase"
          style={{ letterSpacing: "0.15em", color: "#1e3a5f" }}
        >
          Viewing as
        </p>
        <div className="relative">
          {/* Visual badge */}
          <div
            className="flex items-center justify-between rounded-md px-2.5 py-1.5"
            style={{
              background: "rgba(45,212,191,0.08)",
              border: "1px solid rgba(45,212,191,0.18)",
            }}
          >
            <span
              className="text-[12px] font-bold uppercase"
              style={{ letterSpacing: "0.12em", color: "#2dd4bf" }}
            >
              {role}
            </span>
            <ChevronDown className="size-3.5" style={{ color: "#2dd4bf" }} />
          </div>
          {/* Invisible select on top */}
          <select
            value={role}
            onChange={(e) =>
              router.push(roles.find((r) => r.key === e.target.value)!.href)
            }
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Switch role"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Separator ────────────────────────────── */}
      <div className="mx-5 mb-1" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="flex flex-1 flex-col py-2">
        {[...nav, ...(role === "advisor" ? [{ label: "Settings", href: "/advisor/settings", badge: null, badgeWarn: false }] : [])].map((item) => {
          const isRoot =
            item.href === "/advisor" ||
            item.href === "/partner" ||
            item.href === "/org" ||
            item.href === "/advisor/settings" ||
            item.href === "/advisor/architecture";
          const active = isRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center justify-between py-[9px] pr-5 text-[13px] transition-all duration-150"
              style={{
                paddingLeft: "20px",
                borderLeft: active
                  ? "2px solid #2dd4bf"
                  : "2px solid transparent",
                color: active ? "#f1f5f9" : "#334155",
              }}
            >
              <span
                className="font-medium transition-colors duration-150 group-hover:text-slate-200"
                style={{ color: active ? "#f1f5f9" : undefined }}
              >
                {item.label}
              </span>

              {item.badge && (
                <span
                  className="rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={
                    active
                      ? { background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }
                      : item.badgeWarn
                        ? { background: "rgba(180,83,9,0.15)", color: "#b45309" }
                        : { background: "rgba(255,255,255,0.05)", color: "#475569" }
                  }
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Persona ──────────────────────────────── */}
      {role !== "org" && (
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {role === "advisor" ? (
            <div className="relative">
              {/* Visual persona card */}
              <div
                className="flex items-center gap-2.5 rounded-lg p-2.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "#0f766e", color: "#fff" }}
                >
                  {currentAdvisor?.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12px] font-semibold leading-tight"
                    style={{ color: "#cbd5e1" }}
                  >
                    {currentAdvisor?.name}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: "#334155" }}>
                    {currentAdvisor?.district} district
                  </p>
                </div>
                <ChevronDown className="size-3.5 shrink-0" style={{ color: "#334155" }} />
              </div>
              {/* Invisible select */}
              <select
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Switch advisor"
              >
                {advisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.district}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative">
              <div
                className="flex items-center gap-2.5 rounded-lg p-2.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "#134e4a", color: "#2dd4bf" }}
                >
                  {currentPartner?.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12px] font-semibold leading-tight"
                    style={{ color: "#cbd5e1" }}
                  >
                    {currentPartner?.name}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: "#334155" }}>
                    {currentPartner?.specialty}
                  </p>
                </div>
                <ChevronDown className="size-3.5 shrink-0" style={{ color: "#334155" }} />
              </div>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Switch partner"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
