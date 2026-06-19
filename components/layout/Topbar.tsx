"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck, ChevronRight, Sun, Moon } from "lucide-react";
import { useStore } from "@/lib/store";
import { getAdvisor, getPartner } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "./ThemeProvider";

function getPageCrumbs(pathname: string): string[] {
  if (pathname === "/advisor") return ["Dashboard"];
  if (pathname === "/advisor/clients") return ["Advisor", "Clients"];
  if (pathname.startsWith("/advisor/clients/")) return ["Advisor", "Clients", "Profile"];
  if (pathname === "/advisor/cpd") return ["Advisor", "Learning & CPD"];
  if (pathname === "/advisor/partners") return ["Advisor", "Partner matches"];
  if (pathname === "/partner") return ["Partner workspace"];
  if (pathname === "/org") return ["Organisation"];
  return ["Junctn"];
}

export function Topbar() {
  const pathname = usePathname();
  const { advisorId, partnerId } = useStore();
  const { theme, toggle } = useTheme();

  const role = pathname.startsWith("/partner")
    ? "partner"
    : pathname.startsWith("/org")
      ? "org"
      : "advisor";

  const advisor = getAdvisor(advisorId)!;
  const partner = getPartner(partnerId)!;

  const persona =
    role === "advisor"
      ? { name: advisor.name, sub: advisor.title, initials: advisor.initials }
      : role === "partner"
        ? { name: partner.name, sub: partner.specialty, initials: partner.initials }
        : { name: "Operations", sub: "Org admin", initials: "OP" };

  const crumbs = getPageCrumbs(pathname);

  const trustLabel =
    role === "org" ? "Anonymised" : role === "partner" ? "Shared fields only" : "Audit trail on";

  return (
    <header
      className="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-line px-5"
      style={{ background: "var(--topbar-bg)", backdropFilter: "blur(12px)" }}
    >
      {/* ── Left: breadcrumb ─────────────────── */}
      <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 text-ink-faint" />}
            <span
              className="text-[13px] font-medium"
              style={{ color: i === crumbs.length - 1 ? "var(--ink)" : "var(--ink-faint)" }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* ── Right: trust + toggle + user ─────── */}
      <div className="flex items-center gap-2.5">

        {/* Trust pill */}
        <span
          className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex"
          style={{ background: "var(--ok-soft)", color: "var(--ok)" }}
        >
          <ShieldCheck className="size-3" />
          {trustLabel}
        </span>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex size-7 items-center justify-center rounded-lg border border-line transition-colors hover:bg-accent-soft"
          style={{ background: "var(--surface)" }}
        >
          {theme === "dark" ? (
            <Sun className="size-3.5" style={{ color: "var(--warn)" }} />
          ) : (
            <Moon className="size-3.5" style={{ color: "var(--ink-soft)" }} />
          )}
        </button>

        {/* User chip */}
        <div
          className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1"
          style={{ background: "var(--surface)" }}
        >
          <Avatar initials={persona.initials} size="sm" />
          <div className="hidden leading-tight sm:block">
            <p className="text-[12px] font-semibold text-ink">{persona.name}</p>
            <p className="text-[10px] text-ink-faint">{persona.sub}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
