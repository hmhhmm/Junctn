"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Handshake, Lightbulb, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { partners, getClientsByAdvisor } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import type { Referral, ReferralStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: { status: ReferralStatus; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { status: "suggested",   label: "Suggested",    icon: Lightbulb,    color: "#8b9099", bg: "rgba(139,144,153,0.08)" },
  { status: "introduced",  label: "Introduced",   icon: Handshake,    color: "#378ADD", bg: "rgba(55,138,221,0.08)"  },
  { status: "in_progress", label: "In Progress",  icon: Clock,        color: "#BA7517", bg: "rgba(186,117,23,0.08)"  },
  { status: "closed",      label: "Closed",       icon: CheckCircle2, color: "#1D9E75", bg: "rgba(29,158,117,0.08)"  },
];

function ReferralCard({ referral, onAdvance }: { referral: Referral; onAdvance: (id: string, next: ReferralStatus) => void }) {
  const partner = partners.find((p) => p.id === referral.partnerId);
  const col = COLUMNS.find((c) => c.status === referral.status)!;
  const nextCol = COLUMNS[COLUMNS.findIndex((c) => c.status === referral.status) + 1];

  const date = new Date(referral.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" });

  return (
    <div
      className="rounded-lg border p-3 text-left transition-all"
      style={{ borderColor: `${col.color}25`, background: col.bg }}
    >
      <div className="flex items-start gap-2.5">
        {partner && <Avatar initials={partner.initials} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-ink">{partner?.name ?? referral.partnerId}</p>
          <p className="text-[11px] text-ink-faint">{partner?.specialty}</p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-ink-soft leading-snug line-clamp-2">{referral.reason}</p>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-ink-faint">{date}</span>
        {nextCol && referral.status !== "closed" && (
          <button
            onClick={() => onAdvance(referral.id, nextCol.status)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors hover:bg-surface-raised"
            style={{ color: nextCol.color }}
          >
            {nextCol.label} <ArrowRight className="size-3" />
          </button>
        )}
        {referral.status === "closed" && (
          <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "#1D9E75" }}>
            <CheckCircle2 className="size-3" /> Done
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  advisorId: string;
}

export function ReferralKanban({ advisorId }: Props) {
  const { referrals, updateReferralStatus } = useStore();
  const myReferrals = referrals.filter((r) => r.advisorId === advisorId && r.status !== "declined");

  const STATUS_ORDER: ReferralStatus[] = ["suggested", "introduced", "in_progress", "closed"];

  function handleAdvance(id: string, next: ReferralStatus) {
    updateReferralStatus(id, next);
  }

  if (myReferrals.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-ink-faint">
        No referrals yet — introduce a partner to get started.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const cards = myReferrals.filter((r) => r.status === col.status);
        const Icon = col.icon;
        return (
          <div key={col.status} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2"
                 style={{ background: col.bg, border: `1px solid ${col.color}20` }}>
              <div className="flex items-center gap-1.5">
                <Icon className="size-3.5" style={{ color: col.color }} />
                <span className="text-[12px] font-semibold" style={{ color: col.color }}>{col.label}</span>
              </div>
              <span className="rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{ background: `${col.color}18`, color: col.color }}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {cards.map((r) => (
                <ReferralCard key={r.id} referral={r} onAdvance={handleAdvance} />
              ))}
              {cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-line py-6 text-center">
                  <p className="text-[11px] text-ink-faint">Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
