"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Network,
  Settings,
  Inbox,
  BarChart2,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { advisors, partners } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "./ThemeProvider";

const roles = [
  { key: "advisor", label: "Advisor", href: "/advisor" },
  { key: "partner", label: "Partner", href: "/partner" },
  { key: "org", label: "Org", href: "/org" },
] as const;

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { advisorId, setAdvisorId, partnerId, setPartnerId } = useStore();
  const { theme, toggle } = useTheme();

  const role = pathname.startsWith("/partner")
    ? "partner"
    : pathname.startsWith("/org")
      ? "org"
      : "advisor";

  const currentAdvisor = advisors.find((a) => a.id === advisorId)!;
  const currentPartner = partners.find((p) => p.id === partnerId)!;

  // Nav items per role
  const navItems =
    role === "advisor"
      ? [
          { label: "Dashboard", href: "/advisor", icon: LayoutDashboard, exact: true },
          { label: "Clients", href: "/advisor/clients", icon: Users, exact: false },
          { label: "Learning", href: "/advisor/cpd", icon: GraduationCap, exact: false },
          { label: "Partners", href: "/advisor/partners", icon: Network, exact: false },
          { label: "Settings", href: "/advisor/settings", icon: Settings, exact: true },
        ]
      : role === "partner"
        ? [{ label: "Inbox", href: "/partner", icon: Inbox, exact: true }]
        : [{ label: "Overview", href: "/org", icon: BarChart2, exact: true }];

  const persona =
    role === "advisor"
      ? { name: currentAdvisor?.name, sub: currentAdvisor?.district + " district", initials: currentAdvisor?.initials }
      : role === "partner"
        ? { name: currentPartner?.name, sub: currentPartner?.specialty, initials: currentPartner?.initials }
        : { name: "Operations", sub: "Org admin", initials: "OP" };

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-line px-5"
      style={{ background: "var(--sidebar-bg)", backdropFilter: "blur(12px)" }}
    >
      {/* ── Wordmark ─────────────────────────────────────────────── */}
      <Link href={role === "advisor" ? "/advisor" : role === "partner" ? "/partner" : "/org"}
            className="mr-8 shrink-0">
        <span className="font-black tracking-[0.18em] text-white text-[17px]">JUNCTN</span>
      </Link>

      {/* ── Tab nav ──────────────────────────────────────────────── */}
      <nav className="flex flex-1 items-stretch gap-0.5 self-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-2 px-3.5 text-[13px] font-medium transition-colors"
              style={{ color: active ? "#fff" : "#475569" }}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>

              {/* Active underline */}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                  style={{ background: "#2dd4bf" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Right actions ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pl-4">

        {/* Role switcher */}
        <div className="relative">
          <div
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase"
            style={{
              background: "rgba(45,212,191,0.08)",
              border: "1px solid rgba(45,212,191,0.18)",
              letterSpacing: "0.1em",
              color: "#2dd4bf",
            }}
          >
            {role}
            <ChevronDown className="size-3" />
          </div>
          <select
            value={role}
            onChange={(e) => router.push(roles.find((r) => r.key === e.target.value)!.href)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Switch role"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
        >
          {theme === "dark"
            ? <Sun className="size-3.5" style={{ color: "#f59e0b" }} />
            : <Moon className="size-3.5 text-slate-400" />}
        </button>

        {/* Persona chip + switcher */}
        <div className="relative">
          <div
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Avatar initials={persona.initials} size="sm" />
            <div className="hidden leading-tight sm:block">
              <p className="text-[12px] font-semibold" style={{ color: "#cbd5e1" }}>{persona.name}</p>
              <p className="text-[10px]" style={{ color: "#475569" }}>{persona.sub}</p>
            </div>
            <ChevronDown className="size-3 shrink-0" style={{ color: "#475569" }} />
          </div>
          {role === "advisor" && (
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Switch advisor"
            >
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.district}</option>
              ))}
            </select>
          )}
          {role === "partner" && (
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Switch partner"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

      </div>
    </header>
  );
}
