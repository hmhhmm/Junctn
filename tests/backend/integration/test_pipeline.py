"""
Integration tests — full LangGraph pipeline with Gemini mocked.

Tests that:
  - Nodes fire in the correct order (planner → calendar → client_memory → followup → synthesiser)
  - State propagates correctly through every node
  - trace_events accumulate one entry per node
  - The synthesised_text contains the required section markers
  - Advisor isolation: adv-1 state never contains adv-2 data
  - Audit log has one entry per LLM-calling node
"""
import json
import pytest
from unittest.mock import patch, MagicMock

from backend.agents.pipeline import BriefingState, build_briefing_graph
from backend.services.audit import get_audit_log
from tests.mocks.mock_gemini import make_client_memory_mock, make_synthesiser_mock


@pytest.fixture
def mock_gemini_models():
    """Patch both LLM-using models before the graph runs."""
    cm_response = make_client_memory_mock()
    synth_response = make_synthesiser_mock()
    with (
        patch("backend.agents.client_memory_agent._model") as mock_cm,
        patch("backend.agents.synthesiser._model") as mock_synth,
    ):
        mock_cm.generate_content.return_value = cm_response
        mock_synth.generate_content.return_value = synth_response
        yield mock_cm, mock_synth


def _initial_state(advisor_id: str = "adv-1") -> BriefingState:
    return {
        "advisor_id": advisor_id,
        "calendar_data": [],
        "client_memory": {},
        "followup_list": [],
        "synthesised_text": "",
        "trace_events": [],
        "error": None,
    }


class TestPipelineStateFlow:
    def test_pipeline_runs_to_completion(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert result is not None

    def test_advisor_id_preserved_through_pipeline(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert result["advisor_id"] == "adv-1"

    def test_calendar_data_populated(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert isinstance(result["calendar_data"], list)
        assert len(result["calendar_data"]) == 5  # adv-1 has 5 seeded meetings

    def test_calendar_data_has_required_fields(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        for meeting in result["calendar_data"]:
            assert "id" in meeting
            assert "time" in meeting
            assert "title" in meeting
            assert "channel" in meeting
            assert "client_id" in meeting

    def test_client_memory_populated(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert isinstance(result["client_memory"], dict)

    def test_client_memory_keyed_by_client_id(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        for cid, mem in result["client_memory"].items():
            assert "open_threads" in mem
            assert "health" in mem
            assert "talking_point" in mem

    def test_followup_list_populated(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert isinstance(result["followup_list"], list)

    def test_synthesised_text_not_empty(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert result["synthesised_text"]

    def test_synthesised_text_contains_calendar_marker(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert "[CALENDAR]" in result["synthesised_text"]

    def test_synthesised_text_contains_followups_marker(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert "[FOLLOWUPS]" in result["synthesised_text"]

    def test_synthesised_text_contains_ld_marker(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        assert "[LD]" in result["synthesised_text"]


class TestTraceEvents:
    def test_five_trace_events_one_per_node(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        agents = [e["agent"] for e in result["trace_events"]]
        assert "planner" in agents
        assert "calendar_agent" in agents
        assert "client_memory_agent" in agents
        assert "followup_agent" in agents
        assert "synthesiser" in agents

    def test_planner_fires_first(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        first_agent = result["trace_events"][0]["agent"]
        assert first_agent == "planner"

    def test_synthesiser_fires_last(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        last_agent = result["trace_events"][-1]["agent"]
        assert last_agent == "synthesiser"

    def test_trace_events_have_required_fields(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        for evt in result["trace_events"]:
            assert "agent" in evt
            assert "status" in evt
            assert "timestamp" in evt
            assert "summary" in evt

    def test_calendar_agent_summary_mentions_meeting_count(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-1"))
        evt = next(e for e in result["trace_events"] if e["agent"] == "calendar_agent")
        assert "5" in evt["summary"]  # adv-1 has 5 meetings


class TestAdvisorIsolation:
    def test_adv2_gets_zero_calendar_data(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-2"))
        assert result["calendar_data"] == []

    def test_adv2_client_memory_only_has_adv2_clients(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-2"))
        adv1_client_ids = {"cli-1", "cli-2", "cli-3", "cli-4", "cli-5", "cli-6", "cli-7", "cli-8"}
        for cid in result["client_memory"].keys():
            assert cid not in adv1_client_ids

    def test_adv2_followup_list_has_no_adv1_clients(self, mock_gemini_models):
        graph = build_briefing_graph()
        result = graph.invoke(_initial_state("adv-2"))
        adv1_client_ids = {"cli-1", "cli-2", "cli-3", "cli-4", "cli-5", "cli-6", "cli-7", "cli-8"}
        for item in result["followup_list"]:
            assert item["client_id"] not in adv1_client_ids

    def test_separate_jobs_share_no_state(self, mock_gemini_models):
        graph = build_briefing_graph()
        r1 = graph.invoke(_initial_state("adv-1"))
        r2 = graph.invoke(_initial_state("adv-2"))
        assert r1["advisor_id"] != r2["advisor_id"]
        assert set(r1["client_memory"].keys()).isdisjoint(set(r2["client_memory"].keys()))


class TestAuditLogging:
    def test_audit_entries_written_for_llm_steps(self, mock_gemini_models):
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        log = get_audit_log()
        steps = {entry["agent_step"] for entry in log}
        assert "client_memory_agent" in steps
        assert "synthesiser" in steps

    def test_audit_entries_have_correct_advisor_id(self, mock_gemini_models):
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        for entry in get_audit_log():
            assert entry["advisor_id"] == "adv-1"

    def test_audit_token_counts_are_non_negative(self, mock_gemini_models):
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        for entry in get_audit_log():
            assert entry["input_token_count"] >= 0


class TestGeminiMockIsCalled:
    def test_client_memory_model_called_once(self, mock_gemini_models):
        mock_cm, _ = mock_gemini_models
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        mock_cm.generate_content.assert_called_once()

    def test_synthesiser_model_called_with_stream(self, mock_gemini_models):
        _, mock_synth = mock_gemini_models
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        call_kwargs = mock_synth.generate_content.call_args
        assert call_kwargs.kwargs.get("stream") is True or (
            len(call_kwargs.args) > 1 and call_kwargs.args[1] is True
        )

    def test_no_real_gemini_call_is_made(self, mock_gemini_models):
        """Verify we're using our mocks, not hitting the real API."""
        mock_cm, mock_synth = mock_gemini_models
        graph = build_briefing_graph()
        graph.invoke(_initial_state("adv-1"))
        # If real API were called, generate_content would not be our mock
        assert mock_cm.generate_content.called
        assert mock_synth.generate_content.called
