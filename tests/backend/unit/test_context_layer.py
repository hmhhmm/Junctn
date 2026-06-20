"""Unit tests — Advisor Context Layer logic (services/context_layer.py)."""
import pytest
from unittest.mock import patch

from backend.services.context_layer import (
    get_context,
    _days_since,
    _relationship_health,
    _open_threads,
    _recent_notes,
)
from backend.services.data import get_client, TODAY


class TestDaysSince:
    def test_same_day_is_zero(self):
        assert _days_since(TODAY) == 0

    def test_yesterday_is_one(self):
        # TODAY = "2026-06-19"
        assert _days_since("2026-06-18") == 1

    def test_two_weeks_ago(self):
        assert _days_since("2026-06-05") == 14

    def test_thirty_days_ago(self):
        assert _days_since("2026-05-20") == 30


class TestRelationshipHealth:
    def test_recent_contact_is_strong(self):
        client = get_client("cli-1")  # last_contact 2026-06-17 (2 days ago), active
        assert _relationship_health(client) == "strong"

    def test_review_due_status_is_needs_attention(self):
        client = get_client("cli-2")  # status = review_due
        result = _relationship_health(client)
        assert result == "needs-attention"

    def test_over_14_days_no_contact_is_needs_attention(self):
        # cli-4 last_contact "2026-05-02" = 48 days ago → at-risk (>30)
        client = get_client("cli-4")
        assert _relationship_health(client) == "at-risk"

    def test_dormant_client_is_at_risk(self):
        client = get_client("cli-7")  # status = dormant
        assert _relationship_health(client) == "at-risk"

    def test_over_30_days_is_at_risk(self):
        client = get_client("cli-4")  # 48 days since contact
        assert _relationship_health(client) == "at-risk"


class TestOpenThreads:
    def test_detects_awaiting_signal(self):
        client = get_client("cli-2")  # note contains "Awaiting your response"
        threads = _open_threads(client)
        assert len(threads) >= 1
        assert any("awaiting" in t.lower() for t in threads)

    def test_client_with_no_signals_has_empty_threads(self):
        # cli-3 note: "Found a resale condo..." — no unanswered signal
        client = get_client("cli-3")
        threads = _open_threads(client)
        assert threads == []

    def test_detects_asked_signal(self):
        # cli-6 note contains "asked about tax-efficient ways"
        client = get_client("cli-6")
        threads = _open_threads(client)
        assert len(threads) >= 1

    def test_partner_contact_info_not_in_threads(self):
        # Context layer must never surface partner contact details
        for i in range(1, 7):
            context = get_context(f"adv-{i}")
            for cid, ctx in context.items():
                for thread in ctx["open_threads"]:
                    # These are the partner fields that must stay quarantined
                    assert "email" not in thread.lower()
                    assert "phone" not in thread.lower()
                    assert "contact" not in thread.lower()


class TestRecentNotes:
    def test_capped_at_three(self):
        client = get_client("cli-1")  # has 3 notes
        notes = _recent_notes(client)
        assert len(notes) <= 3

    def test_sorted_most_recent_first(self):
        client = get_client("cli-1")
        notes = _recent_notes(client)
        dates = [n["date"] for n in notes]
        assert dates == sorted(dates, reverse=True)

    def test_note_has_required_fields(self):
        client = get_client("cli-1")
        for note in _recent_notes(client):
            assert "date" in note
            assert "channel" in note
            assert "summary" in note

    def test_client_with_no_notes_returns_empty(self):
        client = get_client("cli-7")  # dormant, no notes
        assert _recent_notes(client) == []


class TestGetContext:
    def test_returns_only_advisor_clients(self):
        ctx = get_context("adv-1")
        adv1_client_ids = {"cli-1", "cli-2", "cli-3", "cli-4", "cli-5", "cli-6", "cli-7", "cli-8"}
        assert set(ctx.keys()) == adv1_client_ids

    def test_adv2_context_has_no_adv1_clients(self):
        adv1_ctx = get_context("adv-1")
        adv2_ctx = get_context("adv-2")
        assert set(adv1_ctx.keys()).isdisjoint(set(adv2_ctx.keys()))

    def test_context_entry_has_required_fields(self):
        ctx = get_context("adv-1")
        required = {"client_id", "name", "last_contact", "days_since_contact",
                    "status", "needs", "aum", "health", "open_threads",
                    "next_meeting", "recent_notes"}
        for cid, entry in ctx.items():
            assert required.issubset(entry.keys()), f"Missing fields for {cid}"

    def test_health_field_is_valid_enum(self):
        ctx = get_context("adv-1")
        for entry in ctx.values():
            assert entry["health"] in {"strong", "needs-attention", "at-risk"}

    def test_unknown_advisor_returns_empty_context(self):
        assert get_context("adv-999") == {}

    def test_aum_never_in_open_threads(self):
        # AUM is financial data — must not leak into thread text
        for i in range(1, 7):
            ctx = get_context(f"adv-{i}")
            for entry in ctx.values():
                for thread in entry["open_threads"]:
                    assert "$" not in thread
                    assert "4,200,000" not in thread
