// AgentTracePanel has been replaced by the inline trace inside BriefingBand.
// This stub keeps any remaining imports from breaking during the transition.

import type { TraceEvent } from "@/hooks/useBriefingStream";

interface AgentTracePanelProps {
  traceEvents: TraceEvent[];
  isDone: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AgentTracePanel(_props: AgentTracePanelProps) {
  return null;
}
