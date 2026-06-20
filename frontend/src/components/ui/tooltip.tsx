"use client";

import { useState, useId } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  /** Show a small ⓘ icon instead of wrapping children */
  icon?: boolean;
}

export function Tooltip({ content, children, icon = false }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const trigger = icon ? (
    <Info
      className="inline-block size-3.5 shrink-0 cursor-help text-ink-faint transition-colors hover:text-ink-soft"
      aria-hidden="true"
    />
  ) : (
    children
  );

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center gap-1 outline-none"
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        {trigger}
      </span>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] leading-relaxed text-ink shadow-lg"
        >
          {content}
          {/* arrow */}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-line"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
