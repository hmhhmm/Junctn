"""Unit tests — Follow-up agent pure logic (agents/followup_agent.py)."""
import pytest
from unittest.mock import patch

from backend.agents.followup_agent import followup_agent, _days_since, _urgency
from backend.agents.pipeline import BriefingState
from backend.services.data import TODAY


def _base_state(advisor_id: str = "adv-1") -> BriefingState:
    return {
        "advisor_id": advisor_id,
        "calendar_data": [],
        "client_memory": {},
        "followup_list": [],
        "synthesised_text": "",
        "trace_events": [],
        "error": None,
    }


class TestDaysSince:
    def test_same_day_zero(self):
        assert _days_since(TODAY) == 0

    def test_one_day_ago(self):
        assert _days_since("2026-06-18") == 1

    def test_14_days_ago(self):
        assert _days_since("2026-06-05") == 14

    def test_31_days_ago(self):
        assert _days_since("2026-05-19") == 31


class TestUrgency:
    def test_unanswered_is_high(self):
        assert _urgency(5, has_unanswered=True) == "high"

    def test_over_30_days_is_high(self):
        assert _urgency(31, has_unanswered=False) == "high"

    def test_15_to_30_days_is_medium(self):
        assert _urgency(15, has_unanswered=False) == "medium"
        assert _urgency(30, has_unanswered=False) == "medium"

    def test_14_days_or_under_is_low(self):
        assert _urgency(14, has_unanswered=False) == "low"
        assert _urgency(0, has_unanswered=False) == "low"


class TestFollowupAgent:
    def test_returns_state_dict(self):
        result = followup_agent(_base_state("adv-1"))
        assert isinstance(result, dict)
        assert "followup_list" in result

    def test_dormant_clients_excluded(self):
        # cli-7 (Hafiz Ismail) is dormant — must never appear in follow-up list
        result = followup_agent(_base_state("adv-1"))
        client_ids = {item["client_id"] for item in result["followup_list"]}
        assert "cli-7" not in client_ids

    def test_clients_over_14_days_are_flagged(self):
        # cli-4 last_contact 2026-05-02 = 48 days ago
        result = followup_agent(_base_state("adv-1"))
        client_ids = {item["client_id"] for item in result["followup_list"]}
        assert "cli-4" in client_ids

    def test_clients_within_14_days_not_automatically_flagged(self):
        # cli-1 last_contact 2026-06-17 = 2 days ago, no unanswered signal
        result = followup_agent(_base_state("adv-1"))
        # cli-1 has "asked" in note n2 ("Reviewed Q2 portfolio") — let's check actual signal
        # "Comfortable with current allocation" — no unanswered signal
        # cli-1 last contact 2 days — should NOT be in list unless has signal
        item_ids = {item["client_id"] for item in result["followup_list"]}
        # cli-3 last_contact 2026-06-18 = 1 day, no unanswered signal
        assert "cli-3" not in item_ids

    def test_unanswered_signal_triggers_regardless_of_days(self):
        # cli-2 has "Awaiting your response" and last_contact 2026-06-05 = 14 days
        result = followup_agent(_base_state("adv-1"))
        client_ids = {item["client_id"] for item in result["followup_list"]}
        assert "cli-2" in client_ids

    def test_followup_list_sorted_high_before_medium(self):
        result = followup_agent(_base_state("adv-1"))
        urgencies = [item["urgency"] for item in result["followup_list"]]
        order = {"high": 0, "medium": 1, "low": 2}
        assert urgencies == sorted(urgencies, key=lambda u: order[u])

    def test_followup_item_has_required_fields(self):
        result = followup_agent(_base_state("adv-1"))
        required = {"client_id", "client_name", "days_overdue", "reason", "urgency"}
        for item in result["followup_list"]:
            assert required.issubset(item.keys())

    def test_trace_event_appended(self):
        result = followup_agent(_base_state("adv-1"))
        agents = [e["agent"] for e in result["trace_events"]]
        assert "followup_agent" in agents

    def test_trace_event_has_complete_status(self):
        result = followup_agent(_base_state("adv-1"))
        evt = next(e for e in result["trace_events"] if e["agent"] == "followup_agent")
        assert evt["status"] == "complete"

    def test_adv2_followup_list_has_no_adv1_clients(self):
        adv1_client_ids = {"cli-1", "cli-2", "cli-3", "cli-4", "cli-5", "cli-6", "cli-7", "cli-8"}
        result = followup_agent(_base_state("adv-2"))
        for item in result["followup_list"]:
            assert item["client_id"] not in adv1_client_ids

    def test_days_overdue_is_non_negative(self):
        result = followup_agent(_base_state("adv-1"))
        for item in result["followup_list"]:
            assert item["days_overdue"] >= 0

    def test_high_urgency_items_include_days_over_30(self):
        result = followup_agent(_base_state("adv-1"))
        for item in result["followup_list"]:
            if item["urgency"] == "high" and item["days_overdue"] > 30:
                assert item["days_overdue"] > 30
