# JUNCTN — Feature 1: Morning Briefing Agent
## System Architecture: Multi-Agent Pipeline

---

## Overview

The Morning Briefing Agent is a stateful multi-agent pipeline built on **LangGraph**. When an advisor opens the dashboard, the pipeline fires as a background task, passes structured state through five sequential agent nodes, and streams the final briefing token-by-token to the frontend via Server-Sent Events (SSE).

The pipeline is advisor-scoped: every node receives `advisor_id` from the initial state and all data access is bounded by it. No cross-advisor data ever enters the shared state object.

---

## Pipeline Flow

```
Frontend (Next.js)
      │
      │  POST /briefing/generate  (JWT required)
      ▼
┌─────────────────────────────────────┐
│  FastAPI — Background Task          │
│                                     │
│  ┌──────────────────────────────┐   │
│  │      LangGraph Graph         │   │
│  │                              │   │
│  │  [planner]                   │   │
│  │      │                       │   │
│  │  [calendar_agent]            │   │
│  │      │                       │   │
│  │  [client_memory_agent] ──── Gemini 2.0 Flash
│  │      │                       │   │
│  │  [followup_agent]            │   │
│  │      │                       │   │
│  │  [synthesiser] ──────────── Gemini 2.0 Flash (stream)
│  │      │                       │   │
│  │     END                      │   │
│  └──────────────────────────────┘   │
│          │                          │
│    writes to Job store              │
└─────────────────────────────────────┘
      │
      │  GET /briefing/stream/{job_id}  (SSE)
      ▼
Frontend — useBriefingStream hook
      │
      ├── event: trace  →  AgentTracePanel
      ├── event: token  →  BriefingBand (streamed text)
      └── event: done   →  marks pipeline complete
```

---

## Shared State — `BriefingState`

Every agent node reads from and writes to a single typed state object. Nodes are pure functions: they receive state and return a new state dict. No node mutates state in place.

```python
class BriefingState(TypedDict):
    advisor_id:       str               # set at pipeline entry, never modified
    calendar_data:    list[dict]        # written by calendar_agent
    client_memory:    dict[str, dict]   # written by client_memory_agent
    followup_list:    list[dict]        # written by followup_agent
    synthesised_text: str               # written by synthesiser
    trace_events:     list[dict]        # appended by every node
    error:            Optional[str]     # set on pipeline failure
```

---

## Agent Nodes

### 1. Planner
**File:** `backend/agents/pipeline.py`

The entry point of the graph. Does not call any external service. Emits the opening trace event so the frontend can show "pipeline started" immediately.

```
Input:  advisor_id (from job)
Output: trace_events += [{agent: "planner", status: "thinking", ...}]
```

**Why it exists:** Gives the frontend a visible first event within milliseconds of the job starting, before any I/O happens. Judges see the agent trace light up instantly.

---

### 2. Calendar Agent
**File:** `backend/agents/calendar_agent.py`

Pure data retrieval — no LLM. Reads today's meetings for the advisor from the seeded data layer. Flags meetings that have no briefing notes attached (`flag: {kind: "missing", text: "..."}`).

```
Input:  advisor_id
Output: calendar_data = [
  {
    id, title, time, channel, client_id,
    flag?: {kind: "missing" | "conflict", text: str}
  }
]
        trace_events += [calendar_agent complete]
```

**Data source:** `backend/services/data.py` — `get_meetings_for_advisor(advisor_id)`

---

### 3. Client Memory Agent
**File:** `backend/agents/client_memory_agent.py`  
**LLM:** Gemini 2.0 Flash

The CRM-as-agent reasoning step. Takes only the clients who appear in today's calendar, pulls their context from the Advisor Context Layer (relationship health, open threads, recent notes), and asks Gemini to synthesise a structured assessment for each.

```
Input:  calendar_data (to identify meeting clients)
        Advisor Context Layer → get_context(advisor_id)
Output: client_memory = {
  "<client_id>": {
    open_threads:  list[str],   # unresolved questions or promises
    health:        str,         # "strong" | "needs-attention" | "at-risk"
    talking_point: str          # one sentence to raise in today's meeting
  }
}
        trace_events += [client_memory_agent complete]
        audit log entry (token counts recorded)
```

**Prompt strategy:** Structured client context fed as user message; JSON-only system instruction. Response parsed directly — no markdown stripping needed.

**Partner contact quarantine:** Only client notes and relationship signals enter the prompt. Partner `contact_info` fields are never included.

---

### 4. Follow-up Agent
**File:** `backend/agents/followup_agent.py`  
**LLM:** None — pure logic

Scans all active clients for the advisor. Flags any client where:
- `days_since_last_contact > 14`, or
- A recent note contains unanswered-signal keywords (`"asked"`, `"replied"`, `"awaiting your response"`, etc.)

Results are ranked: unanswered signals and >30 days → `high`; >14 days → `medium`.

