const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  advisor_id: string;
  name: string;
}

export async function login(advisorId: string, password = "demo"): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ advisor_id: advisorId, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

export async function generateBriefing(token: string): Promise<{ job_id: string }> {
  const res = await fetch("/api/briefing/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
  return res.json();
}

export async function draftFollowup(
  token: string,
  clientId: string,
): Promise<{ draft: string; client_name: string }> {
  const res = await fetch("/api/briefing/draft-followup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId }),
  });
  if (!res.ok) throw new Error(`Draft failed: ${res.status}`);
  return res.json();
}

export function getBriefingStreamUrl(jobId: string): string {
  return `/api/briefing/stream/${jobId}`;
}

export interface OutreachPayload {
  client: {
    client_name: string;
    interests: string[];
    family: string[];
    important_dates: { label: string; date: string }[];
    communication_style: string;
    gift_ideas: string[];
    last_personal_touch: string | null;
    recent_notes: string[];
  };
  outreach_type: "check_in" | "upcoming_date" | "news_share" | "review_reminder";
}

export async function draftOutreach(
  token: string,
  payload: OutreachPayload,
): Promise<{ draft: string; outreach_type: string }> {
  const res = await fetch("/api/relationship/draft-outreach", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Outreach draft failed: ${res.status}`);
  return res.json();
}
