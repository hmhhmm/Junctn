"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Unlink,
  Calendar,
  Mail,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationStatus {
  google: { connected: boolean; email?: string };
  telegram: { connected: boolean; username?: string };
  googleCredsConfigured: boolean;
  telegramCredsConfigured: boolean;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [waitingForMessage, setWaitingForMessage] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  useEffect(() => {
    fetchStatus();
    fetchBotUsername();

    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "google") setFlash("✅ Google account connected successfully!");
    else if (error === "google_denied") setFlash("Google sign-in was cancelled.");
    else if (error === "google_failed") setFlash("Google connection failed. Check your credentials and try again.");
  }, [searchParams]);

  async function fetchBotUsername() {
    try {
      const res = await fetch("/api/telegram/getme");
      if (res.ok) {
        const d = await res.json() as { username?: string };
        if (d.username) setBotUsername(d.username);
      }
    } catch {}
  }

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function disconnect(service: "google" | "telegram") {
    await fetch("/api/auth/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service }),
    });
    fetchStatus();
    setFlash(`${service.charAt(0).toUpperCase() + service.slice(1)} disconnected.`);
  }

  async function pollForChatId() {
    setPolling(true);
    try {
      const res = await fetch("/api/telegram/poll", { method: "POST" });
      const d = await res.json() as { found: boolean; username?: string };
      if (d.found) {
        setFlash(`✅ Telegram connected as @${d.username ?? "you"}!`);
        setWaitingForMessage(false);
        fetchStatus();
      } else {
        setFlash("No message found yet. Send any message to your bot, then click the button again.");
      }
    } catch {
      setFlash("Could not reach Telegram. Check your bot token.");
    } finally {
      setPolling(false);
    }
  }

  async function saveTelegramChatId() {
    if (!telegramChatId.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramChatId.trim() }),
      });
      setFlash("✅ Telegram connected!");
      setTelegramChatId("");
      fetchStatus();
    } finally {
      setSaving(false);
    }
  }

  async function sendTestMessage() {
    const res = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "👋 Test from Junctn — your notifications are working!\n\nTry /schedule, /inbox or /clients." }),
    });
    if (res.ok) setFlash("✅ Test message sent!");
    else setFlash("Failed to send. Check bot token.");
  }

  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
        Integrations
      </h1>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        Connect external services to surface real data in your advisor workspace.
      </p>

      {flash && (
        <div
          className="mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-[13px]"
          style={{
            background: flash.startsWith("✅") ? "var(--ok-soft)" : "var(--warn-soft)",
            borderColor: flash.startsWith("✅") ? "var(--ok)" : "var(--warn)",
            color: flash.startsWith("✅") ? "var(--ok)" : "var(--warn)",
          }}
        >
          {flash.startsWith("✅") ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {flash}
          <button
            onClick={() => setFlash(null)}
            className="ml-auto text-[11px] opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-[13px] text-ink-faint">
          <RefreshCw className="size-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {/* ── Google Calendar + Gmail ─────────────────── */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--surface-raised)" }}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-ink">Google</h2>
                  <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                    <Calendar className="size-3" /> Calendar
                    <Mail className="ml-1 size-3" /> Gmail
                  </span>
                  {status?.google.connected && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: "var(--ok-soft)", color: "var(--ok)" }}
                    >
                      <CheckCircle2 className="size-3" /> Connected
                    </span>
                  )}
                </div>

                {status?.google.connected ? (
                  <div className="mt-3">
                    <p className="text-[13px] text-ink-soft">
                      Signed in as <strong className="text-ink">{status.google.email}</strong>
                    </p>
                    <p className="mt-1 text-[12px] text-ink-faint">
                      Today&apos;s schedule and recent emails now pull from your Google account.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-alert"
                      onClick={() => disconnect("google")}
                    >
                      <Unlink className="size-3.5" />
                      Disconnect
                    </Button>
                  </div>
                ) : !status?.googleCredsConfigured ? (
                  <div className="mt-3 rounded-lg border border-line p-3 text-[13px] text-ink-soft"
                       style={{ background: "var(--surface-raised)" }}>
                    <p className="font-medium text-ink">Setup required</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12px]">
                      <li>
                        Go to{" "}
                        <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
                           className="text-accent underline inline-flex items-center gap-0.5">
                          Google Cloud Console <ExternalLink className="size-3" />
                        </a>
                      </li>
                      <li>Create an OAuth 2.0 Client ID (Web application)</li>
                      <li>
                        Add redirect URI:{" "}
                        <code className="rounded bg-surface-raised px-1 text-[11px]">
                          {baseUrl}/api/auth/google/callback
                        </code>
                      </li>
                      <li>Enable Calendar API and Gmail API in the API Library</li>
                      <li>
                        Add <code className="rounded bg-surface-raised px-1 text-[11px]">GOOGLE_CLIENT_ID</code> and{" "}
                        <code className="rounded bg-surface-raised px-1 text-[11px]">GOOGLE_CLIENT_SECRET</code> to your{" "}
                        <code className="rounded bg-surface-raised px-1 text-[11px]">.env.local</code> file and restart
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-[13px] text-ink-soft">
                      Grant read access to Calendar and Gmail to sync real data.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={() => (window.location.href = "/api/auth/google")}
                    >
                      Connect Google account
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Telegram ───────────────────────────────── */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--surface-raised)" }}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="#26A5E4">
                  <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-ink">Telegram</h2>
                  <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                    <Send className="size-3" /> Notifications
                  </span>
                  {status?.telegram.connected && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: "var(--ok-soft)", color: "var(--ok)" }}
                    >
                      <CheckCircle2 className="size-3" /> Connected
                    </span>
                  )}
                </div>

                {status?.telegram.connected ? (
                  <div className="mt-3">
                    <p className="text-[13px] text-ink-soft">
                      Notifications going to{" "}
                      <strong className="text-ink">
                        {status.telegram.username ? `@${status.telegram.username}` : "your Telegram"}
                      </strong>
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="soft" size="sm" onClick={sendTestMessage}>
                        Send test message
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-alert"
                        onClick={() => disconnect("telegram")}
                      >
                        <Unlink className="size-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : !status?.telegramCredsConfigured ? (
                  <div className="mt-3 rounded-lg border border-line p-3 text-[13px] text-ink-soft"
                       style={{ background: "var(--surface-raised)" }}>
                    <p className="font-medium text-ink">Setup required</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12px]">
                      <li>Open Telegram and message <strong>@BotFather</strong></li>
                      <li>Send <code className="rounded bg-surface px-1">/newbot</code> and follow the prompts</li>
                      <li>Add the token as <code className="rounded bg-surface px-1">TELEGRAM_BOT_TOKEN</code> in your <code className="rounded bg-surface px-1">.env</code> file and restart</li>
                    </ol>
                  </div>
                ) : (
                  <div className="mt-3 space-y-4">
                    {/* Primary: polling connect */}
                    <div className="rounded-xl border-2 p-4"
                         style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
                      <p className="text-[13px] font-semibold text-ink">Connect via your bot</p>
                      <p className="mt-1 text-[12px] text-ink-soft">
                        {botUsername
                          ? <>Open Telegram and send any message to <strong>@{botUsername}</strong></>
                          : "Open Telegram and send any message to your bot"}
                        , then click the button below.
                      </p>
                      {botUsername && (
                        <a
                          href={`https://t.me/${botUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
                          style={{ background: "#26A5E4", color: "#fff" }}
                          onClick={() => setWaitingForMessage(true)}
                        >
                          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                          </svg>
                          Open @{botUsername} in Telegram
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-3"
                        onClick={pollForChatId}
                        disabled={polling}
                      >
                        {polling ? <><Loader2 className="size-3.5 animate-spin" /> Checking…</> : waitingForMessage ? "I sent a message — connect me" : "Connect Telegram"}
                      </Button>
                    </div>

                    {/* Fallback: manual chat ID */}
                    <details className="rounded-lg border border-line" style={{ background: "var(--surface-raised)" }}>
                      <summary className="cursor-pointer px-4 py-3 text-[12px] font-medium text-ink-soft hover:text-ink">
                        Or enter your chat ID manually
                      </summary>
                      <div className="px-4 pb-4 pt-1">
                        <p className="mb-2 text-[12px] text-ink-soft">
                          Message <strong>@userinfobot</strong> on Telegram to get your numeric chat ID.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="e.g. 123456789"
                            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2"
                            style={{ "--tw-ring-color": "#0f766e" } as React.CSSProperties}
                            onKeyDown={(e) => e.key === "Enter" && saveTelegramChatId()}
                          />
                          <Button variant="primary" size="sm" onClick={saveTelegramChatId}
                                  disabled={saving || !telegramChatId.trim()}>
                            {saving ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="px-6 py-8 text-[13px] text-ink-faint">Loading…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
