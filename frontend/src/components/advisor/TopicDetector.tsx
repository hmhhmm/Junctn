"use client";

import { useEffect, useRef, useState } from "react";
import { Network, X, ArrowRight, Sparkles, Mic } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { IntroduceDialog } from "@/components/advisor/IntroduceDialog";
import { Button } from "@/components/ui/button";
import type { ApiPartnerMatch } from "@/app/api/match/route";

const CONFIDENCE_THRESHOLD = 68; // score out of 100

const DEMO_PROMPTS = [
  "I'm thinking about setting up a family trust for my assets",
  "I need help with estate planning for my children",
  "I want to buy a second property — what are my options?",
  "I'm worried about tax on my investments next year",
];

interface Props {
  clientId: string;
  clientName: string;
  advisorRegion?: string;
}

export function TopicDetector({ clientId, clientName, advisorRegion }: Props) {
  const [text, setText] = useState("");
  const [match, setMatch] = useState<ApiPartnerMatch | null>(null);
  const [visible, setVisible] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 12) { setVisible(false); return; }

    setDetecting(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text, top_k: 1, advisor_region: advisorRegion }),
        });
        const d = await res.json();
        const top: ApiPartnerMatch | undefined = d.matches?.[0];
        if (top && top.score >= CONFIDENCE_THRESHOLD) {
          setMatch(top);
          setVisible(true);
        } else {
          setVisible(false);
        }
      } catch {
        // silent
      } finally {
        setDetecting(false);
      }
    }, 700);
  }, [text, advisorRegion]);

  function dismiss() {
    setVisible(false);
    setMatch(null);
    setText("");
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className="flex size-6 items-center justify-center rounded-md"
            style={{ background: "var(--accent-soft)" }}
          >
            <Mic className="size-3.5 text-accent-ink" />
          </span>
          <p className="text-[12px] font-semibold text-ink">Live topic detector</p>
          {detecting && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-faint">
              <Sparkles className="size-3 animate-pulse text-accent-ink" />
              Analysing…
            </span>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type what your client is saying, e.g. "I want to set up a family trust…"'
          rows={2}
          className="w-full resize-none rounded-lg border border-line bg-surface-raised px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {/* Demo prompts */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEMO_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setText(p)}
              className="rounded-full border border-line px-2.5 py-1 text-[10px] text-ink-faint transition-colors hover:border-accent/40 hover:text-ink-soft"
            >
              {p.slice(0, 38)}…
            </button>
          ))}
        </div>
      </div>

      {/* Partner card slide-in */}
      <div
        className="mt-3 overflow-hidden transition-all duration-300"
        style={{
          maxHeight: visible && match ? "300px" : "0px",
          opacity: visible && match ? 1 : 0,
        }}
      >
        {match && (
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "rgba(45,212,191,0.35)",
              background: "rgba(45,212,191,0.05)",
              boxShadow: "0 0 24px rgba(45,212,191,0.08)",
            }}
          >
            {/* Trigger line */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Network className="size-3.5 text-accent-ink" />
                <span className="text-[11px] font-semibold text-accent-ink">
                  Topic detected · {match.score}% confidence
                </span>
              </div>
              <button
                onClick={dismiss}
                className="rounded p-1 text-ink-faint transition-colors hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Partner */}
            <div className="flex items-center gap-3">
              <Avatar initials={match.initials} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{match.name}</p>
                <p className="text-[11px] text-ink-faint">{match.specialty} · {match.region}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-[20px] font-bold leading-none text-accent-ink">{match.score}</p>
                <p className="text-[9px] uppercase tracking-wider text-ink-faint">match</p>
              </div>
            </div>

            <p
              className="mt-2.5 rounded-lg px-3 py-2 text-[11px] text-ink-soft"
              style={{ background: "var(--surface-raised)" }}
            >
              {match.reason}
            </p>

            <IntroduceDialog
              clientId={clientId}
              partnerId={match.id}
              reason={match.reason}
              trigger={
                <Button variant="primary" size="sm" className="mt-3 w-full">
                  Introduce {clientName.split(" ")[0]}
                  <ArrowRight className="size-3.5" />
                </Button>
              }
            />

            <p className="mt-2 text-center text-[10px] text-ink-faint">
              Contact details never shared until advisor approves
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
