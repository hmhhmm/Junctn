# Feature 1: Morning Briefing Agent

**Goal:** FastAPI + LangGraph pipeline that streams a structured advisor briefing into the frontend with a live agent trace panel.

**Stack:** FastAPI, LangGraph, Gemini 2.0 Flash (SSE streaming), Next.js 14, JWT auth, in-memory seeded data.

---

## Phase 1 — Backend Foundation

### Task 1: FastAPI scaffold ✅
`backend/requirements.txt`, `backend/.env.example`, `backend/config.py`, `backend/routes/__init__.py`, `backend/main.py`

**requirements.txt** — fully pinned:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-jose[cryptography]==3.3.0
pydantic==2.13.4
pydantic-settings==2.14.1
langgraph==0.2.28
google-generativeai==0.8.3
python-dotenv==1.0.1
sse-starlette==2.1.0
httpx==0.27.0
redis==5.0.4
sqlalchemy==2.0.30
asyncpg==0.30.0
alembic==1.13.1
```

**.env.example** — all keys, no secret values:
```
GEMINI_API_KEY=
JWT_SECRET=
JWT_ALGORITHM=HS256
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/junctn
REDIS_URL=redis://localhost:6379/0
```

**config.py** — single source for all env reads (CLAUDE.md: no scattered os.getenv):
```python
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    gemini_api_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    cors_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/junctn"
    redis_url: str = "redis://localhost:6379/0"
    class Config:
        env_file = ".env"
settings = Settings()
```

**main.py** — CORS reads from `settings.cors_origin`; includes `Authorization` in allowed headers (required for JWT to reach any route):
```python
app.add_middleware(CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_methods=["*"],
    allow_headers=["*", "Authorization"])
```
`GET /health` returns `{"status": "ok", "version": "1.0.0"}`.

**Run:** `uvicorn backend.main:app --reload --port 8000` (from repo root)

### Task 2: Seeded data layer ✅
`backend/services/data.py`
- Mirror frontend `data.ts`: 6 advisors, 30 clients, 5 meetings for adv-1
- Helpers: `get_advisor(id)`, `get_clients_for_advisor(id)`, `get_meetings_for_advisor(id)`

### Task 3: Context layer + audit log ✅
`backend/services/context_layer.py`, `backend/services/audit.py`
- `get_context(advisor_id)` → per-client dict with relationship health + open threads
- `append_audit(advisor_id, feature, agent_step, input_tokens, output_summary)`
- `GET /audit` route returning audit list

### Task 4: JWT auth + login route ✅
`backend/services/auth.py`, `backend/api/auth.py`
- `create_token(advisor_id)`, `get_current_advisor` FastAPI dependency
- `POST /auth/login` — accepts `{advisor_id, password: "demo"}`, returns JWT + name

### Task 5: Auth-guarded briefing stubs ✅
`backend/api/briefing.py`
- `POST /briefing/generate` and `GET /briefing/stream/{job_id}` — both require JWT, return `{"status": "not_implemented"}` for now

---

## Phase 2 — Agent Pipeline

### Task 6: LangGraph state + graph skeleton ✅
`backend/agents/pipeline.py`
- `BriefingState`: `advisor_id`, `calendar_data`, `client_memory`, `followup_list`, `synthesised_text`, `trace_events`, `error`
- Graph: planner → calendar_agent → client_memory_agent → followup_agent → synthesiser
- `build_briefing_graph()` exported; all nodes are no-ops until wired

### Task 7: Calendar subagent ✅
`backend/agents/calendar_agent.py`
- Reads seeded meetings, stores structured list in `state["calendar_data"]`
- Appends trace event `{agent, status, timestamp, summary}`

### Task 8: Client memory subagent (LLM) ✅
`backend/agents/client_memory_agent.py`
- Calls Gemini 2.0 Flash with client notes + context layer
- Returns `{client_id: {open_threads, health, talking_point}}` in `state["client_memory"]`
- `append_audit(...)` with token counts

### Task 9: Follow-up subagent ✅
`backend/agents/followup_agent.py`
- Pure logic: clients with `lastContact` > 14 days or inbound unanswered note
- Returns ranked list `{client_id, client_name, days_overdue, reason, urgency}` in `state["followup_list"]`

### Task 10: Planner node ✅
`backend/agents/pipeline.py` (update)
- Emits opening trace event `{agent: "planner", status: "thinking", summary: "..."}`
- Runs first in the graph

### Task 11: Synthesiser node (streaming) ✅
`backend/agents/synthesiser.py`
- Calls Gemini 2.0 Flash with `stream=True`
- Output uses section markers `[CALENDAR]`, `[FOLLOWUPS]`, `[LD]`
- Accumulates into `state["synthesised_text"]`; appends trace + audit entry

---

## Phase 3 — Streaming API + Frontend

### Task 12: Job store + generate endpoint ✅
`backend/services/job_store.py`, `backend/api/briefing.py`
- In-memory `jobs: dict[str, Job]` keyed by UUID
- `POST /briefing/generate` → creates job, runs pipeline as `BackgroundTask`, returns `{job_id}` immediately

### Task 13: SSE stream endpoint ✅
`backend/api/briefing.py`
- `GET /briefing/stream/{job_id}` via `sse-starlette`
- Yields: `event: trace`, `event: token`, `event: done`, `event: error`

### Task 14: Frontend API client + SSE hook ✅
`frontend/src/lib/api.ts`, `frontend/src/hooks/useBriefingStream.ts`
- `login()`, `generateBriefing()` typed fetch wrappers
- `useBriefingStream(jobId)` hook → `{tokens, traceEvents, isDone, error}`

### Task 15: BriefingBand + AgentTracePanel ✅
`frontend/src/components/advisor/BriefingBand.tsx`, `frontend/src/components/advisor/AgentTracePanel.tsx`
- BriefingBand: parse `[CALENDAR]`/`[FOLLOWUPS]`/`[LD]` markers → teal/amber/purple left borders, streaming cursor
- AgentTracePanel: collapsible right sidebar, monospace, green checkmark on complete

### Task 16: Advisor page wiring ✅
`frontend/src/app/advisor/page.tsx`, `frontend/src/lib/store.tsx`
- On mount: silent login → `generateBriefing` → `useBriefingStream`
- Pass `tokens`/`isStreaming` to BriefingBand; render AgentTracePanel with `traceEvents`

---

## Phase 4 — Polish

### Task 17: Draft follow-up button ✅
`backend/api/briefing.py`, `frontend/src/components/advisor/BriefingBand.tsx`
- `POST /briefing/draft-followup` → Gemini generates 100–150 word personalised message
- "Draft message" button per follow-up nudge; shows result inline

### Task 18: Error handling + isolation smoke test ✅
`backend/api/briefing.py`, `frontend/src/hooks/useBriefingStream.ts`
- `event: error` → fallback message in BriefingBand
- Skeleton loader until first token arrives
- Verify adv-1 and adv-2 briefings never cross-reference each other's clients
