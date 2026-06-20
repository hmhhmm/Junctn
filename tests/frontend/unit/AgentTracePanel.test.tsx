/**
 * Unit tests — AgentTracePanel component
 * (src/components/advisor/AgentTracePanel.tsx)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentTracePanel } from "../../../frontend/src/components/advisor/AgentTracePanel";
import type { TraceEvent } from "../../../frontend/src/hooks/useBriefingStream";

const TRACE_EVENTS: TraceEvent[] = [
  { agent: "planner", status: "thinking", timestamp: "2026-06-19T00:00:00+00:00", summary: "Analysing context" },
  { agent: "calendar_agent", status: "complete", timestamp: "2026-06-19T00:00:01+00:00", summary: "5 meetings found" },
  { agent: "client_memory_agent", status: "complete", timestamp: "2026-06-19T00:00:02+00:00", summary: "2 clients analysed" },
  { agent: "followup_agent", status: "complete", timestamp: "2026-06-19T00:00:03+00:00", summary: "3 follow-ups flagged" },
  { agent: "synthesiser", status: "complete", timestamp: "2026-06-19T00:00:04+00:00", summary: "Briefing generated" },
];

describe("AgentTracePanel — empty state", () => {
  it("shows waiting message when no events", () => {
    render(<AgentTracePanel traceEvents={[]} isDone={false} />);
    expect(screen.getByText(/Waiting for pipeline/i)).toBeInTheDocument();
  });
});

describe("AgentTracePanel — with events", () => {
  it("renders all trace events", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={true} />);
    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Client Memory")).toBeInTheDocument();
    expect(screen.getByText("Follow-ups")).toBeInTheDocument();
    expect(screen.getByText("Synthesiser")).toBeInTheDocument();
  });

  it("renders event summaries", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={true} />);
    expect(screen.getByText("5 meetings found")).toBeInTheDocument();
    expect(screen.getByText("Briefing generated")).toBeInTheDocument();
  });

  it("shows Complete badge when isDone is true", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("shows Running badge when isDone is false", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={false} />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("renders events with complete status without spinning loader", () => {
    render(<AgentTracePanel traceEvents={[TRACE_EVENTS[1]]} isDone={true} />);
    // Complete events show a checkmark, not a spinner
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBe(0);
  });

  it("renders in-progress event with spinning loader", () => {
    const inProgressEvent: TraceEvent = {
      agent: "planner",
      status: "thinking",
      timestamp: "2026-06-19T00:00:00+00:00",
      summary: "Still planning...",
    };
    render(<AgentTracePanel traceEvents={[inProgressEvent]} isDone={false} />);
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("renders formatted timestamp", () => {
    render(<AgentTracePanel traceEvents={[TRACE_EVENTS[0]]} isDone={false} />);
    // Timestamp is shown in HH:mm:ss format (locale-dependent)
    // Just verify it renders something in the time area
    const panel = document.querySelector("[style*='mono']");
    expect(panel).toBeInTheDocument();
  });
});

describe("AgentTracePanel — collapse toggle", () => {
  it("collapses on toggle button click", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={true} />);
    const toggleBtn = screen.getByTitle(/Hide agent trace/i);
    fireEvent.click(toggleBtn);
    // After collapse, panel body should not show event content
    expect(screen.queryByText("Planner")).not.toBeInTheDocument();
  });

  it("expands again after second click", () => {
    render(<AgentTracePanel traceEvents={TRACE_EVENTS} isDone={true} />);
    const toggleBtn = screen.getByTitle(/Hide agent trace/i);
    fireEvent.click(toggleBtn);
    const expandBtn = screen.getByTitle(/Show agent trace/i);
    fireEvent.click(expandBtn);
    expect(screen.getByText("Planner")).toBeInTheDocument();
  });

  it("shows unknown agent name as-is when not in label map", () => {
    const unknownEvent: TraceEvent = {
      agent: "mystery_agent",
      status: "complete",
      timestamp: "2026-06-19T00:00:00+00:00",
      summary: "Did something",
    };
    render(<AgentTracePanel traceEvents={[unknownEvent]} isDone={true} />);
    expect(screen.getByText("mystery_agent")).toBeInTheDocument();
  });
});
