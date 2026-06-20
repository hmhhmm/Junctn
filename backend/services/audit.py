from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional

_log: list[dict] = []


def append_audit(
    advisor_id: str,
    feature: str,
    agent_step: str,
    input_token_count: int = 0,
    output_summary: Optional[str] = None,
) -> None:
    _log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "advisor_id": advisor_id,
        "feature": feature,
        "agent_step": agent_step,
        "input_token_count": input_token_count,
        "output_summary": output_summary or "",
    })


def get_audit_log() -> list[dict]:
    return list(_log)
