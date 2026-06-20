"use client";

import { useState } from "react";
import { ExternalLink, Newspaper, Send, Check, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@/lib/types";

interface Props {
  items: NewsItem[];
  clientName?: string;
}

const SOURCE_COLOR: Record<string, string> = {
  "MAS":               "#0f766e",
  "Bloomberg":         "#f59e0b",
  "CNA":               "#6366f1",
  "Straits Times":     "#10b981",
  "Reuters":           "#ef4444",
  "Business Times":    "#8b5cf6",
  "Forbes":            "#ec4899",
  "EdgeProp":          "#0ea5e9",
  "Edge Singapore":    "#0ea5e9",
  "Lianhe":            "#f97316",
  "Singapore Business": "#64748b",
};

function sourceColor(source: string): string {
  for (const [key, color] of Object.entries(SOURCE_COLOR)) {
    if (source.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#64748b";
}

function ShareButton({ item, clientName }: { item: NewsItem; clientName?: string }) {
  const [copied, setCopied] = useState(false);

  function shareViaEmail() {
    const name = clientName ? clientName.split(" ")[0] : "there";
    const body = `Hi ${name},\n\nI came across this article and thought it might be relevant to your situation:\n\n"${item.headline}"\n${item.source} · ${item.date}\n\n${item.summary}\n\n${item.url ? `Read more: ${item.url}\n\n` : ""}Let me know if you'd like to discuss further.\n\nBest regards`;
    const subject = `Thought this might interest you — ${item.headline.slice(0, 60)}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  }

  async function copyLink() {
    if (!item.url) return;
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5">
      <button
        onClick={shareViaEmail}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold text-accent-ink transition-colors hover:bg-accent-soft"
      >
        <Send className="size-3" />
        Share with client
      </button>
      {item.url && (
        <>
          <div className="h-3 w-px bg-line" />
          <button
            onClick={copyLink}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-ink-faint transition-colors hover:bg-surface-raised"
          >
            {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <div className="h-3 w-px bg-line" />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-ink-faint transition-colors hover:bg-surface-raised"
          >
            <ExternalLink className="size-3" />
            Open
          </a>
        </>
      )}
    </div>
  );
}

export function EvidenceRail({ items, clientName }: Props) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Newspaper className="size-4 text-ink-soft" />
          Relevant intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-[11px] text-ink-faint">
          Articles matched to this client&apos;s needs and interests — share directly via email.
        </p>
        {items.map((item) => {
          const color = sourceColor(item.source);
          return (
            <div
              key={item.id}
              className="rounded-lg border border-line p-3"
            >
              {/* Source + date row */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: `${color}14`, color }}
                >
                  {item.source}
                </span>
                <span className="text-[11px] text-ink-faint">{item.date}</span>
              </div>

              {/* Headline */}
              <p className="text-[13px] font-semibold leading-snug text-ink">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-ink hover:underline"
                  >
                    {item.headline}
                    <ExternalLink className="ml-1 inline-block size-3 opacity-40" />
                  </a>
                ) : item.headline}
              </p>

              {/* Summary */}
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                {item.summary}
              </p>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-faint"
                      style={{ background: "var(--surface-raised)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share action */}
              <ShareButton item={item} clientName={clientName} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
