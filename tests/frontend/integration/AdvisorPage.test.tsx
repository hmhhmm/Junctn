/**
 * Integration test — Advisor page flow
 * (src/app/advisor/page.tsx)
 *
 * Tests the full page mount: silent login → generateBriefing → stream → render.
 * All API calls are mocked. EventSource is mocked.
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock the API module
// ---------------------------------------------------------------------------
jest.mock("../../../frontend/src/lib/api", () => ({
  login: jest.fn().mockResolvedValue({
    access_token: "mock-jwt-token",
    token_type: "bearer",
    advisor_id: "adv-1",
    name: "Marcus Tan",
  }),
  generateBriefing: jest.fn().mockResolvedValue({ job_id: "mock-job-id" }),
  draftFollowup: jest.fn(),
  getBriefingStreamUrl: jest.fn().mockReturnValue("http://test/briefing/stream/mock-job-id"),
}));

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------
type Listener = (event: MessageEvent) => void;

class MockEventSource {
  static instance: MockEventSource | null = null;
  url: string;
  private listeners: Record<string, Listener[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instance = this;
  }

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  dispatchEvent(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    (this.listeners[type] ?? []).forEach((l) => l(event));
  }

  close() {}
}

beforeEach(() => {
  MockEventSource.instance = null;
  (global as unknown as Record<string, unknown>).EventSource = MockEventSource;
});

afterEach(() => {
  delete (global as unknown as Record<string, unknown>).EventSource;
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Mock the store to supply a stable advisorId
// ---------------------------------------------------------------------------
jest.mock("../../../frontend/src/lib/store", () => ({
  useStore: () => ({
    advisorId: "adv-1",
    referrals: [],
    accessToken: null,
    setAccessToken: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock child components that pull in data not relevant to streaming tests
// ---------------------------------------------------------------------------
jest.mock("../../../frontend/src/components/advisor/LiveCalendar", () => ({
  LiveCalendar: () => <div data-testid="live-calendar" />,
}));
jest.mock("../../../frontend/src/components/advisor/LiveGmail", () => ({
  LiveGmail: () => <div data-testid="live-gmail" />,
}));
jest.mock("../../../frontend/src/components/advisor/CpdCard", () => ({
  CpdCard: () => <div data-testid="cpd-card" />,
}));

// ---------------------------------------------------------------------------
// Lazy import after mocks are set up
// ---------------------------------------------------------------------------
const AdvisorDashboard = require("../../../frontend/src/app/advisor/page").default;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdvisorPage — initial render", () => {
  it("renders without crashing", async () => {
    await act(async () => {
      render(<AdvisorDashboard />);
    });
  });

  it("shows the Morning Briefing label", async () => {
    await act(async () => {
      render(<AdvisorDashboard />);
    });
    expect(screen.getByText(/Morning Briefing/i)).toBeInTheDocument();
  });
});

describe("AdvisorPage — streaming flow", () => {
  it("calls login on mount", async () => {
    const { login } = require("../../../frontend/src/lib/api");
    await act(async () => {
      render(<AdvisorDashboard />);
    });
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("adv-1");
    });
  });

  it("calls generateBriefing after login", async () => {
    const { generateBriefing } = require("../../../frontend/src/lib/api");
    await act(async () => {
      render(<AdvisorDashboard />);
    });
    await waitFor(() => {
      expect(generateBriefing).toHaveBeenCalledWith("mock-jwt-token");
    });
  });

  it("renders streamed tokens into BriefingBand", async () => {
    await act(async () => {
      render(<AdvisorDashboard />);
    });

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());

    act(() => {
      MockEventSource.instance!.dispatchEvent("token", { text: "[CALENDAR]\n• 09:30 Lawrence Goh" });
    });

    await waitFor(() => {
      expect(screen.getByText(/Lawrence Goh/)).toBeInTheDocument();
    });
  });

  it("renders AgentTracePanel when jobId is set", async () => {
    await act(async () => {
      render(<AdvisorDashboard />);
    });

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());

    act(() => {
      MockEventSource.instance!.dispatchEvent("trace", {
        agent: "planner",
        status: "thinking",
        timestamp: "2026-06-19T00:00:00+00:00",
        summary: "Planning",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Planner")).toBeInTheDocument();
    });
  });

  it("shows error fallback when streaming fails", async () => {
    await act(async () => {
      render(<AdvisorDashboard />);
    });

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());

    act(() => {
      MockEventSource.instance!.dispatchEvent("error", {
        detail: "Briefing unavailable — please refresh",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Briefing unavailable/i)).toBeInTheDocument();
    });
  });
});
