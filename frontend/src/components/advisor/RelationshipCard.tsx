"use client";

import { useState } from "react";
import {
  Heart, Gift, Calendar, MessageCircle, Users, Sparkles, X, Mail, RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { draftOutreach } from "@/lib/api";
import type { Client } from "@/lib/types";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  target.setFullYear(now.getFullYear());
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

interface TouchDialogProps {
  client: Client;
  onClose: () => void;
}

function PersonalTouchDialog({ client, onClose }: TouchDialogProps) {
  const { accessToken } = useStore();
  const profile = client.profile;
  const upcomingDate = profile?.importantDates?.find((d) => daysUntil(d.date) <= 30);
  const firstName = client.name.split(" ")[0];

  const staticSuggestions = [
    upcomingDate
      ? `Hi ${firstName}, just wanted to wish you a wonderful ${upcomingDate.label} coming up on ${upcomingDate.date}. Hope you and the family are doing well!`
      : null,
    profile?.interests?.includes("golf")
      ? `Hi ${firstName}, I came across a great article on golf course rankings in Singapore — thought of you. Let me know if you'd like me to share it!`
      : null,
    `Hi ${firstName}, hope your week is going well. Just checking in — it&apos;s been a while since we last caught up. Anything on your mind I can help with?`,
  ].filter(Boolean) as string[];

  const [selected, setSelected] = useState(staticSuggestions[0] ?? "");
  const [aiDraft, setAiDraft]   = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function generateAiDraft() {
    if (!accessToken) return;
    setAiLoading(true);
    try {
      const res = await draftOutreach(accessToken, {
        client: {
          client_name: client.name,
          interests: profile?.interests ?? [],
          family: profile?.family ?? [],
          important_dates: profile?.importantDates ?? [],
          communication_style: profile?.communicationStyle ?? "",
          gift_ideas: profile?.giftIdeas ?? [],
          last_personal_touch: profile?.lastPersonalTouch ?? null,
          recent_notes: client.notes.slice(-2).map((n) => n.summary),
        },
        outreach_type: upcomingDate ? "upcoming_date" : "check_in",
      });
      setAiDraft(res.draft);
      setSelected(res.draft);
    } catch {
      // fall back silently
    } finally {
      setAiLoading(false);
    }
  }

  function openMail() {
    const mailto = `mailto:?subject=${encodeURIComponent(`Keeping in touch — ${client.name}`)}&body=${encodeURIComponent(selected)}`;
    window.open(mailto, "_blank");
    onClose();
  }

  const allSuggestions = aiDraft
    ? [aiDraft, ...staticSuggestions]
    : staticSuggestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-ink-faint hover:text-ink">
          <X className="size-4" />
        </button>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Personal touch</p>
        <h3 className="mb-1 font-display text-[16px] font-bold text-ink">{client.name}</h3>
        {profile?.communicationStyle && (
          <p className="mb-3 text-[12px] text-ink-faint">Style: {profile.communicationStyle}</p>
        )}

        {accessToken && !aiDraft && (
          <button
            onClick={generateAiDraft}
            disabled={aiLoading}
            className="mb-3 flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-1.5 text-[11px] font-medium text-accent-ink transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            {aiLoading ? <RefreshCw className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            {aiLoading ? "Generating personalised message…" : "Generate AI message"}
          </button>
        )}

        <p className="mb-2 text-[12px] font-medium text-ink">Choose a message to send:</p>
        <div className="flex flex-col gap-2">
          {allSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelected(s)}
              className="rounded-lg border p-3 text-left text-[12px] leading-relaxed transition-colors"
              style={selected === s
                ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--ink)" }
                : { borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink-soft)" }}
            >
              {i === 0 && aiDraft && (
                <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent-ink">
                  <Sparkles className="size-2.5" /> AI personalised
                </span>
              )}
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={openMail}>
            <Mail className="size-3.5" /> Open in Mail
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  client: Client;
}

export function RelationshipCard({ client }: Props) {
  const profile = client.profile;
  const [showTouchDialog, setShowTouchDialog] = useState(false);

  if (!profile) return null;

  const upcomingDates = profile.importantDates
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => d.days <= 60)
    .sort((a, b) => a.days - b.days);

  return (
    <>
      {showTouchDialog && (
        <PersonalTouchDialog client={client} onClose={() => setShowTouchDialog(false)} />
      )}

      <Card className="border-accent/20">
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-1.5">
            <Heart className="size-4 text-rose-400" />
            Relationship intelligence
          </CardTitle>
          {profile.sourceNote && (
            <p className="text-[10px] text-ink-faint">{profile.sourceNote}</p>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0">
          {/* Interests */}
          {profile.interests.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <Sparkles className="size-3 text-accent-ink" /> Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: "rgba(45,212,191,0.1)", color: "#2dd4bf" }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Family */}
          {profile.family.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <Users className="size-3" /> Family
              </p>
              <ul className="flex flex-col gap-0.5">
                {profile.family.map((member, i) => (
                  <li key={i} className="text-[12px] text-ink-soft">{member}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Upcoming dates */}
          {upcomingDates.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <Calendar className="size-3" /> Upcoming dates
              </p>
              <ul className="flex flex-col gap-1">
                {upcomingDates.map((d) => (
                  <li key={d.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-soft">{d.label}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={d.days <= 14
                        ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                        : { background: "var(--surface-raised)", color: "var(--ink-faint)" }}
                    >
                      {d.days === 0 ? "Today" : `in ${d.days}d`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Communication style */}
          {profile.communicationStyle && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <MessageCircle className="size-3" /> Communication style
              </p>
              <p className="text-[12px] text-ink-soft">{profile.communicationStyle}</p>
            </div>
          )}

          {/* Gift ideas */}
          {profile.giftIdeas.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <Gift className="size-3" /> Gift ideas
              </p>
              <ul className="flex flex-col gap-0.5">
                {profile.giftIdeas.map((idea, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    <span className="size-1 shrink-0 rounded-full bg-ink-faint" />
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action */}
          <div className="border-t border-line pt-3">
            <Button
              variant="soft"
              size="sm"
              className="w-full"
              onClick={() => setShowTouchDialog(true)}
            >
              <Mail className="size-3.5" />
              Draft personal touch
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
