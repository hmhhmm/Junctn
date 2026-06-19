import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  progress,
  progressTone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone?: "neutral" | "accent" | "warn" | "alert";
  progress?: number;
  progressTone?: "accent" | "warn" | "ok" | "alert";
}) {
  const iconWrap =
    tone === "accent"
      ? "bg-accent-soft text-accent-ink"
      : tone === "warn"
        ? "bg-warn-soft text-warn"
        : tone === "alert"
          ? "bg-alert-soft text-alert"
          : "bg-[#f1f1f6] text-ink-soft";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-ink-soft">{label}</p>
        <span className={cn("flex size-7 items-center justify-center rounded-md", iconWrap)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-[30px] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>
      {progress !== undefined && (
        <Progress value={progress} tone={progressTone} className="mt-3" />
      )}
      {hint && <p className="mt-2 text-[11px] text-ink-faint">{hint}</p>}
    </Card>
  );
}
