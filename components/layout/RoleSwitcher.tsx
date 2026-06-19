"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserRound, Handshake, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { key: "advisor", label: "Advisor", href: "/advisor", icon: UserRound },
  { key: "partner", label: "Partner", href: "/partner", icon: Handshake },
  { key: "org", label: "Org", href: "/org", icon: Building2 },
] as const;

export function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.startsWith("/partner")
    ? "partner"
    : pathname.startsWith("/org")
      ? "org"
      : "advisor";

  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
        Viewing as
      </p>
      <div
        role="tablist"
        aria-label="Switch role"
        className="grid grid-cols-3 gap-1 rounded-md border border-line bg-[#f4f4f8] p-1"
      >
        {roles.map((r) => {
          const isActive = active === r.key;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => router.push(r.href)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-sm py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-surface text-accent-ink shadow-card"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
