"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Sparkles, Mail } from "lucide-react";
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

  const [subject, setSubject] = useState(
    `Referral: ${client.name} — ${partner.specialty} support`,
  );

  const [body, setBody] = useState(
    `Hi ${partner.name.split(" ")[0]},

I hope you're well. I'd like to refer one of my clients who is looking for support with ${partner.specialty.toLowerCase()}.

Referral reason: ${reason}

I've shared the relevant details below. Please let me know if you're available to connect — happy to brief you further once you confirm.

Best regards`,
  );

  const [shared, setShared] = useState<string[]>(["Need", "Time horizon"]);

  function toggle(field: string) {
    setShared((s) => (s.includes(field) ? s.filter((x) => x !== field) : [...s, field]));
  }

  function openMailDraft() {
    addReferral({ clientId, advisorId, partnerId, reason, note: body, sharedFields: shared });
    pushToast("Draft ready", `Opening email to ${partner.name} — introduction logged.`);

    const mailto = `mailto:${partner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
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
          <DialogTitle>Draft referral email</DialogTitle>
          <DialogDescription>
            Review and edit before anything is sent. Opens in your mail client — you hit send.
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
                {partner.email}
              </p>
            </div>
          </div>
        </div>

        {/* Email subject */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-2.5 py-2 text-[13px] text-ink focus:outline-none"
          />
        </div>

        {/* Email body */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Email body (editable)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-md border border-line bg-surface p-2.5 text-[13px] text-ink focus:outline-none"
          />
        </div>

        {/* What gets shared */}
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
            Only ticked fields are mentioned in the email — never the full client record by default.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <ShieldCheck className="size-3.5 text-ok" />
            Logged to audit trail &middot; you control when it&apos;s sent
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={openMailDraft}>
              <Mail className="size-3.5" />
              Open in Mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
