import fs from "fs";
import path from "path";

const TOKEN_FILE = path.join(process.cwd(), "data", "tokens.json");

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email?: string;
}

export interface TelegramConfig {
  chat_id: string;
  username?: string;
}

export interface StoredTokens {
  google?: GoogleTokens;
  telegram?: TelegramConfig;
}

export function readTokens(): StoredTokens {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return {};
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function writeTokens(tokens: StoredTokens): void {
  const dir = path.dirname(TOKEN_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function patchTokens(patch: Partial<StoredTokens>): void {
  writeTokens({ ...readTokens(), ...patch });
}
