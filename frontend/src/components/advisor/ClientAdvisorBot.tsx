"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle, X, Send, Sparkles, Gift, MapPin, HandshakeIcon,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";

const CSS = `
@keyframes bot-slide-up {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
.bot-panel { animation: bot-slide-up 0.22s cubic-bezier(.22,.68,0,1.2) forwards; }
`;

type Message = {
  role: "user" | "assistant";
  text: string;
};

type QuickAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
};

function buildQuickActions(client: Client): QuickAction[] {
  const name = client.name.split(" ")[0];
  const interests = client.profile?.interests?.join(", ") ?? "various interests";
  const commStyle = client.profile?.communicationStyle ?? "professional";
  const needsList = client.needs.join(", ");

  return [
    {
      id: "approach",
      label: "How to approach",
      icon: HandshakeIcon,
      prompt: `How should I approach ${name} for a review conversation? Their communication style is "${commStyle}" and they have needs around ${needsList}. Give me 3 specific conversation openers.`,
    },
    {
      id: "gift",
      label: "Gift suggestions",
      icon: Gift,
      prompt: `Suggest 3 thoughtful, personalised gift ideas for ${name}, who is interested in ${interests}. Keep them professional and under S$150 each.`,
    },
    {
      id: "activities",
      label: "Activity ideas",
      icon: MapPin,
      prompt: `Suggest 3 client entertainment activity ideas in Singapore for ${name} who enjoys ${interests}. Include specific venue or location names, and why each suits this client.`,
    },
  ];
}

function buildSystemContext(client: Client): string {
  const p = client.profile;
  return `You are an AI advisor assistant helping a licensed financial adviser manage client relationships.
Client profile:
- Name: ${client.name}
- Status: ${client.status}
- AUM: S$${(client.aum / 1_000_000).toFixed(2)}M
- Needs: ${client.needs.join(", ")}
- Tags: ${client.tags.join(", ")}
- Interests: ${p?.interests?.join(", ") ?? "not specified"}
- Family: ${p?.family?.join("; ") ?? "not specified"}
- Communication style: ${p?.communicationStyle ?? "not specified"}
- Gift ideas on file: ${p?.giftIdeas?.join(", ") ?? "none"}

Answer concisely (3–5 sentences). Be specific and actionable. Do not invent portfolio data.`;
}

async function callGemini(
  token: string,
  systemContext: string,
  userMessage: string,
): Promise<string> {
  const res = await fetch("/api/advisor-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ system_context: systemContext, message: userMessage }),
  });
  if (!res.ok) throw new Error("API unavailable");
  const data = await res.json();
  return data.reply ?? "I was unable to generate a response. Please try again.";
}

// Offline fallback using static heuristics
function staticReply(client: Client, prompt: string): string {
  const name = client.name.split(" ")[0];
  const p = client.profile;

  if (prompt.includes("approach") || prompt.includes("conversation")) {
    const style = p?.communicationStyle ?? "professional";
    return `For ${name}, lead with a brief personal check-in before business — their style is "${style}". Try: "How has everything been since we last spoke?" Then transition naturally: "I wanted to share a few updates that could be timely for you." End with a clear next step, like scheduling a 30-min review call.`;
  }
  if (prompt.includes("gift")) {
    const ideas = p?.giftIdeas?.slice(0, 3) ?? ["Premium restaurant voucher", "Curated book set", "Wellness hamper"];
    return `Based on ${name}'s profile, consider: ${ideas.map((g, i) => `(${i + 1}) ${g}`).join("; ")}. Keep it professional — personalised but not overly lavish. A handwritten note alongside any gift goes a long way.`;
  }
  if (prompt.includes("activit")) {
    const interests = p?.interests ?? ["fine dining"];
    return `For ${name} who enjoys ${interests.slice(0, 2).join(" and ")}, consider: (1) A private dining experience at a Michelin-starred restaurant like Odette or Jaan — ideal for relationship deepening; (2) A round of golf at Sentosa Golf Club if they play; (3) A curated art gallery visit at the National Gallery with a guided tour, followed by cocktails nearby.`;
  }
  return `I can help you better serve ${name}. Ask me about how to approach them, gift ideas, or activity suggestions in Singapore.`;
}

interface Props {
  client: Client;
}

export function ClientAdvisorBot({ client }: Props) {
  const { accessToken } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const quickActions = buildQuickActions(client);
  const systemContext = buildSystemContext(client);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let reply: string;
      if (accessToken) {
        try {
          reply = await callGemini(accessToken, systemContext, text);
        } catch {
          reply = staticReply(client, text.toLowerCase());
        }
      } else {
        reply = staticReply(client, text.toLowerCase());
      }
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex size-13 items-center justify-center rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #0f766e, #0a2218)", width: 52, height: 52 }}
        title="AI Client Assistant"
      >
        {open
          ? <X className="size-5 text-white" />
          : <MessageCircle className="size-5 text-white" />
        }
      </button>

      {/* Panel */}
      {open && (
        <div
          className="bot-panel fixed bottom-[72px] right-6 z-40 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-line shadow-2xl"
          style={{ height: 520, background: "var(--surface)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: "linear-gradient(135deg, #0d1b2a, #0f2233)" }}
          >
            <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: "rgba(45,212,191,0.15)" }}>
              <Sparkles className="size-4 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-white">Advisor AI</p>
              <p className="text-[10px] text-white/50">{client.name} · relationship assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80">
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isEmpty && (
              <div>
                <p className="mb-3 text-[12px] text-ink-faint">
                  I know {client.name.split(" ")[0]}&apos;s profile. Ask me anything or pick a quick action:
                </p>
                <div className="flex flex-col gap-2">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.id}
                      onClick={() => send(qa.prompt)}
                      className="flex items-center gap-2.5 rounded-xl border border-line p-3 text-left transition-colors hover:bg-surface-raised"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(45,212,191,0.1)" }}>
                        <qa.icon className="size-3.5 text-teal-400" />
                      </span>
                      <span className="flex-1 text-[12px] font-medium text-ink">{qa.label}</span>
                      <ChevronRight className="size-3.5 text-ink-faint" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(45,212,191,0.12)" }}>
                    <Sparkles className="size-3 text-teal-400" />
                  </div>
                )}
                <div
                  className="max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed"
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
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full" style={{ background: "rgba(45,212,191,0.12)" }}>
                  <Sparkles className="size-3 text-teal-400" />
                </div>
                <div className="flex gap-1 rounded-2xl px-3 py-2.5" style={{ background: "var(--surface-raised)" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-ink-faint"
                      style={{ animation: `pulse 1.2s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick action chips (after first message) */}
          {!isEmpty && (
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">
              {quickActions.map((qa) => (
                <button
                  key={qa.id}
                  onClick={() => send(qa.prompt)}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-medium text-ink-faint transition-colors hover:bg-surface-raised"
                >
                  <qa.icon className="size-3" />
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
            <input
              type="text"
              placeholder="Ask about this client…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              className="flex-1 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-[12px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
              style={{ background: "#0f766e" }}
            >
              {loading ? <RefreshCw className="size-3.5 animate-spin text-white" /> : <Send className="size-3.5 text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
