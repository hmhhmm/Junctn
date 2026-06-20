import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { patchTokens, readTokens } from "@/lib/server/tokens";
import { getAuthedClient } from "@/lib/server/google-client";
import { getClientsByAdvisor } from "@/lib/data";

interface TelegramUpdate {
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

async function sendMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
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
      `/schedule — Today's Google Calendar events\n` +
      `/inbox — Unread Gmail threads\n` +
      `/clients — Clients needing attention\n` +
      `/help — Show this message\n\n` +
      `You can also receive proactive alerts when urgent client actions are flagged.`,
  );
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json() as TelegramUpdate;
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const username = message.chat.username ?? message.chat.first_name;
    const text = (message.text ?? "").trim();

    if (text.startsWith("/start")) {
      patchTokens({ telegram: { chat_id: chatId, username } });
      await sendMessage(
        chatId,
        `✅ <b>Junctn connected!</b>\n\nHi ${username ?? "there"} 👋\n\nYou'll receive advisor alerts here. Send /help to see what I can do.`,
      );
    } else if (text.startsWith("/schedule")) {
      await handleSchedule(chatId);
    } else if (text.startsWith("/inbox")) {
      await handleInbox(chatId);
    } else if (text.startsWith("/clients")) {
      await handleClients(chatId);
    } else if (text.startsWith("/help")) {
      await handleHelp(chatId);
    } else {
      // Check if this chat is already connected; if not, prompt /start
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
