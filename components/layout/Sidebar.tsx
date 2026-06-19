"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Network,
  Inbox,
  BarChart3,
  Map,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { advisors, partners, getClientsByAdvisor } from "@/lib/data";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "./RoleSwitcher";

type NavItem = { label: string; href: string; icon: React.ElementType };

export function Sidebar() {
  const pathname = usePathname();
  const { advisorId, setAdvisorId, partnerId, setPartnerId } = useStore();

  const role = pathname.startsWith("/partner")
    ? "partner"
    : pathname.startsWith("/org")
      ? "org"
      : "advisor";

  const nav: NavItem[] =
    role === "advisor"
      ? [
          { label: "Dashboard", href: "/advisor", icon: LayoutDashboard },
          { label: "Clients", href: "/advisor#clients", icon: Users },
          { label: "Learning & CPD", href: "/advisor#cpd", icon: GraduationCap },
          { label: "Partner matches", href: "/advisor#partners", icon: Network },
        ]
      : role === "partner"
        ? [{ label: "Referral inbox", href: "/partner", icon: Inbox }]
        : [
            { label: "Overview", href: "/org", icon: BarChart3 },
            { label: "Coverage map", href: "/org#coverage", icon: Map },
            { label: "Referral pipeline", href: "/org#pipeline", icon: GitBranch },
          ];

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent text-white shadow-band">
          <Network className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[17px] font-bold tracking-tight text-ink">
            Junctn
          </p>
          <p className="text-[10px] text-ink-faint">where every relationship meets</p>
        </div>
      </div>

      <div className="px-3">
        <RoleSwitcher />
      </div>

      {/* Nav */}
      <nav className="mt-5 flex flex-1 flex-col gap-0.5 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href === `/${role}` && pathname === `/${role}`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-[#f4f4f8] hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Persona picker */}
      {role !== "org" && (
        <div className="border-t border-line p-3">
          <label className="mb-1.5 block px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            {role === "advisor" ? "Signed in as advisor" : "Signed in as partner"}
          </label>
          <div className="relative">
            <select
              value={role === "advisor" ? advisorId : partnerId}
              onChange={(e) =>
                role === "advisor"
                  ? setAdvisorId(e.target.value)
                  : setPartnerId(e.target.value)
              }
              className="w-full cursor-pointer appearance-none rounded-md border border-line bg-surface py-2 pl-3 pr-8 text-[13px] font-medium text-ink hover:bg-[#f9f9fc] focus:outline-none"
            >
              {role === "advisor"
                ? advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.district}
                    </option>
                  ))
                : partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          </div>
          {role === "advisor" && (
            <p className="mt-2 px-1 text-[11px] text-ink-faint">
              {getClientsByAdvisor(advisorId).length} clients in book
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
