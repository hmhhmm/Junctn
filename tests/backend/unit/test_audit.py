"""Unit tests — in-memory audit log (services/audit.py)."""
import pytest

from backend.services.audit import append_audit, get_audit_log, _log


class TestAppendAudit:
    def test_stores_entry(self):
        append_audit("adv-1", "briefing", "synthesiser", 200, "Generated briefing")
        assert len(get_audit_log()) == 1

    def test_entry_has_all_required_fields(self):
        append_audit("adv-1", "briefing", "client_memory_agent", 150, "Analysed 2 clients")
        entry = get_audit_log()[0]
        assert "timestamp" in entry
        assert "advisor_id" in entry
        assert "feature" in entry
        assert "agent_step" in entry
        assert "input_token_count" in entry
        assert "output_summary" in entry

    def test_advisor_id_stored_correctly(self):
        append_audit("adv-2", "briefing", "synthesiser", 100, "Done")
        assert get_audit_log()[0]["advisor_id"] == "adv-2"

    def test_feature_stored_correctly(self):
        append_audit("adv-1", "briefing", "synthesiser", 100, "Done")
        assert get_audit_log()[0]["feature"] == "briefing"

    def test_agent_step_stored_correctly(self):
        append_audit("adv-1", "briefing", "draft_followup", 80, "Draft")
        assert get_audit_log()[0]["agent_step"] == "draft_followup"

    def test_token_count_stored(self):
        append_audit("adv-1", "briefing", "synthesiser", 999, "Done")
        assert get_audit_log()[0]["input_token_count"] == 999

    def test_output_summary_stored(self):
        append_audit("adv-1", "briefing", "synthesiser", 100, "Generated 512 char briefing")
        assert get_audit_log()[0]["output_summary"] == "Generated 512 char briefing"

    def test_default_output_summary_is_empty_string(self):
        append_audit("adv-1", "briefing", "synthesiser", 100)
        assert get_audit_log()[0]["output_summary"] == ""

    def test_default_token_count_is_zero(self):
        append_audit("adv-1", "briefing", "synthesiser")
        assert get_audit_log()[0]["input_token_count"] == 0

    def test_timestamp_is_iso_string(self):
        import re
        append_audit("adv-1", "briefing", "synthesiser")
        ts = get_audit_log()[0]["timestamp"]
        # ISO 8601 with timezone offset or Z
        assert re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", ts)

    def test_multiple_entries_accumulate(self):
        append_audit("adv-1", "briefing", "client_memory_agent", 150, "Step 1")
        append_audit("adv-1", "briefing", "synthesiser", 200, "Step 2")
        append_audit("adv-1", "briefing", "draft_followup", 80, "Step 3")
        assert len(get_audit_log()) == 3

    def test_different_advisor_entries_stored_separately(self):
        append_audit("adv-1", "briefing", "synthesiser", 100, "adv-1 briefing")
        append_audit("adv-2", "briefing", "synthesiser", 110, "adv-2 briefing")
        log = get_audit_log()
        assert log[0]["advisor_id"] == "adv-1"
        assert log[1]["advisor_id"] == "adv-2"


class TestGetAuditLog:
    def test_empty_on_fresh_state(self):
        assert get_audit_log() == []

    def test_returns_list(self):
        assert isinstance(get_audit_log(), list)

    def test_returns_copy_not_reference(self):
        append_audit("adv-1", "briefing", "synthesiser")
        log = get_audit_log()
        log.clear()
        # Original should be untouched
        assert len(get_audit_log()) == 1
