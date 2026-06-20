"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { IntroduceDialog } from "./IntroduceDialog";
import { getClient, getPartner, matchPartners } from "@/lib/data";
import type { Suggestion } from "@/lib/types";

export function PartnerMatchCard({ suggestion }: { suggestion: Suggestion }) {
  const clientId = suggestion.payload.clientId!;
  const partnerId = suggestion.payload.partnerId!;
  const client = getClient(clientId)!;
  const partner = getPartner(partnerId)!;

  const match = matchPartners(client).find((m) => m.partner.id === partnerId);
  const score = match?.score ?? Math.round(partner.successRate * 100);
  const reason = match?.reason ?? `${partner.specialty} specialist`;

  return (
    <div className="rounded-md border border-line p-3.5">
      {/* trigger line — the visible source */}
      <p className="mb-2.5 text-[11px] font-medium text-accent-ink">
        {suggestion.trigger}
      </p>

      <div className="flex items-center gap-2.5">
        <Avatar initials={partner.initials} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{partner.name}</p>
          <p className="text-[11px] text-ink-faint">
            {partner.specialty} · {partner.region}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[18px] font-bold leading-none text-accent-ink">{score}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-faint">match</p>
        </div>
      </div>

      <p className="mt-2.5 rounded bg-surface-raised px-2 py-1.5 text-[11px] leading-relaxed text-ink-soft">
        {reason}
      </p>

      <IntroduceDialog
        clientId={clientId}
        partnerId={partnerId}
        reason={client.needs.includes(partner.specialty) ? suggestion.payload.detail ?? reason : reason}
        trigger={
          <Button variant="soft" size="sm" className="mt-2.5 w-full">
            Introduce {client.name.split(" ")[0]}
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    </div>
  );
}
