/**
 * POST /api/telegram/morning-push
 *
 * Sends the daily morning briefing to all connected Telegram chat IDs.
 * Triggered by an external cron (e.g. Vercel Cron, cURL from a scheduler)
 * or manually from the Settings page for demo purposes.
 *
 * PRD requirement: "Every morning, the bot proactively messages the advisor
 * their briefing. Build this even if you cut everything else."
 */
import { NextRequest, NextResponse } from "next/server";
import { readTokens } from "@/lib/server/tokens";
import { advisors, getClientsByAdvisor, getCpdStatus, seedReferrals } from "@/lib/data";

async function tgSend(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function buildMorningMessage(advisorId: string): string {
  const advisor = advisors.find((a) => a.id === advisorId) ?? advisors[0];
  if (!advisor) return "🌅 Good morning from Junctn!";

  const cpd = getCpdStatus(advisor.id);
  const clients = getClientsByAdvisor(advisor.id);
  const reviewDue = clients.filter((c) => c.status === "review_due");
  const openReferrals = seedReferrals.filter(
    (r) => r.advisorId === advisor.id && r.status !== "closed" && r.status !== "declined",
  );

  const lines = [
    `🌅 <b>Good morning, ${advisor.name.split(" ")[0]}</b>`,
    `<i>${new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}</i>`,
    "",
    `<b>Today's snapshot</b>`,
    `👥 ${reviewDue.length} client${reviewDue.length !== 1 ? "s" : ""} need a touchpoint`,
    `🔗 ${openReferrals.length} open referral${openReferrals.length !== 1 ? "s" : ""} in pipeline`,
    `🎓 CPD: ${cpd.earned}/${cpd.required} credits${cpd.earned >= cpd.required ? " ✅" : ` — ${cpd.required - cpd.earned} to go`}`,
    "",
    `Send /briefing for full priorities · /followups to action clients · /cpd for compliance detail`,
  ];

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  // Simple secret check so this endpoint isn't public
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tokens = readTokens();
  if (!tokens.telegram?.chat_id) {
    return NextResponse.json({ skipped: true, reason: "no telegram connection" });
  }

  const chatId = tokens.telegram.chat_id;
  // Default to first advisor for demo; in production this would be keyed per chat_id
  const message = buildMorningMessage(advisors[0]?.id ?? "");
  await tgSend(chatId, message);

  return NextResponse.json({ ok: true, sent_to: chatId });
}
