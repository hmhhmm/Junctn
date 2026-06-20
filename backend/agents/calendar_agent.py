from __future__ import annotations
from datetime import datetime, timezone

from backend.agents.pipeline import BriefingState
from backend.services.data import get_meetings_for_advisor


def _fmt_time(iso: str) -> str:
    """Convert ISO datetime to HH:MM string."""
    if not iso:
        return ""
    try:
        from datetime import datetime as dt
        return dt.fromisoformat(iso.replace("Z", "+00:00")).strftime("%H:%M")
    except Exception:
        return iso[:5]


def calendar_agent(state: BriefingState) -> BriefingState:
    real_events: list[dict] = state.get("real_calendar_events", [])

    if real_events:
        # Use real Google Calendar events passed from the frontend
        calendar_data = [
            {
                "id": e.get("id", ""),
                "time": _fmt_time(e.get("start", "")),
                "title": e.get("title", "Untitled"),
                "channel": "Video" if e.get("hangoutLink") else ("In person" if e.get("location") else "Meeting"),
                "meta": e.get("location") or (", ".join(e.get("attendees", []))[:60]) or "",
                "client_id": None,
                "flag": None,
            }
            for e in real_events
        ]
        source = "Google Calendar (live)"
    else:
        # Fall back to seeded mock data
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
        source = "seeded data (Google Calendar not connected)"

    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "calendar_agent",
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"{len(calendar_data)} meeting{'s' if len(calendar_data) != 1 else ''} found for today — source: {source}",
    })

    return {**state, "calendar_data": calendar_data, "trace_events": trace_events}
