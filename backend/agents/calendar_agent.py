from __future__ import annotations
from datetime import datetime, timezone

from backend.agents.pipeline import BriefingState
from backend.services.data import get_meetings_for_advisor


def calendar_agent(state: BriefingState) -> BriefingState:
    meetings = get_meetings_for_advisor(state["advisor_id"])

    calendar_data = [
        {
            "id": m.id,
            "time": m.time,
            "title": m.title,
            "channel": m.channel,
            "meta": m.meta,
            "client_id": m.client_id,
            "flag": {"kind": m.flag.kind, "text": m.flag.text} if m.flag else None,
        }
        for m in meetings
    ]

    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "calendar_agent",
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"{len(calendar_data)} meeting{'s' if len(calendar_data) != 1 else ''} found for today",
    })

    return {**state, "calendar_data": calendar_data, "trace_events": trace_events}
