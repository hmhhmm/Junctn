import { google } from "googleapis";
import { readTokens, patchTokens } from "./tokens";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",  // read + create/edit events
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/tasks",             // Google Tasks read + write
  "https://www.googleapis.com/auth/userinfo.email",
];

export function createOAuthClient() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`,
  );
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getAuthedClient() {
  const tokens = readTokens();
  if (!tokens.google) throw new Error("not_connected");

  const client = createOAuthClient();
  client.setCredentials(tokens.google);

  // Auto-refresh if expired
  client.on("tokens", (fresh) => {
    patchTokens({
      google: { ...tokens.google!, ...fresh } as typeof tokens.google,
    });
  });

  return client;
}
