import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuthClient } from "@/lib/server/google-client";
import { patchTokens } from "@/lib/server/tokens";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${base}/advisor/settings?error=google_denied`);
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch the authenticated user's email
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();

    patchTokens({
      google: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token ?? undefined,
        expiry_date: tokens.expiry_date ?? 0,
        email: userInfo.email ?? undefined,
      } as Parameters<typeof patchTokens>[0]["google"],
    });

    return NextResponse.redirect(`${base}/advisor/settings?connected=google`);
  } catch (err) {
    console.error("Google OAuth callback error", err);
    return NextResponse.redirect(`${base}/advisor/settings?error=google_failed`);
  }
}
