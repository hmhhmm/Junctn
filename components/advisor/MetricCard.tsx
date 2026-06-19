import { Progress } from "@/components/ui/progress";

type Tone = "neutral" | "accent" | "warn" | "alert";

// All color values reference CSS variables so they flip automatically in dark mode
const toneConfig: Record<Tone, { dot: string; iconColor: string; wash: string }> = {
  neutral: { dot: "transparent",      iconColor: "var(--ink-faint)", wash: "transparent" },
  accent:  { dot: "var(--accent)",    iconColor: "var(--accent)",    wash: "var(--wash-accent)" },
  warn:    { dot: "var(--warn)",      iconColor: "var(--warn)",      wash: "var(--wash-warn)" },
  alert:   { dot: "var(--alert)",     iconColor: "var(--alert)",     wash: "var(--wash-alert)" },
};

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
  tone?: Tone;
  progress?: number;
  progressTone?: "accent" | "warn" | "ok" | "alert";
}) {
  const cfg = toneConfig[tone];

  return (
    <div
      className="flex flex-col rounded-xl border border-line p-5 transition-colors"
      style={{
        backgroundColor: "var(--surface)",
        backgroundImage:
          tone !== "neutral"
            ? `linear-gradient(135deg, ${cfg.wash} 0%, transparent 60%)`
            : "none",
      }}
    >
      {/* Label row — icon left, status dot right */}
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" style={{ color: cfg.iconColor }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {label}
        </span>
        {tone !== "neutral" && (
          <span
            className="ml-auto size-[7px] shrink-0 rounded-full"
            style={{ background: cfg.dot }}
          />
        )}
      </div>

      {/* Hero number */}
      <p className="mt-4 font-display text-[28px] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>

      {/* Progress (CPD) */}
      {progress !== undefined && (
        <Progress value={progress} tone={progressTone} className="mt-3" />
      )}

      {/* Hint */}
      {hint && (
        <p className="mt-2 text-[11px] leading-snug text-ink-faint">{hint}</p>
      )}
    </div>
  );
}
