import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-line bg-surface-raised text-ink-soft",
        accent: "border-transparent bg-accent-soft text-accent-ink",
        warn: "border-transparent bg-warn-soft text-warn",
        alert: "border-transparent bg-alert-soft text-alert",
        ok: "border-transparent bg-ok-soft text-ok",
        outline: "border-line bg-transparent text-ink-soft",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
