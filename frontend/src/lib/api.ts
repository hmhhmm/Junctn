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
  const res = await fetch(`${BASE}/briefing/generate`, {
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
  const res = await fetch(`${BASE}/briefing/draft-followup`, {
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
  return `${BASE}/briefing/stream/${jobId}`;
}
