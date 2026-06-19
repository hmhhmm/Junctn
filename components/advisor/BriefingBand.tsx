"use client";

import { Sparkles, ArrowRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BriefingBand({ text }: { text: string }) {
  return (
    <section
      className="relative overflow-hidden rounded-xl p-7 text-white"
      style={{
        background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 55%, #0a2218 100%)",
      }}
    >
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Teal glow orb — top right */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #0f766e 0%, transparent 70%)" }}
      />

      {/* Subtle gold orb — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }}
      />

      <div className="relative">
        {/* AI chip */}
        <div
          className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
          style={{
            background: "rgba(15,118,110,0.2)",
            border: "1px solid rgba(94,234,212,0.2)",
            color: "#5eead4",
          }}
        >
          <Sparkles className="size-3" />
          Morning Briefing
        </div>

        {/* Headline text */}
        <p className="max-w-3xl font-display text-[22px] font-bold leading-snug tracking-tight text-balance md:text-[26px]">
          {text}
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="border-transparent text-white"
            style={{ background: "rgba(255,255,255,0.1)" }}
            asChild
          >
            <a href="#followups">
              <ListChecks className="size-4" />
              Review follow-ups
            </a>
          </Button>
          <Button
            size="sm"
            className="border-transparent text-white hover:opacity-90"
            style={{ background: "#0f766e" }}
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
