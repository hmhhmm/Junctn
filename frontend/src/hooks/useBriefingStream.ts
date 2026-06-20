"use client";

import { useEffect, useRef, useState } from "react";
import { getBriefingStreamUrl } from "@/lib/api";

export interface TraceEvent {
  agent: string;
  status: string;
  timestamp: string;
  summary: string;
}

interface BriefingStreamState {
  tokens: string;
  traceEvents: TraceEvent[];
  isDone: boolean;
  error: string | null;
}

export function useBriefingStream(jobId: string | null): BriefingStreamState {
  const [tokens, setTokens] = useState("");
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Reset state for new job
    setTokens("");
    setTraceEvents([]);
    setIsDone(false);
    setError(null);

    const source = new EventSource(getBriefingStreamUrl(jobId));
    sourceRef.current = source;

    source.addEventListener("token", (e) => {
      const { text } = JSON.parse(e.data);
      setTokens((prev) => prev + text);
    });

    source.addEventListener("trace", (e) => {
      const event: TraceEvent = JSON.parse(e.data);
      setTraceEvents((prev) => [...prev, event]);
    });

    source.addEventListener("done", () => {
      setIsDone(true);
      source.close();
    });

    source.addEventListener("error", (e) => {
      try {
        const { detail } = JSON.parse((e as MessageEvent).data ?? "{}");
        setError(detail ?? "Briefing unavailable — please refresh");
      } catch {
        setError("Briefing unavailable — please refresh");
      }
      setIsDone(true);
      source.close();
    });

    return () => {
      source.close();
    };
  }, [jobId]);

  return { tokens, traceEvents, isDone, error };
}