```
Input:  advisor_id
Output: followup_list = [
  {
    client_id, client_name,
    days_overdue: int,
    reason: str,
    urgency: "high" | "medium" | "low"
  }
]   sorted by urgency desc, days_overdue desc
        trace_events += [followup_agent complete]
```

---

### 5. Synthesiser
**File:** `backend/agents/synthesiser.py`  
**LLM:** Gemini 2.0 Flash (streaming)

Receives all prior agent outputs and produces the final structured briefing. Uses Gemini's streaming API so tokens are written to the job store as they arrive — the frontend renders them progressively.

```
Input:  calendar_data, client_memory, followup_list
Output: synthesised_text  (streamed, stored in job.tokens char-by-char)
        trace_events += [synthesiser complete]
        audit log entry (token counts recorded)
```

**Output format** — three mandatory section markers on their own line:
```
[CALENDAR]
• 09:00 — John Tan (video) — quarterly review [Missing meeting notes]
• 14:30 — Sarah Lim (in-person) — estate planning

[FOLLOWUPS]
• John Tan — last contacted 18 days ago. Urgency: medium.
• Wei Chen — unanswered query re: trust structure. Urgency: high.

[LD]
Complete Module 14 (Trust Structures) — directly relevant to 3 active clients this week.
```

The frontend `parseSections()` splits on these markers and renders each section with a distinct left-border colour (teal / amber / purple).

---

## Job Store & Streaming Transport

**File:** `backend/services/job_store.py`

The pipeline runs as a FastAPI `BackgroundTask`. A `Job` object is created before the task starts and updated in-place as the pipeline runs.

```
Job {
  id:           UUID (returned to frontend immediately)
  advisor_id:   str
  status:       "pending" | "running" | "complete" | "error"
  tokens:       list[str]        # synthesiser appends chars here
  trace_events: list[dict]       # each agent appends on completion
  full_text:    str              # final assembled briefing
  error:        str | None
}
```

**SSE endpoint** (`GET /briefing/stream/{job_id}`) polls the job store every 50 ms and yields new events as they appear:

| SSE event | Payload | Consumer |
|---|---|---|
| `trace` | `{agent, status, timestamp, summary}` | `AgentTracePanel` |
| `token` | `{text: "<char>"}` | `BriefingBand` (appended to display) |
| `done` | `{full_text}` | closes EventSource |
| `error` | `{detail}` | BriefingBand shows fallback message |

---

## Frontend Consumption

**Hook:** `frontend/src/hooks/useBriefingStream.ts`

`useBriefingStream(jobId)` opens an `EventSource`, listens for the four event types, and returns:

```ts
{
  tokens:      string       // accumulated briefing text
  traceEvents: TraceEvent[] // one entry per agent node
  isDone:      boolean
  error:       string | null
}
```

**Components:**

| Component | Consumes | Renders |
|---|---|---|
| `BriefingBand` | `tokens`, `isStreaming` | Parsed sections with colour-coded left borders; streaming cursor; draft follow-up modal |
| `AgentTracePanel` | `traceEvents`, `isDone` | Collapsible right sidebar; monospace log; spinner → green check per agent |

---

## Audit Trail

Every LLM call (client_memory_agent, synthesiser, draft_followup) writes to the audit log:

```
{
  timestamp:        ISO 8601
  advisor_id:       str
  feature:          "briefing"
  agent_step:       "client_memory_agent" | "synthesiser" | "draft_followup"
  input_token_count: int
  output_summary:   str
}
```

Readable at `GET /audit` (JWT required). Satisfies the JUNCTN invariant: every LLM call must produce an audit log entry.

---

## Security Boundaries

| Boundary | Enforcement |
|---|---|
| Advisor isolation | `POST /briefing/generate` calls `get_current_advisor` (JWT dependency) before creating the job. `advisor_id` is set once at job creation and never overridden by any agent node. |
| Partner contact quarantine | `client_memory_agent` builds prompts from `context_layer` data only — `partner.contact_info` fields are not present in that schema. |
| No blocking LLM calls | The entire pipeline runs inside `BackgroundTasks.add_task()`. The `/generate` route returns `{job_id}` in under 5 ms. |
| Cross-advisor read prevention | `get_context(advisor_id)` and `get_clients_for_advisor(advisor_id)` filter by `advisor_id` at the data layer — no route parameter can override this. |

---

## Technology Reference

| Component | Technology |
|---|---|
| Agent orchestration | LangGraph `StateGraph` (stateful directed graph) |
| LLM | Gemini 2.0 Flash via `google-generativeai` |
| Streaming transport | `sse-starlette` (Server-Sent Events) |
| Background execution | FastAPI `BackgroundTasks` |
| Job store | In-memory `dict[str, Job]` (sufficient for hackathon; swap for Redis in production) |
| Auth | JWT — `python-jose`, `advisor_id` claim validated on every route |
| Frontend hook | `EventSource` API — native browser SSE client |

---

*JUNCTN · ImagineHack 2026 · Feature 1 Architecture · Internal use only*
