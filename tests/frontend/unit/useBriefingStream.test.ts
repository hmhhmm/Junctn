/**
 * Unit tests — useBriefingStream hook (src/hooks/useBriefingStream.ts)
 *
 * EventSource is not available in jsdom. We mock it with a class that lets
 * us fire events synchronously from within the test.
 */
import { renderHook, act } from "@testing-library/react";
import { useBriefingStream } from "../../../frontend/src/hooks/useBriefingStream";

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------

type Listener = (event: MessageEvent) => void;

class MockEventSource {
  static instance: MockEventSource | null = null;

  url: string;
  private listeners: Record<string, Listener[]> = {};
  onmessage: Listener | null = null;
  onerror: Listener | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instance = this;
  }

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  dispatchEvent(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    (this.listeners[type] ?? []).forEach((l) => l(event));
  }

  close() {
    this.readyState = 2;
  }
}

beforeEach(() => {
  MockEventSource.instance = null;
  (global as unknown as Record<string, unknown>).EventSource = MockEventSource;
});

afterEach(() => {
  delete (global as unknown as Record<string, unknown>).EventSource;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useBriefingStream — null jobId", () => {
  it("returns empty state when jobId is null", () => {
    const { result } = renderHook(() => useBriefingStream(null));
    expect(result.current.tokens).toBe("");
    expect(result.current.traceEvents).toEqual([]);
    expect(result.current.isDone).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not open an EventSource when jobId is null", () => {
    renderHook(() => useBriefingStream(null));
    expect(MockEventSource.instance).toBeNull();
  });
});

describe("useBriefingStream — with jobId", () => {
  it("opens an EventSource with the correct URL", () => {
    renderHook(() => useBriefingStream("job-abc"));
    expect(MockEventSource.instance?.url).toContain("job-abc");
  });

  it("appends tokens on token events", async () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    act(() => {
      MockEventSource.instance!.dispatchEvent("token", { text: "Hello" });
      MockEventSource.instance!.dispatchEvent("token", { text: " World" });
    });
    expect(result.current.tokens).toBe("Hello World");
  });

  it("accumulates trace events", () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    const tracePayload = {
      agent: "planner",
      status: "thinking",
      timestamp: "2026-06-19T00:00:00+00:00",
      summary: "Planning",
    };
    act(() => {
      MockEventSource.instance!.dispatchEvent("trace", tracePayload);
    });
    expect(result.current.traceEvents).toHaveLength(1);
    expect(result.current.traceEvents[0].agent).toBe("planner");
  });

  it("sets isDone to true on done event", () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    act(() => {
      MockEventSource.instance!.dispatchEvent("done", {});
    });
    expect(result.current.isDone).toBe(true);
  });

  it("sets error on error event", () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    act(() => {
      MockEventSource.instance!.dispatchEvent("error", { detail: "Pipeline failed" });
    });
    expect(result.current.error).toBe("Pipeline failed");
    expect(result.current.isDone).toBe(true);
  });

  it("falls back to default error message on malformed error event", () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    act(() => {
      // Dispatch with non-JSON data to trigger the catch branch
      const badEvent = { data: "not-json" } as MessageEvent;
      // Access the error listener directly
      (MockEventSource.instance as unknown as { listeners: Record<string, Listener[]> })
        .listeners["error"]?.forEach((l) => l(badEvent));
    });
    expect(result.current.error).toBe("Briefing unavailable — please refresh");
  });

  it("resets state when jobId changes", () => {
    const { result, rerender } = renderHook(
      ({ jobId }: { jobId: string }) => useBriefingStream(jobId),
      { initialProps: { jobId: "job-1" } }
    );
    act(() => {
      MockEventSource.instance!.dispatchEvent("token", { text: "First briefing" });
    });
    expect(result.current.tokens).toBe("First briefing");

    rerender({ jobId: "job-2" });
    expect(result.current.tokens).toBe("");
    expect(result.current.traceEvents).toEqual([]);
    expect(result.current.isDone).toBe(false);
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useBriefingStream("job-1"));
    const closeSpy = jest.spyOn(MockEventSource.instance!, "close");
    unmount();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("multiple token events accumulate in order", () => {
    const { result } = renderHook(() => useBriefingStream("job-1"));
    act(() => {
      for (const char of "[CALENDAR]\n• 09:30") {
        MockEventSource.instance!.dispatchEvent("token", { text: char });
      }
    });
    expect(result.current.tokens).toBe("[CALENDAR]\n• 09:30");
  });
});
