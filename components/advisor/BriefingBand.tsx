"use client";

import { Sparkles, ArrowRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BriefingBand({ text }: { text: string }) {
  return (
    <section
      className="relative overflow-hidden rounded-lg p-6 text-white shadow-band"
      style={{
        background:
          "linear-gradient(115deg, #5b5bd6 0%, #6d5be0 45%, #8a5cf0 100%)",
      }}
    >
      {/* decorative */}
      <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 right-24 size-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
          <Sparkles className="size-3.5" />
          Your morning briefing
        </div>
        <p className="max-w-3xl font-display text-[22px] font-semibold leading-snug tracking-tight text-balance md:text-[26px]">
          {text}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="border-transparent bg-white text-accent-ink hover:bg-white/90"
            asChild
          >
            <a href="#followups">
              <ListChecks className="size-4" />
              Review follow-ups
            </a>
          </Button>
          <Button
            size="sm"
            className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
            asChild
          >
            <a href="#schedule">
              See full briefing
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
