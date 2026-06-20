import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "warn" | "ok" | "alert";
}) {
  const toneClass =
    tone === "warn"
      ? "bg-warn"
      : tone === "ok"
        ? "bg-ok"
        : tone === "alert"
          ? "bg-alert"
          : "bg-accent";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[#ededf3]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// Circular progress ring (for CPD)
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  tone = "accent",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "accent" | "warn" | "ok";
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;
  const color =
    tone === "warn" ? "var(--warn)" : tone === "ok" ? "var(--ok)" : "var(--accent)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
