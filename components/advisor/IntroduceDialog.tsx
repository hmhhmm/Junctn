"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { getClient, getPartner } from "@/lib/data";

const SHAREABLE = ["Need", "Time horizon", "Budget range", "Contact name", "Full client record"];

export function IntroduceDialog({
  clientId,
  partnerId,
  reason,
  trigger,
}: {
  clientId: string;
  partnerId: string;
  reason: string;
  trigger: React.ReactNode;
}) {
  const { addReferral, pushToast, advisorId } = useStore();
  const [open, setOpen] = useState(false);

  const client = getClient(clientId)!;
  const partner = getPartner(partnerId)!;

  const [note, setNote] = useState(
    `Hi ${partner.name.split(" ")[0] ?? partner.name}, I have a client who needs support with ${partner.specialty.toLowerCase()}. ${reason}. Sharing the basics below — happy to brief you further once you accept.`,
  );
  const [shared, setShared] = useState<string[]>(["Need", "Time horizon"]);

  function toggle(field: string) {
    setShared((s) => (s.includes(field) ? s.filter((x) => x !== field) : [...s, field]));
  }

  function approve() {
    addReferral({ clientId, advisorId, partnerId, reason, note, sharedFields: shared });
    pushToast("Introduction logged", `${client.name} → ${partner.name}. Pending partner acceptance.`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">
            <Sparkles className="size-3" />
            AI-matched introduction
          </span>
          <DialogTitle>Log an introduction</DialogTitle>
          <DialogDescription>
            Review before anything is sent. Nothing leaves your desk until you approve it.
          </DialogDescription>
        </DialogHeader>

        {/* Connection summary */}
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface-raised p-3">
          <div className="flex items-center gap-2">
            <Avatar initials={client.initials} size="sm" tone="neutral" />
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-ink">{client.name}</p>
              <p className="text-[11px] text-ink-faint">Your client</p>
            </div>
          </div>
          <div className="flex-1 border-t border-dashed border-line" />
          <Badge variant="accent">{partner.specialty}</Badge>
          <div className="flex-1 border-t border-dashed border-line" />
          <div className="flex items-center gap-2">
            <Avatar initials={partner.initials} size="sm" />
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-ink">{partner.name}</p>
              <p className="text-[11px] text-ink-faint">
                Partner · {Math.round(partner.successRate * 100)}% success
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Why this match
          </p>
          <p className="text-[13px] text-ink-soft">{reason}</p>
        </div>

        {/* Editable note */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Intro note (editable)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-line bg-surface p-2.5 text-[13px] text-ink focus:outline-none"
          />
        </div>

        {/* What gets shared — the privacy boundary */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            <Lock className="size-3" /> What {partner.name} will see
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SHAREABLE.map((field) => {
              const on = shared.includes(field);
              const sensitive = field === "Full client record";
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => toggle(field)}
                  className={
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors " +
                    (on
                      ? sensitive
                        ? "border-transparent bg-alert-soft text-alert"
                        : "border-transparent bg-accent-soft text-accent-ink"
                      : "border-line text-ink-faint hover:text-ink")
                  }
                  aria-pressed={on}
                >
                  {on ? "✓ " : ""}
                  {field}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            The partner only ever sees the fields you tick — never the full client record by default.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <ShieldCheck className="size-3.5 text-ok" />
            Logged to audit trail · not auto-sent
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Button size="sm" onClick={approve}>
              Approve &amp; log
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
