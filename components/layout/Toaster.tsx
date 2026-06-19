"use client";

import { CheckCircle2, X } from "lucide-react";
import { useStore } from "@/lib/store";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[340px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-md border border-line bg-surface p-3.5 shadow-lift animate-fade-in"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t.title}</p>
            {t.detail && <p className="mt-0.5 text-[13px] text-ink-soft">{t.detail}</p>}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-ink-faint hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
