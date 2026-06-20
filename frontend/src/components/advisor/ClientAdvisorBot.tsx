"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Gift, MapPin, Handshake, RefreshCw, ChevronRight, X, Bot } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string };
type QA = { id: string; label: string; icon: React.ElementType; prompt: string };

function buildQuickActions(client: Client): QA[] {
  const name  = client.name.split(" ")[0];
  const needs = client.needs.join(", ");
  const style = client.profile?.communicationStyle ?? "professional";
  const likes = client.profile?.interests?.join(", ") ?? "various interests";
  return [
    {
      id: "approach", label: "How to approach", icon: Handshake,
      prompt: `How should I approach ${name} for a review conversation? Style: "${style}", needs: ${needs}. Give 3 specific conversation openers.`,
    },
    {
      id: "gift", label: "Gift ideas", icon: Gift,
      prompt: `Suggest 3 personalised gift ideas for ${name} who enjoys ${likes}. Keep professional, under RM150 each.`,
    },
    {
      id: "activities", label: "Activity ideas", icon: MapPin,
      prompt: `Suggest 3 client entertainment activities in Singapore for ${name} who enjoys ${likes}. Include specific venue names.`,
    },
  ];
}

function buildSystemContext(client: Client): string {
  const p = client.profile;
  return `You are an AI assistant for a licensed financial adviser. Be concise (3-5 sentences), specific, and actionable.
Client: ${client.name} | Status: ${client.status} | AUM: RM${(client.aum / 1_000_000).toFixed(2)}M
Needs: ${client.needs.join(", ")} | Interests: ${p?.interests?.join(", ") || "not specified"}
Family: ${p?.family?.join("; ") || "not specified"} | Communication: ${p?.communicationStyle || "professional"}`;
}

function staticReply(client: Client, text: string): string {
  const name  = client.name.split(" ")[0];
  const p     = client.profile;
  const lower = text.toLowerCase();
  if (lower.includes("approach") || lower.includes("conversation") || lower.includes("opener")) {
    return `For ${name}, open with a genuine personal check-in — "${p?.communicationStyle === "WhatsApp-friendly, informal" ? "Hey" : "Hi"} ${name}, hope all is well with the family!" Before moving to business, reference something personal from your last interaction. Then present 1–2 key updates that directly affect their situation, and end with a clear call-to-action: "Can we carve out 30 minutes this week for a quick review?"`;
  }
  if (lower.includes("gift")) {
    const ideas = p?.giftIdeas?.length ? p.giftIdeas.slice(0, 3) : ["A premium restaurant voucher (e.g. Odette)", "Curated lifestyle book set", "Wellness or spa hamper"];
    return `Based on ${name}'s interests, consider: (1) ${ideas[0]}, (2) ${ideas[1] || "A personalised journal"}, (3) ${ideas[2] || "Golf accessories"}. A handwritten card alongside any gift significantly elevates the gesture.`;
  }
  if (lower.includes("activit") || lower.includes("venue") || lower.includes("entertain")) {
    const likes = p?.interests ?? [];
    const golf = likes.some(l => l.toLowerCase().includes("golf"));
    const food = likes.some(l => ["dining", "food", "wine", "cooking"].some(k => l.toLowerCase().includes(k)));
    return `For ${name}: (1) ${golf ? "Private round at Sentosa Golf Club — great for relationship building" : "Private dining at Odette or Jaan"}. (2) ${food ? "Sake or wine pairing class at Club Street" : "Guided tour of National Gallery + cocktails at 1-Altitude"}. (3) A helicopter city tour for milestone occasions.`;
  }
  if (lower.includes("upcoming") || lower.includes("date") || lower.includes("birthday") || lower.includes("anniversary")) {
    const dates = p?.importantDates ?? [];
    if (dates.length > 0) return `${name} has upcoming dates: ${dates.slice(0, 3).map(d => `${d.label} (${d.date})`).join(", ")}. A personalised message 3 days before works best.`;
    return `No upcoming dates on file for ${name}. Ask about birthdays, anniversaries, and children's milestones during your next call — these are powerful relationship touchpoints.`;
  }
  return `I can help you connect better with ${name}. Ask me about how to approach them, gift ideas, activity suggestions in Singapore, or upcoming dates to remember.`;
}

async function callBackend(token: string, ctx: string, msg: string): Promise<string> {
  const res = await fetch("/api/advisor-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system_context: ctx, message: msg }),
  });
  if (!res.ok) throw new Error("unavailable");
  return (await res.json()).reply ?? "";
}

