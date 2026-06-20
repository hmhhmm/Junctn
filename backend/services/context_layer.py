from __future__ import annotations
from datetime import date

from backend.services.data import Client, get_clients_for_advisor, TODAY

_UNANSWERED_SIGNALS = ("awaiting your response", "asked", "replied", "unanswered")


def _days_since(iso_date: str) -> int:
    today = date.fromisoformat(TODAY)
    last = date.fromisoformat(iso_date)
    return (today - last).days


def _relationship_health(client: Client) -> str:
    days = _days_since(client.last_contact)
    if client.status == "dormant" or days > 30:
        return "at-risk"
    if days > 14 or client.status == "review_due":
        return "needs-attention"
    return "strong"


def _open_threads(client: Client) -> list[str]:
    threads: list[str] = []
    for note in client.notes:
        if any(signal in note.summary.lower() for signal in _UNANSWERED_SIGNALS):
            threads.append(note.summary)
    return threads


def _recent_notes(client: Client) -> list[dict]:
    sorted_notes = sorted(client.notes, key=lambda n: n.date, reverse=True)
    return [
        {"date": n.date, "channel": n.channel, "summary": n.summary}
        for n in sorted_notes[:3]
    ]


def get_context(advisor_id: str) -> dict:
    """Return per-client context for the advisor, keyed by client_id."""
    result: dict = {}
    for c in get_clients_for_advisor(advisor_id):
        result[c.id] = {
            "client_id": c.id,
            "name": c.name,
            "last_contact": c.last_contact,
            "days_since_contact": _days_since(c.last_contact),
            "status": c.status,
            "needs": c.needs,
            "aum": c.aum,
            "health": _relationship_health(c),
            "open_threads": _open_threads(c),
            "next_meeting": c.next_meeting,
            "recent_notes": _recent_notes(c),
        }
    return result
