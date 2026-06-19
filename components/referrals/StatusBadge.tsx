import { Badge } from "@/components/ui/badge";
import type { ReferralStatus } from "@/lib/types";

export const STATUS_META: Record<
  ReferralStatus,
  { label: string; variant: "neutral" | "accent" | "warn" | "alert" | "ok"; color: string }
> = {
  suggested: { label: "Suggested", variant: "neutral", color: "#9696a6" },
  introduced: { label: "Introduced", variant: "accent", color: "#5b5bd6" },
  in_progress: { label: "In progress", variant: "warn", color: "#b76e00" },
  closed: { label: "Closed", variant: "ok", color: "#1a9d6e" },
  declined: { label: "Declined", variant: "alert", color: "#d23f57" },
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