interface Props { client: Client; open: boolean; onToggle: () => void }

export function ClientAdvisorBot({ client, open, onToggle }: Props) {
  const { accessToken } = useStore();
  const [msgs, setMsgs]   = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qas = buildQuickActions(client);
  const ctx = buildSystemContext(client);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMsgs(p => [...p, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      let reply = "";
      if (accessToken) {
        try { reply = await callBackend(accessToken, ctx, text); }
        catch { reply = staticReply(client, text); }
      } else {
        reply = staticReply(client, text);
      }
      setMsgs(p => [...p, { role: "assistant", text: reply }]);
    } finally { setLoading(false); }
  }

  const empty = msgs.length === 0;

  return (
    <>
      {/* ── Full-height sidebar ────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: 340,
          zIndex: 40,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--line)",
          boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.18)" : "none",
          background: "var(--surface)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-3 px-4 py-3.5 border-b border-line"
          style={{ background: "linear-gradient(135deg,#0d1b2a,#0f2233)" }}
        >
          <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
            <Bot className="size-4 text-white/60" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">Advisor AI</p>
            <p className="text-[10px] text-white/40">{client.name} · relationship intelligence</p>
          </div>
          <button onClick={onToggle} className="text-white/30 hover:text-white/70 transition-colors p-1">
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {empty && (
            <div>
              <p className="mb-3 text-[11px] text-ink-faint leading-relaxed">
                Ask anything about {client.name.split(" ")[0]}, or pick a quick action:
              </p>
              <div className="flex flex-col gap-2">
                {qas.map(qa => (
                  <button
                    key={qa.id}
                    onClick={() => send(qa.prompt)}
                    className="flex items-center gap-2.5 rounded-xl border border-line p-3 text-left transition-colors hover:bg-surface-raised"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--surface-raised)" }}>
                      <qa.icon className="size-3.5 text-ink-soft" />
                    </span>
                    <span className="flex-1 text-[12px] font-medium text-ink">{qa.label}</span>
                    <ChevronRight className="size-3.5 text-ink-faint" />
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 flex items-center gap-2">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[10px] text-ink-faint">or type a question</span>
                <div className="flex-1 h-px bg-line" />
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="mr-2 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--surface-raised)" }}>
                  <Bot className="size-2.5 text-ink-faint" />
                </div>
              )}
              <div
                className="max-w-[86%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed"
                style={m.role === "user"
                  ? { background: "#0f766e", color: "#fff", borderBottomRightRadius: 4 }
                  : { background: "var(--surface-raised)", color: "var(--ink)", borderBottomLeftRadius: 4 }
                }
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-full" style={{ background: "var(--surface-raised)" }}>
                <Bot className="size-2.5 text-ink-faint" />
              </div>
              <div className="flex gap-1 rounded-2xl px-3 py-2" style={{ background: "var(--surface-raised)" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="size-1.5 rounded-full bg-ink-faint animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chip bar after first message */}
        {!empty && (
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 shrink-0 border-t border-line pt-2">
            {qas.map(qa => (
              <button
                key={qa.id}
                onClick={() => send(qa.prompt)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-medium text-ink-faint transition-colors hover:bg-surface-raised"
              >
                <qa.icon className="size-2.5" />{qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line px-3 py-3">
          <input
            type="text"
            placeholder="Ask about this client…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            className="flex-1 rounded-xl border border-line bg-surface-raised px-3 py-2 text-[12px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-30 transition-all"
            style={{ background: "#0f766e" }}
          >
            {loading
              ? <RefreshCw className="size-3.5 animate-spin text-white" />
              : <Send className="size-3.5 text-white" />
            }
          </button>
        </div>
      </div>

      {/* ── Floating toggle button ─────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="fixed z-50 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg"
        style={{
          bottom: 28,
          right: open ? 356 : 24,
          background: open ? "var(--surface-raised)" : "linear-gradient(135deg,#0f766e,#0d9488)",
          border: "1px solid",
          borderColor: open ? "var(--line)" : "transparent",
          color: open ? "var(--ink-faint)" : "#fff",
          transition: "right 300ms cubic-bezier(0.16,1,0.3,1), background 200ms, color 200ms",
        }}
      >
        {open
          ? <X className="size-4" />
          : <Bot className="size-4" />
        }
        <span className="text-[12px] font-semibold">{open ? "Close" : "AI Assistant"}</span>
      </button>

      {/* ── Backdrop on mobile ────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={onToggle}
        />
      )}
    </>
  );
}
