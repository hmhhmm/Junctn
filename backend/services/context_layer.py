from __future__ import annotations
import json
from datetime import date

from backend.services.data import Client, get_clients_for_advisor, TODAY

_UNANSWERED_SIGNALS = ("awaiting your response", "asked", "replied", "unanswered")

_CACHE_TTL = 3600  # 1 hour
_CACHE_PREFIX = "CONTEXT:"


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


def _build_context(advisor_id: str) -> dict:
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


def get_context(advisor_id: str) -> dict:
    """Return per-client context for the advisor, keyed by client_id.

    Checks Redis first (1-hour TTL). Falls back to seeded data on cache miss
    or Redis unavailability.
    """
    try:
        from backend.services.redis_client import get_redis
        r = get_redis()
        cached = r.get(f"{_CACHE_PREFIX}{advisor_id}")
        if cached:
            return json.loads(cached)
        context = _build_context(advisor_id)
        r.setex(f"{_CACHE_PREFIX}{advisor_id}", _CACHE_TTL, json.dumps(context))
        return context
    except Exception:
        # Redis unavailable — serve from source without caching
        return _build_context(advisor_id)


def invalidate_context(advisor_id: str) -> None:
    """Remove the cached context for an advisor (call after any context write)."""
    try:
        from backend.services.redis_client import get_redis
        get_redis().delete(f"{_CACHE_PREFIX}{advisor_id}")
    except Exception:
        pass
