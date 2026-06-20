from __future__ import annotations
import json
from datetime import datetime, timezone

import google.generativeai as genai

from backend.agents.pipeline import BriefingState
from backend.config import settings
from backend.services.audit import append_audit
from backend.services.context_layer import get_context

genai.configure(api_key=settings.gemini_api_key)

_SYSTEM = (
    "You are an assistant helping a financial advisor prepare for client meetings. "
    "Given client notes and context, return a JSON object keyed by client_id. "
    "Each value must have exactly three fields: "
    "'open_threads' (list of strings — unresolved questions or promises), "
    "'health' (one of: strong, needs-attention, at-risk), "
    "'talking_point' (one sentence the advisor should raise today). "
    "Return only valid JSON. No markdown, no explanation."
)

_model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=_SYSTEM)


def client_memory_agent(state: BriefingState) -> BriefingState:
    advisor_id = state["advisor_id"]
    context = get_context(advisor_id)

    meeting_client_ids = {
        m["client_id"] for m in state.get("calendar_data", []) if m.get("client_id")
    }
    relevant = {cid: ctx for cid, ctx in context.items() if cid in meeting_client_ids}

    if not relevant:
        trace_events = list(state.get("trace_events", []))
        trace_events.append({
            "agent": "client_memory_agent",
            "status": "complete",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": "No meeting clients to analyse",
        })
        return {**state, "client_memory": {}, "trace_events": trace_events}

    prompt_lines = []
    for cid, ctx in relevant.items():
        notes_text = "\n".join(
            f"  [{n['date']} {n['channel']}] {n['summary']}"
            for n in ctx["recent_notes"]
        ) or "  No recent notes."
        prompt_lines.append(
            f"Client {cid} ({ctx['name']}):\n"
            f"  Status: {ctx['status']} | Health signal: {ctx['health']}\n"
            f"  Days since last contact: {ctx['days_since_contact']}\n"
            f"  Needs: {', '.join(ctx['needs'])}\n"
            f"  Open threads: {'; '.join(ctx['open_threads']) or 'none'}\n"
            f"  Recent notes:\n{notes_text}"
        )

    user_prompt = "Analyse these clients and return the JSON:\n\n" + "\n\n".join(prompt_lines)

    response = _model.generate_content(user_prompt)
    raw = response.text.strip()
    input_tokens = response.usage_metadata.prompt_token_count

    try:
        client_memory: dict = json.loads(raw)
    except Exception:
        client_memory = {cid: {"open_threads": [], "health": ctx["health"], "talking_point": ""} for cid, ctx in relevant.items()}

    append_audit(
        advisor_id=advisor_id,
        feature="briefing",
        agent_step="client_memory_agent",
        input_token_count=input_tokens,
        output_summary=f"Analysed {len(relevant)} meeting client(s)",
    )

    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "client_memory_agent",
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Analysed {len(relevant)} meeting client(s) ({input_tokens} tokens)",
    })

    return {**state, "client_memory": client_memory, "trace_events": trace_events}
