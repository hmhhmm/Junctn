import { CheckCircle2, Clock, Inbox, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon className="size-4" />
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-[26px] font-bold leading-none text-ink">{value}</p>
    </Card>
  );
}

export function PartnerStats({
  acceptanceRate,
  avgDaysToClose,
  open,
  total,
}: {
  acceptanceRate: number;
  avgDaysToClose: number;
  open: number;
  total: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Acceptance rate" value={`${Math.round(acceptanceRate * 100)}%`} icon={TrendingUp} />
      <Stat label="Avg time to close" value={`${avgDaysToClose}d`} icon={Clock} />
      <Stat label="Open referrals" value={String(open)} icon={Inbox} />
      <Stat label="Lifetime referrals" value={String(total)} icon={CheckCircle2} />
    </div>
  );
}
