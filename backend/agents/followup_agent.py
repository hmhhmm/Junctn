from __future__ import annotations
from datetime import date, datetime, timezone

from backend.agents.pipeline import BriefingState
from backend.services.data import TODAY, get_clients_for_advisor

_UNANSWERED_SIGNALS = ("awaiting your response", "asked", "replied", "unanswered")


def _days_since(iso_date: str) -> int:
    return (date.fromisoformat(TODAY) - date.fromisoformat(iso_date)).days


def _urgency(days: int, has_unanswered: bool) -> str:
    if has_unanswered or days > 30:
        return "high"
    if days > 14:
        return "medium"
    return "low"


def followup_agent(state: BriefingState) -> BriefingState:
    advisor_id = state["advisor_id"]
    clients = get_clients_for_advisor(advisor_id)

    followup_list: list[dict] = []

    for client in clients:
        if client.status == "dormant":
            continue

        days = _days_since(client.last_contact)
        unanswered_notes = [
            n.summary for n in client.notes
            if any(sig in n.summary.lower() for sig in _UNANSWERED_SIGNALS)
        ]
        has_unanswered = bool(unanswered_notes)

        if days > 14 or has_unanswered:
            reason = (
                unanswered_notes[0] if unanswered_notes
                else f"No contact in {days} days"
            )
            followup_list.append({
                "client_id": client.id,
                "client_name": client.name,
                "days_overdue": days,
                "reason": reason,
                "urgency": _urgency(days, has_unanswered),
            })

    followup_list.sort(key=lambda x: (
        0 if x["urgency"] == "high" else 1 if x["urgency"] == "medium" else 2,
        -x["days_overdue"],
    ))

    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "followup_agent",
        "status": "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"{len(followup_list)} client(s) need a follow-up",
    })

    return {**state, "followup_list": followup_list, "trace_events": trace_events}
