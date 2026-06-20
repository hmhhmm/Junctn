"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface GmailThread {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  date: string;
  snippet: string;
  unread: boolean;
  messageCount: number;
}

function relativeDate(raw: string): string {
  try {
    const d = new Date(raw);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    return `${Math.floor(hr / 24)}d`;
  } catch {
    return "";
  }
}

export function LiveGmail({ maxItems = 8 }: { maxItems?: number }) {
  const [threads, setThreads] = useState<GmailThread[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gmail/threads")
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "not_connected") {
          setConnected(false);
        } else {
          setConnected(true);
          setThreads(d.threads ?? []);
        }
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card id="inbox">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-ink-soft" />
          Inbox
          {connected && (
            <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
              <CheckCircle2 className="size-2.5" /> Live
            </span>
          )}
        </CardTitle>
        {connected && threads.filter((t) => t.unread).length > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{ background: "var(--alert-soft)", color: "var(--alert)" }}>
            {threads.filter((t) => t.unread).length} unread
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-[13px] text-ink-faint">
            <RefreshCw className="size-4 animate-spin" /> Loading…
          </div>
        ) : !connected ? (
          <div className="rounded-lg border border-line p-4 text-center" style={{ background: "var(--surface-raised)" }}>
            <Mail className="mx-auto mb-2 size-5 text-ink-faint" />
            <p className="text-[12px] text-ink-soft">Connect Gmail to surface recent threads</p>
            <Link href="/advisor/settings" className="mt-1.5 inline-block text-[11px] font-medium text-accent hover:underline">
              Connect in Settings →
            </Link>
          </div>
        ) : threads.length === 0 ? (
          <p className="py-2 text-[13px] text-ink-faint">Inbox is empty.</p>
        ) : (
          <>
          <ul className="flex flex-col">
            {threads.slice(0, maxItems).map((t, i) => (
              <li key={t.id}
                  className={`flex gap-2 py-2.5 ${i !== Math.min(threads.length, maxItems) - 1 ? "border-b border-line" : ""}`}>
                <div className="mt-1.5 size-2 shrink-0">
                  {t.unread && <span className="block size-2 rounded-full bg-accent" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[12px]"
                       style={{ fontWeight: t.unread ? 600 : 400, color: "var(--ink)" }}>
                      {t.from}
                    </p>
                    <span className="shrink-0 text-[10px] text-ink-faint">{relativeDate(t.date)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px]"
                     style={{ color: t.unread ? "var(--ink-soft)" : "var(--ink-faint)" }}>
                    {t.subject}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {threads.length > maxItems && (
            <p className="mt-2 border-t border-line pt-2 text-center text-[11px] text-ink-faint">
              +{threads.length - maxItems} more in Gmail
            </p>
          )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
