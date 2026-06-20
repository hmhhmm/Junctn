import { NextResponse } from "next/server";
import { patchTokens } from "@/lib/server/tokens";

interface TgUpdate {
  update_id: number;
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

// Clears Telegram's pending update queue and saves the chat ID of whoever
// messaged the bot most recently (used for local-dev polling instead of webhook).
export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 503 });

  // Remove any previously registered webhook so getUpdates works
  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10&timeout=0`);
  const data = await res.json() as { ok: boolean; result: TgUpdate[] };

  if (!data.ok || !data.result?.length) {
    return NextResponse.json({ found: false });
  }

  // Find the most recent message (last in array)
  const updates = [...data.result].reverse();
  const latest = updates.find((u) => u.message?.chat?.id);
  if (!latest?.message) return NextResponse.json({ found: false });

  const { id, username, first_name } = latest.message.chat;
  const chatId = String(id);
  const handle = username ?? first_name ?? "user";

  patchTokens({ telegram: { chat_id: chatId, username: handle } });

  // Acknowledge all updates so they don't replay
  const lastId = data.result[data.result.length - 1].update_id;
  await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastId + 1}&limit=1&timeout=0`);

  // Send a welcome message
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `✅ <b>Junctn connected!</b>\n\nHi ${handle} 👋 Send /help to see what I can do.`,
      parse_mode: "HTML",
    }),
  });

  return NextResponse.json({ found: true, username: handle });
}
