from __future__ import annotations
from datetime import datetime, timezone

import google.generativeai as genai

from backend.agents.pipeline import BriefingState
from backend.config import settings
from backend.services.audit import append_audit

genai.configure(api_key=settings.gemini_api_key)

_SYSTEM = """You are a concise briefing assistant for a financial advisor.
Write a structured morning briefing using exactly these three section markers on their own line:
[CALENDAR]
[FOLLOWUPS]
[LD]

Rules:
- [CALENDAR]: 2-4 bullet points covering today's meetings. Include time, client name, key topic, and one flag per meeting if present.
- [FOLLOWUPS]: bullet points for each client needing a follow-up. State the client name, reason, and urgency. If none, write "No follow-ups outstanding — good work."
- [LD]: one sentence recommending the most relevant CPD action based on the advisor's client needs.
- Tone: concise, professional, advisory-appropriate. No filler.
- Use bullet points (•) not dashes."""

_model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=_SYSTEM)


def _build_prompt(state: BriefingState) -> str:
    lines: list[str] = []

    lines.append("=== TODAY'S CALENDAR ===")
    for m in state.get("calendar_data", []):
        flag_text = f" [{m['flag']['text']}]" if m.get("flag") else ""
        lines.append(f"{m['time']} — {m['title']} ({m['channel']}){flag_text}")

    lines.append("\n=== CLIENT MEMORY ===")
    for client_id, mem in state.get("client_memory", {}).items():
        threads = "; ".join(mem.get("open_threads", [])) or "none"
        lines.append(
            f"{client_id}: health={mem.get('health')} | "
            f"open threads: {threads} | "
            f"talking point: {mem.get('talking_point', '')}"
        )

    lines.append("\n=== FOLLOW-UPS NEEDED ===")
    for f in state.get("followup_list", []):
        lines.append(
            f"{f['client_name']} ({f['urgency']} urgency, {f['days_overdue']}d): {f['reason']}"
        )
    if not state.get("followup_list"):
        lines.append("None")

    return "\n".join(lines)


def synthesiser(state: BriefingState) -> BriefingState:
    advisor_id = state["advisor_id"]
    prompt = _build_prompt(state)

    full_text = ""
    input_tokens = 0

    response = _model.generate_content(prompt, stream=True)
    for chunk in response:
        if chunk.text:
            full_text += chunk.text

    # usage_metadata is available on the final aggregated response
    try:
        input_tokens = response.usage_metadata.prompt_token_count
    except Exception:
        input_tokens = 0

    append_audit(
        advisor_id=advisor_id,
        feature="briefing",
        agent_step="synthesiser",
        input_token_count=input_tokens,
        output_summary=f"Generated {len(full_text)} char briefing",
    )

    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "synthesiser",
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Briefing generated ({len(full_text)} chars, {input_tokens} tokens)",
    })

    return {**state, "synthesised_text": full_text, "trace_events": trace_events}
