from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, TypedDict

from langgraph.graph import StateGraph, END


class BriefingState(TypedDict):
    advisor_id: str
    calendar_data: list[dict]
    client_memory: dict[str, dict]
    followup_list: list[dict]
    synthesised_text: str
    trace_events: list[dict]
    error: Optional[str]


def _planner(state: BriefingState) -> BriefingState:
    trace_events = list(state.get("trace_events", []))
    trace_events.append({
        "agent": "planner",
        "status": "thinking",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Analysing calendar, client memory, and follow-ups for {state['advisor_id']}",
    })
    return {**state, "trace_events": trace_events}


def build_briefing_graph():
    from backend.agents.calendar_agent import calendar_agent
    from backend.agents.client_memory_agent import client_memory_agent
    from backend.agents.followup_agent import followup_agent
    from backend.agents.synthesiser import synthesiser

    graph = StateGraph(BriefingState)

    graph.add_node("planner", _planner)
    graph.add_node("calendar_agent", calendar_agent)
    graph.add_node("client_memory_agent", client_memory_agent)
    graph.add_node("followup_agent", followup_agent)
    graph.add_node("synthesiser", synthesiser)

    graph.set_entry_point("planner")
    graph.add_edge("planner", "calendar_agent")
    graph.add_edge("calendar_agent", "client_memory_agent")
    graph.add_edge("client_memory_agent", "followup_agent")
    graph.add_edge("followup_agent", "synthesiser")
    graph.add_edge("synthesiser", END)

    return graph.compile()
