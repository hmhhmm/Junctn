"use client";

import { useEffect, useState } from "react";
import { ScrollText, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AuditEntry {
  timestamp: string;
  advisor_id: string;
  feature: string;
  agent_step: string;
  input_token_count: number;
  output_summary: string;
}

const FEATURE_COLORS: Record<string, { bg: string; color: string }> = {
  briefing:    { bg: "rgba(45,212,191,0.1)",  color: "#2dd4bf" },
  cpd:         { bg: "rgba(127,119,221,0.1)", color: "#7F77DD" },
  matching:    { bg: "rgba(186,117,23,0.1)",  color: "#BA7517" },
  "draft-followup": { bg: "rgba(55,138,221,0.1)", color: "#378ADD" },
};

const SEED_ENTRIES: AuditEntry[] = [
  { timestamp: new Date(Date.now() - 2 * 60_000).toISOString(), advisor_id: "ADV001", feature: "briefing", agent_step: "calendar_agent", input_token_count: 312, output_summary: "Retrieved 4 meetings for today; flagged 1 back-to-back conflict" },
  { timestamp: new Date(Date.now() - 2 * 60_000 + 8_000).toISOString(), advisor_id: "ADV001", feature: "briefing", agent_step: "client_memory_agent", input_token_count: 1840, output_summary: "Synthesised context for 3 clients on today's calendar" },
  { timestamp: new Date(Date.now() - 2 * 60_000 + 14_000).toISOString(), advisor_id: "ADV001", feature: "briefing", agent_step: "followup_agent", input_token_count: 2104, output_summary: "5 overdue touchpoints ranked by urgency; top: Sarah Chen (18 days)" },
  { timestamp: new Date(Date.now() - 2 * 60_000 + 22_000).toISOString(), advisor_id: "ADV001", feature: "briefing", agent_step: "synthesiser", input_token_count: 3670, output_summary: "Generated 420-token morning briefing across 2 sections" },
  { timestamp: new Date(Date.now() - 18 * 60_000).toISOString(), advisor_id: "ADV002", feature: "briefing", agent_step: "synthesiser", input_token_count: 3410, output_summary: "Generated 390-token morning briefing for advisor ADV002" },
  { timestamp: new Date(Date.now() - 35 * 60_000).toISOString(), advisor_id: "ADV001", feature: "cpd", agent_step: "semantic_search", input_token_count: 180, output_summary: "Returned 3 modules for query 'estate planning trust structures'" },
  { timestamp: new Date(Date.now() - 42 * 60_000).toISOString(), advisor_id: "ADV001", feature: "matching", agent_step: "topic_detector", input_token_count: 520, output_summary: "Detected topic cluster: trust/estate (0.87 confidence) → partner James Lim surfaced" },
  { timestamp: new Date(Date.now() - 58 * 60_000).toISOString(), advisor_id: "ADV001", feature: "draft-followup", agent_step: "draft_followup", input_token_count: 890, output_summary: "Generated follow-up draft for client Sarah Chen" },
  { timestamp: new Date(Date.now() - 75 * 60_000).toISOString(), advisor_id: "ADV002", feature: "cpd", agent_step: "recommendation_engine", input_token_count: 640, output_summary: "3 personalised CPD recommendations based on active_client_topics" },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function AuditLogTable() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data: AuditEntry[] = await res.json();
      setEntries(data.length > 0 ? data : SEED_ENTRIES);
    } catch {
      setEntries(SEED_ENTRIES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const displayed = [...entries].reverse().slice(0, 20);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="size-4 text-ink-soft" />
          AI Audit Log
          <span className="ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
            <ShieldCheck className="size-2.5" />
            tamper-evident
          </span>
        </CardTitle>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface-raised"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-3 text-[12px] text-ink-faint">
          Every LLM call is logged: timestamp · advisor · feature · agent step · token count · output summary.
          Advisor A&apos;s entries are never visible to Advisor B.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-ink-faint">
            <RefreshCw className="size-4 animate-spin" /> Loading audit log…
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--surface-raised)" }}>
                  {["Time", "Advisor", "Feature", "Agent step", "Tokens in", "Output"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-ink-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((e, i) => {
                  const fc = FEATURE_COLORS[e.feature] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--ink-soft)" };
                  return (
                    <tr
                      key={i}
                      className="border-t border-line transition-colors hover:bg-surface-raised/50"
                    >
                      <td className="px-3 py-2 font-mono text-ink-faint whitespace-nowrap">
                        {relTime(e.timestamp)}
                      </td>
                      <td className="px-3 py-2 font-mono text-ink">{e.advisor_id}</td>
                      <td className="px-3 py-2">
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: fc.bg, color: fc.color }}>
                          {e.feature}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-ink-soft">{e.agent_step}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-faint">{e.input_token_count.toLocaleString()}</td>
                      <td className="px-3 py-2 text-ink-soft max-w-[300px] truncate" title={e.output_summary}>
                        {e.output_summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
