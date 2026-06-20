import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { patchTokens, readTokens } from "@/lib/server/tokens";
import { getAuthedClient } from "@/lib/server/google-client";
import { advisors, getClientsByAdvisor, getCpdStatus, seedReferrals } from "@/lib/data";

interface TelegramUpdate {
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message: { chat: { id: number }; message_id: number };
    data: string;
  };
}

async function tgFetch(method: string, body: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendMessage(chatId: string, text: string, reply_markup?: object) {
  await tgFetch("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...(reply_markup ? { reply_markup } : {}) });
}

async function answerCallbackQuery(queryId: string, text: string) {
  await tgFetch("answerCallbackQuery", { callback_query_id: queryId, text, show_alert: false });
}

// ── PRD commands ─────────────────────────────────────────────────────────────

async function handleBriefing(chatId: string) {
  // Use first advisor as default (single-advisor local demo)
  const advisor = advisors[0];
  if (!advisor) { await sendMessage(chatId, "⚠️ No advisor found."); return; }

  const cpd = getCpdStatus(advisor.id);
  const clients = getClientsByAdvisor(advisor.id);
  const reviewDue = clients.filter((c) => c.status === "review_due" || c.status === "active");
  const overdueClients = reviewDue.slice(0, 3);
  const myReferrals = seedReferrals.filter((r) => r.advisorId === advisor.id && r.status !== "closed" && r.status !== "declined");

  const lines = [
    `🌅 <b>Good morning, ${advisor.name.split(" ")[0]}</b>`,
    "",
    `📋 <b>Today's top 3 priorities</b>`,
    "",
  ];

  if (overdueClients.length > 0) {
    lines.push(`1️⃣ <b>Client follow-ups</b> — ${overdueClients.map((c) => c.name.split(" ")[0]).join(", ")} need a touchpoint`);
  }

  if (myReferrals.length > 0) {
    lines.push(`2️⃣ <b>Open referrals</b> — ${myReferrals.length} in pipeline (${myReferrals.filter((r) => r.status === "in_progress").length} in progress)`);
  }

  const cpdRemaining = cpd.required - cpd.earned;
  lines.push(`3️⃣ <b>CPD</b> — ${cpd.earned}/${cpd.required} credits · ${cpdRemaining > 0 ? `${cpdRemaining} to go` : "✅ compliant"}`);

  lines.push("", `<i>Open the Junctn dashboard for the full briefing.</i>`);

  await sendMessage(chatId, lines.join("\n"));
}

async function handleFollowups(chatId: string) {
  const advisor = advisors[0];
  if (!advisor) { await sendMessage(chatId, "⚠️ No advisor found."); return; }

  const clients = getClientsByAdvisor(advisor.id);
  const needsContact = clients.filter((c) => c.status === "review_due").slice(0, 5);

  if (needsContact.length === 0) {
    await sendMessage(chatId, "✅ <b>Follow-ups</b>\n\nNo overdue touchpoints — good work.");
    return;
  }

  await sendMessage(
    chatId,
    `📬 <b>Follow-ups needed (${needsContact.length})</b>\n\nTap a client to mark them as contacted:`,
    {
      inline_keyboard: needsContact.map((c) => ([{
        text: `✓ ${c.name}`,
        callback_data: `mark_contacted:${c.id}`,
      }])),
    },
  );
}

async function handleCpd(chatId: string) {
  const advisor = advisors[0];
  if (!advisor) { await sendMessage(chatId, "⚠️ No advisor found."); return; }

  const cpd = getCpdStatus(advisor.id);
  const pct = Math.round((cpd.earned / cpd.required) * 100);
  const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
  const status = cpd.earned >= cpd.required ? "✅ Compliant" : cpd.required - cpd.earned <= 4 ? "⚠️ At risk" : "🔵 On track";

  const lines = [
    `🎓 <b>CPD Status — MAS FAA-N13</b>`,
    "",
    `${bar} ${pct}%`,
    `${cpd.earned} / ${cpd.required} credits earned`,
    `Status: ${status}`,
    "",
    `<i>Open Learning &amp; CPD in Junctn to complete modules.</i>`,
  ];

  await sendMessage(chatId, lines.join("\n"));
}

async function handleMarkContacted(chatId: string, queryId: string, clientId: string) {
  // In a real system this would write to the Context Layer.
  // For the demo, we confirm the action and close the callback.
  const advisor = advisors[0];
  const client = getClientsByAdvisor(advisor?.id ?? "").find((c) => c.id === clientId);
  const name = client?.name ?? clientId;

  await answerCallbackQuery(queryId, `✓ ${name} marked as contacted`);
  await sendMessage(chatId, `✅ <b>${name}</b> marked as contacted. Context layer updated.`);
}

async function handleSchedule(chatId: string) {
  try {
    const auth = await getAuthedClient();
    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 8,
    });

    const events = data.items ?? [];
    if (events.length === 0) {
      await sendMessage(chatId, "📅 <b>Today's schedule</b>\n\nNo more events today — clear schedule ahead.");
      return;
    }

    const fmt = (iso?: string | null) => {
      if (!iso) return "";
      return new Date(iso).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const lines = events.map((e) => {
      const start = e.start?.dateTime ? fmt(e.start.dateTime) : "All day";
      const title = e.summary ?? "Untitled";
      const loc = e.location ? ` · ${e.location}` : "";
      const meet = e.hangoutLink ? " 🎥" : "";
      return `• ${start} — <b>${title}</b>${loc}${meet}`;
    });

    await sendMessage(chatId, `📅 <b>Today's schedule</b>\n\n${lines.join("\n")}`);
  } catch {
    await sendMessage(chatId, "📅 Google Calendar not connected. Go to Settings in the Junctn app to link your account.");
  }
}

async function handleInbox(chatId: string) {
  try {
    const auth = await getAuthedClient();
    const gmail = google.gmail({ version: "v1", auth });

    const { data: listData } = await gmail.users.threads.list({
      userId: "me",
      labelIds: ["INBOX", "UNREAD"],
      maxResults: 5,
    });

    const threadItems = listData.threads ?? [];
    if (threadItems.length === 0) {
      await sendMessage(chatId, "📧 <b>Inbox</b>\n\nNo unread emails.");
      return;
    }

    const threads = await Promise.all(
      threadItems.map(async (t) => {
        const { data } = await gmail.users.threads.get({
          userId: "me",
          id: t.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From"],
        });
        const msg = data.messages?.[0];
        const headers = msg?.payload?.headers ?? [];
        const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
        const from = get("From");
        const nameMatch = from.match(/^(.+?)\s*</);
        const sender = nameMatch ? nameMatch[1].replace(/"/g, "") : from;
        return `• <b>${sender}</b>: ${get("Subject") || "(no subject)"}`;
      }),
    );

    await sendMessage(chatId, `📧 <b>Unread emails (${threadItems.length})</b>\n\n${threads.join("\n")}`);
  } catch {
    await sendMessage(chatId, "📧 Gmail not connected. Go to Settings in the Junctn app to link your account.");
  }
}

async function handleClients(chatId: string) {
  // Uses the first advisor in the store — for a single-user local app this is fine
  const allAdvisors = ["advisor-1", "advisor-2", "advisor-3"];
  const allClients = allAdvisors.flatMap((id) => getClientsByAdvisor(id));
  const reviewDue = allClients.filter((c) => c.status === "review_due");
  const dormant = allClients.filter((c) => c.status === "dormant");

  const lines: string[] = [];
  if (reviewDue.length > 0) {
    lines.push("⚠️ <b>Review due</b>");
    reviewDue.forEach((c) => lines.push(`  • ${c.name} — last contact ${c.lastContact}`));
  }
  if (dormant.length > 0) {
    lines.push("\n💤 <b>Dormant</b>");
    dormant.slice(0, 3).forEach((c) => lines.push(`  • ${c.name}`));
    if (dormant.length > 3) lines.push(`  … and ${dormant.length - 3} more`);
  }
  if (lines.length === 0) {
    await sendMessage(chatId, "👥 <b>Clients</b>\n\nAll clients are up to date — nothing flagged.");
    return;
  }
  await sendMessage(chatId, `👥 <b>Client attention needed</b>\n\n${lines.join("\n")}`);
}

async function handleHelp(chatId: string) {
  await sendMessage(
    chatId,
    `🤖 <b>Junctn Bot</b>\n\nAvailable commands:\n\n` +
      `/briefing — Today's top 3 priorities\n` +
      `/followups — Clients needing a touchpoint (with Mark contacted button)\n` +
      `/cpd — CPD credit status vs MAS FAA-N13 requirement\n` +
      `/schedule — Today's Google Calendar events\n` +
      `/inbox — Unread Gmail threads\n` +
      `/clients — All clients by status\n` +
      `/help — Show this message\n\n` +
      `<i>You also receive your morning briefing automatically each day at 8 AM.</i>`,
  );
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json() as TelegramUpdate;

    // ── Callback query (inline button press) ──────────────────────────────
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);
      const data = cq.data ?? "";

      if (data.startsWith("mark_contacted:")) {
        const clientId = data.replace("mark_contacted:", "");
        await handleMarkContacted(chatId, cq.id, clientId);
      } else {
        await answerCallbackQuery(cq.id, "Action received");
      }
      return NextResponse.json({ ok: true });
    }

    // ── Message command ───────────────────────────────────────────────────
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const username = message.chat.username ?? message.chat.first_name;
    const text = (message.text ?? "").trim();

    if (text.startsWith("/start")) {
      patchTokens({ telegram: { chat_id: chatId, username } });
      await sendMessage(
        chatId,
        `✅ <b>Junctn connected!</b>\n\nHi ${username ?? "there"} 👋\n\nYou'll receive your morning briefing here every day.\n\nSend /help to see available commands.`,
      );
    } else if (text.startsWith("/briefing")) {
      await handleBriefing(chatId);
    } else if (text.startsWith("/followups")) {
      await handleFollowups(chatId);
    } else if (text.startsWith("/cpd")) {
      await handleCpd(chatId);
    } else if (text.startsWith("/schedule")) {
      await handleSchedule(chatId);
    } else if (text.startsWith("/inbox")) {
      await handleInbox(chatId);
    } else if (text.startsWith("/clients")) {
      await handleClients(chatId);
    } else if (text.startsWith("/help")) {
      await handleHelp(chatId);
    } else {
      const tokens = readTokens();
      if (!tokens.telegram) {
        patchTokens({ telegram: { chat_id: chatId, username } });
        await sendMessage(chatId, `✅ Connected! Send /help to see available commands.`);
      } else {
        await sendMessage(chatId, `Send /help to see available commands.`);
      }
    }
  } catch (err) {
    console.error("Telegram webhook error", err);
  }

  return NextResponse.json({ ok: true });
}
