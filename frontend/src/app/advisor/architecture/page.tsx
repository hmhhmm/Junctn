"use client";

import { useState } from "react";
import {
  Brain,
  Calendar,
  GraduationCap,
  Network,
  Send,
  ShieldCheck,
  ScrollText,
  Database,
  Zap,
  ArrowRight,
} from "lucide-react";

/* ── Tech stack data ─────────────────────────────────────────────────────── */
const STACK = [
  { layer: "Frontend", tech: "Next.js · React · TypeScript · Tailwind CSS" },
  { layer: "Backend", tech: "FastAPI (Python) · Asyncio background tasks" },
  { layer: "Agents", tech: "LangGraph · Stateful multi-agent graph" },
  { layer: "LLM", tech: "Gemini 2.5 Flash · Streaming completions" },
  { layer: "Vector store", tech: "ChromaDB · Per-advisor namespaced collections" },
  { layer: "Context cache", tech: "Redis · 1-hour TTL · Stale-read-ok" },
  { layer: "Auth", tech: "JWT · advisor_id-scoped · Every route validated" },
  { layer: "Embeddings", tech: "Gemini text-embedding-004 · Cosine similarity" },
  { layer: "Telegram", tech: "python-telegram-bot · Webhook · Same backend" },
];

/* ── Context Layer fields ────────────────────────────────────────────────── */
const CONTEXT_FIELDS = [
  "active_client_topics[]",
  "today_calendar_events",
  "pending_follow_ups[]",
  "cpd_status { completed, required }",
  "active_referrals[]",
  "last_briefing_at",
  "expense_flags",
];

/* ── Modules ─────────────────────────────────────────────────────────────── */
const MODULES = [
  {
    id: "briefing",
    label: "Morning Briefing",
    sub: "Multi-agent pipeline",
    icon: Brain,
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.08)",
    border: "rgba(45,212,191,0.25)",
    agents: ["Calendar subagent", "Client memory subagent", "Follow-up subagent", "Synthesiser"],
    reads: ["today_calendar_events", "pending_follow_ups[]", "active_client_topics[]"],
    writes: ["today_calendar_events", "pending_follow_ups[]", "last_briefing_at"],
    pos: "top-left",
  },
  {
    id: "cpd",
    label: "CPD Engine",
    sub: "RAG + compliance",
    icon: GraduationCap,
    color: "#7F77DD",
    bg: "rgba(127,119,221,0.08)",
    border: "rgba(127,119,221,0.25)",
    agents: ["Semantic search (ChromaDB)", "Recommendation engine", "Credit tracker"],
    reads: ["active_client_topics[]", "cpd_status"],
    writes: ["cpd_status"],
    pos: "top-right",
  },
  {
    id: "partners",
    label: "Partner Matching",
    sub: "Embedding similarity",
    icon: Network,
    color: "#BA7517",
    bg: "rgba(186,117,23,0.08)",
    border: "rgba(186,117,23,0.25)",
    agents: ["Topic detector", "Partner ranker", "Referral lifecycle"],
    reads: ["active_client_topics[]", "active_referrals[]"],
    writes: ["active_referrals[]"],
    pos: "bottom-left",
  },
  {
    id: "telegram",
    label: "Telegram Bot",
    sub: "Same backend · 4 commands",
    icon: Send,
    color: "#378ADD",
    bg: "rgba(55,138,221,0.08)",
    border: "rgba(55,138,221,0.25)",
    agents: ["/briefing", "/followups + inline button", "/cpd", "Scheduled morning push"],
    reads: ["pending_follow_ups[]", "cpd_status", "last_briefing_at"],
    writes: ["pending_follow_ups[]"],
    pos: "bottom-right",
  },
];

