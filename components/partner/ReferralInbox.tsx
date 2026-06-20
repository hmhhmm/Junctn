"use client";

import { Lock, Check, X, Play, CheckCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { useStore } from "@/lib/store";
import { getPartnerInbox } from "@/lib/data";

export function ReferralInbox({ partnerId }: { partnerId: string }) {
  const { referrals, updateReferralStatus, pushToast } = useStore();
  const inbox = getPartnerInbox(partnerId, referrals);

  function act(id: string, status: Parameters<typeof updateReferralStatus>[1], label: string) {
    updateReferralStatus(id, status);
    pushToast(`Referral ${label}`, "The advisor has been notified of the status change.");
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Referral inbox</CardTitle>
        <span className="text-[11px] text-ink-faint">{inbox.length} total</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-0">
        {inbox.map(({ referral, client, advisor }) => {
          const isPending = referral.status === "suggested" || referral.status === "introduced";
          const isProgress = referral.status === "in_progress";
          // partner sees only advisor-shared fields — derive a masked label
          const showName = referral.sharedFields.includes("Contact name");
          const displayName = showName ? client.name : `${client.name.split(" ")[0]} ${client.initials.slice(-1)}.`;
          return (
            <div key={referral.id} className="rounded-md border border-line p-3.5">
              <div className="flex items-start gap-3">
                <Avatar initials={client.initials} size="md" tone="neutral" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-ink">{displayName}</p>
                    <ReferralStatusBadge status={referral.status} />
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-soft">{referral.reason}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    From {advisor.name} · {advisor.district} district · {referral.createdAt}
                  </p>
                  {referral.note && (
                    <p className="mt-2 rounded bg-surface-raised px-2.5 py-1.5 text-[12px] italic text-ink-soft">
                      “{referral.note}”
                    </p>
                  )}
                  {/* shared fields */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                      <Lock className="size-2.5" /> shared:
                    </span>
                    {referral.sharedFields.map((f) => (
                      <Badge key={f} variant="neutral">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {isPending && (
                  <>
                    <Button size="sm" onClick={() => act(referral.id, "in_progress", "accepted")}>
                      <Check className="size-4" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act(referral.id, "declined", "declined")}
                    >
                      <X className="size-4" /> Decline
                    </Button>
                  </>
                )}
                {isProgress && (
                  <>
                    <Button size="sm" onClick={() => act(referral.id, "closed", "closed")}>
                      <CheckCheck className="size-4" /> Mark closed
                    </Button>
                    <Button size="sm" variant="ghost" disabled>
                      <Play className="size-4" /> In progress
                    </Button>
                  </>
                )}
                {(referral.status === "closed" || referral.status === "declined") && (
                  <span className="text-[12px] text-ink-faint">No further action needed.</span>
                )}
              </div>
            </div>
          );
        })}
        {inbox.length === 0 && (
          <p className="py-6 text-center text-[13px] text-ink-faint">No referrals yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
