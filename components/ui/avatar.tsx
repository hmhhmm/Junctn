import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({
  initials,
  className,
  size = "md",
  tone = "accent",
}: {
  initials: string;
  className?: string;
  size?: keyof typeof sizes;
  tone?: "accent" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        tone === "accent"
          ? "bg-accent-soft text-accent-ink"
          : "bg-[#ececf2] text-ink-soft",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