/* ── Connection line (SVG overlay) ──────────────────────────────────────── */
function Connector({ color, animated }: { color: string; animated: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg width="100%" height="100%" className="absolute inset-0" style={{ overflow: "visible" }}>
        <defs>
          <marker id={`arrow-${color.replace("#", "")}`} markerWidth="6" markerHeight="6"
            refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── Module card ─────────────────────────────────────────────────────────── */
function ModuleCard({
  mod,
  active,
  onClick,
}: {
  mod: (typeof MODULES)[0];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = mod.icon;
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200"
      style={{
        background: active ? mod.bg : "rgba(255,255,255,0.02)",
        borderColor: active ? mod.border : "rgba(255,255,255,0.07)",
        boxShadow: active ? `0 0 24px ${mod.color}20` : "none",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: `${mod.color}18` }}
        >
          <Icon className="size-4" style={{ color: mod.color }} />
        </span>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>{mod.label}</p>
          <p className="text-[11px]" style={{ color: "#8b9099" }}>{mod.sub}</p>
        </div>
      </div>

      {active && (
        <div className="mt-1 flex flex-col gap-1">
          {mod.agents.map((a) => (
            <div key={a} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#8b9099" }}>
              <Zap className="size-3 shrink-0" style={{ color: mod.color }} />
              {a}
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: mod.color, opacity: 0.7 }}>Reads</p>
            {mod.reads.map((r) => (
              <span key={r} className="font-mono text-[10px]" style={{ color: "#8b9099" }}>{r}</span>
            ))}
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: mod.color, opacity: 0.7 }}>Writes</p>
            {mod.writes.map((w) => (
              <span key={w} className="font-mono text-[10px]" style={{ color: "#8b9099" }}>{w}</span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ArchitecturePage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const active = MODULES.find((m) => m.id === activeModule) ?? null;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#0b1117", color: "#e2e8f0" }}
    >
      {/* Header */}
      <div className="border-b px-8 py-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
          >
            <Database className="size-4" style={{ color: "#2dd4bf" }} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight" style={{ color: "#e2e8f0" }}>
              Platform Architecture
            </h1>
            <p className="text-[12px]" style={{ color: "#8b9099" }}>
              One shared Advisor Context Layer · Three modules · One Telegram bot · Zero data crossover
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-8">
        {/* Left — diagram */}
        <div className="flex flex-1 flex-col gap-4">

          {/* JWT Auth wrapper */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "rgba(55,138,221,0.2)", background: "rgba(55,138,221,0.04)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-4" style={{ color: "#378ADD" }} />
              <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "#378ADD" }}>
                JWT Auth Boundary — advisor_id validated on every route
              </span>
            </div>

            {/* Module grid */}
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  active={activeModule === mod.id}
                  onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                />
              ))}
            </div>

            {/* Arrows pointing inward */}
            <div className="relative my-4 flex items-center justify-center gap-3">
              {MODULES.map((mod) => (
                <div key={mod.id} className="flex items-center gap-1">
                  <div className="h-px w-8" style={{ background: `${mod.color}60` }} />
                  <ArrowRight className="size-3" style={{ color: `${mod.color}80` }} />
                </div>
              ))}
            </div>

            {/* Advisor Context Layer */}
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "rgba(45,212,191,0.35)",
                background: "rgba(45,212,191,0.06)",
                boxShadow: "0 0 40px rgba(45,212,191,0.08)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Database className="size-4" style={{ color: "#2dd4bf" }} />
                <span className="text-[13px] font-bold" style={{ color: "#2dd4bf" }}>
                  Advisor Context Layer
                </span>
                <span
                  className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
                >
                  Redis · 1h TTL · Postgres-backed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {CONTEXT_FIELDS.map((f) => (
                  <div
                    key={f}
                    className="rounded-md px-2.5 py-1.5 font-mono text-[10px]"
                    style={{ background: "rgba(45,212,191,0.08)", color: "#5eead4", border: "1px solid rgba(45,212,191,0.12)" }}
                  >
                    {f}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px]" style={{ color: "#8b9099" }}>
                All three web modules and the Telegram bot read from and write to this single store.
                Every advisor action — briefing generation, module completion, referral update — refreshes it.
                The platform grows smarter with every interaction.
              </p>
            </div>

          </div>

          {/* Audit log */}
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
          >
            <ScrollText className="size-4 shrink-0" style={{ color: "#8b9099" }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "#e2e8f0" }}>Audit Log</p>
              <p className="text-[11px]" style={{ color: "#8b9099" }}>
                Every LLM call logged: timestamp · advisor_id · feature · agent_step · token count · output summary
              </p>
            </div>
            <a
              href="/org"
              className="ml-auto shrink-0 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5"
              style={{ color: "#378ADD", border: "1px solid rgba(55,138,221,0.25)" }}
            >
              View admin →
            </a>
          </div>
        </div>

        {/* Right — tech stack + callout */}
        <div className="flex w-[280px] shrink-0 flex-col gap-4">
          {/* The pitch */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.04)" }}
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#2dd4bf" }}>
              The platform insight
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#cbd5e1" }}>
              Everything you&apos;ve seen — the briefing, the CPD recommendation, the partner match —
              all read from the <strong style={{ color: "#2dd4bf" }}>same advisor context layer</strong>.
              The Telegram bot reads from that exact same layer too.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#8b9099" }}>
              That&apos;s what makes this a <strong style={{ color: "#e2e8f0" }}>platform</strong>, not four separate features.
            </p>
          </div>

          {/* Selected module detail */}
          {active && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: active.border, background: active.bg }}
            >
              <div className="mb-3 flex items-center gap-2">
                <active.icon className="size-4" style={{ color: active.color }} />
                <p className="text-[13px] font-semibold" style={{ color: active.color }}>{active.label}</p>
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: active.color, opacity: 0.7 }}>Agents / components</p>
              {active.agents.map((a) => (
                <div key={a} className="flex items-center gap-1.5 py-0.5 text-[12px]" style={{ color: "#cbd5e1" }}>
                  <Zap className="size-3 shrink-0" style={{ color: active.color }} />
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* Tech stack */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#8b9099" }}>
              Technology stack
            </p>
            <div className="flex flex-col gap-2">
              {STACK.map(({ layer, tech }) => (
                <div key={layer} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
                    {layer}
                  </span>
                  <span className="text-[11px]" style={{ color: "#8b9099" }}>{tech}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scale callout */}
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(186,117,23,0.25)", background: "rgba(186,117,23,0.06)" }}
          >
            <p className="text-[12px] font-bold" style={{ color: "#BA7517" }}>
              Designed for 800+ advisors
            </p>
            <p className="mt-1 text-[11px]" style={{ color: "#8b9099" }}>
              Per-advisor Redis namespacing · ChromaDB collection isolation · Token-bucket rate limiting per advisor_id
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
