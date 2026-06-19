"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck, CalendarDays } from "lucide-react";
import { useStore } from "@/lib/store";
import { getAdvisor, getPartner } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";

export function Topbar() {
  const pathname = usePathname();
  const { advisorId, partnerId } = useStore();

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
        ? { name: partner.name, sub: `${partner.specialty} · ${partner.region}`, initials: partner.initials }
        : { name: "Operations", sub: "Org administrator", initials: "OP" };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-[13px] text-ink-soft">
        <CalendarDays className="size-4 text-ink-faint" />
        <span>Friday, 19 June 2026</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-[#f4f4f8] px-2.5 py-1 text-[11px] font-medium text-ink-soft sm:inline-flex">
          <ShieldCheck className="size-3.5 text-ok" />
          {role === "org"
            ? "Aggregate & anonymised"
            : role === "partner"
              ? "Advisor-shared fields only"
              : "Introductions logged & approved"}
        </span>
        <div className="flex items-center gap-2.5">
          <div className="text-right leading-tight">
            <p className="text-[13px] font-semibold text-ink">{persona.name}</p>
            <p className="text-[11px] text-ink-faint">{persona.sub}</p>
          </div>
          <Avatar initials={persona.initials} size="md" />
        </div>
      </div>
    </header>
  );
}
