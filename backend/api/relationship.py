"""
/relationship/draft-outreach  — AI-generated personalised client outreach drafts.

Uses Gemini to produce warm, context-aware messages based on client profile
data (interests, family, upcoming dates, communication style).
"""
from __future__ import annotations

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.config import settings
from backend.services.auth import get_current_advisor

router = APIRouter(prefix="/relationship", tags=["relationship"])

genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-2.5-flash")


class ClientProfilePayload(BaseModel):
    client_name: str
    interests: list[str] = []
    family: list[str] = []
    important_dates: list[dict] = []   # [{"label": str, "date": str}]
    communication_style: str = ""
    gift_ideas: list[str] = []
    last_personal_touch: str | None = None
    recent_notes: list[str] = []       # last 2–3 note summaries


class OutreachRequest(BaseModel):
    client: ClientProfilePayload
    outreach_type: str = "check_in"    # check_in | upcoming_date | news_share | review_reminder


@router.post("/draft-outreach")
async def draft_outreach(
    req: OutreachRequest,
    _advisor_id: str = Depends(get_current_advisor),
) -> dict:
    c = req.client

    upcoming = ""
    if c.important_dates:
        upcoming = "; ".join(f"{d['label']} on {d['date']}" for d in c.important_dates[:2])

    prompt = f"""You are an experienced wealth advisory assistant helping a licensed financial adviser
draft a warm, personalised outreach message to a client. Write in a professional yet friendly tone
that reflects genuine interest in the client as a person, not just their portfolio.

Client name: {c.client_name}
Communication style: {c.communication_style or "professional but warm"}
Interests: {", ".join(c.interests) if c.interests else "not specified"}
Family context: {"; ".join(c.family) if c.family else "not specified"}
Upcoming personal dates: {upcoming or "none noted"}
Recent interaction notes: {"; ".join(c.recent_notes[-2:]) if c.recent_notes else "none"}
Outreach type: {req.outreach_type.replace("_", " ")}

Instructions:
- Write a single short message (3–5 sentences maximum)
- Reference one specific personal detail naturally — avoid sounding formulaic
- Do NOT mention specific financial products or portfolio values
- End with a gentle invitation to reconnect (call, coffee, WhatsApp)
- Output ONLY the message body — no subject line, no sign-off

Message:"""

    try:
        response = _model.generate_content(prompt)
        draft = response.text.strip()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI generation failed: {exc}",
        ) from exc

    return {"draft": draft, "outreach_type": req.outreach_type}


class AdvisorChatRequest(BaseModel):
    system_context: str
    message: str


@router.post("/advisor-chat")
async def advisor_chat(
    req: AdvisorChatRequest,
    _advisor_id: str = Depends(get_current_advisor),
) -> dict:
    prompt = f"""{req.system_context}

Advisor asks: {req.message}

Respond in 3–5 concise sentences. Be specific and actionable. Reference client details where relevant."""

    try:
        response = _model.generate_content(prompt)
        return {"reply": response.text.strip()}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI generation failed: {exc}",
        ) from exc
