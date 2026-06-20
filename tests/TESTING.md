# JUNCTN — Feature 1 Test Suite

## Folder Structure

```
tests/
  conftest.py                    # Root: env setup + shared fixtures (token, client, store reset)
  mocks/
    mock_gemini.py               # MockGeminiResponse, MockGeminiStreamResponse, preset payloads
  backend/
    unit/
      test_jwt.py                # JWT creation + validation (services/auth.py)
      test_data_isolation.py     # Advisor/client/meeting data scoping (services/data.py)
      test_context_layer.py      # Context layer logic, health signals (services/context_layer.py)
      test_followup_logic.py     # 14-day rule, urgency ranking (agents/followup_agent.py)
      test_audit.py              # Audit log append + retrieval (services/audit.py)
    integration/
      test_pipeline.py           # Full LangGraph graph with Gemini mocked
    api/
      test_auth.py               # POST /auth/login black-box tests
      test_briefing_api.py       # POST /briefing/generate + GET /audit
      test_draft_followup.py     # POST /briefing/draft-followup
    streaming/
      test_sse_stream.py         # GET /briefing/stream/{job_id} — SSE event parsing
  frontend/
    unit/
      useBriefingStream.test.ts  # Hook: token/trace/done/error events, state reset
      BriefingBand.test.tsx      # Section parsing, border classes, skeleton, error, draft button
      AgentTracePanel.test.tsx   # Event rendering, labels, collapse toggle, spinner vs checkmark
    integration/
      AdvisorPage.test.tsx       # Full page: login → generate → stream → render
    jest.config.js
  smoke/
    test_gemini_ping.py          # REAL Gemini API call — skipped unless GEMINI_API_KEY is real
```

---

## Setup

### Backend

```bash
# From repo root
pip install -r requirements-test.txt
```

Set env vars (or use a `.env` file — pytest loads it via pydantic-settings):
```
GEMINI_API_KEY=fake-test-key-do-not-call-real-api
JWT_SECRET=any-secret-32-chars
JWT_ALGORITHM=HS256
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6379/0
```

> `GEMINI_API_KEY` can be any string for unit/integration/api/sse tests — the real API is
> never called. Only the smoke test uses a real key.

---

## Running Tests

### All backend tests (excluding smoke)
```bash
pytest tests/backend/ -v
```

### Unit tests only
```bash
pytest tests/backend/unit/ -v
```

### Integration tests (pipeline)
```bash
pytest tests/backend/integration/ -v
```

### API tests
```bash
pytest tests/backend/api/ -v
```

### SSE streaming tests
```bash
pytest tests/backend/streaming/ -v
```

### Smoke test (requires real GEMINI_API_KEY)
```bash
# Set your real key first, then ping the same model the app uses
export GEMINI_API_KEY=your-real-key-here
pytest tests/smoke/test_gemini_ping.py -v
```

---

### Frontend

```bash
cd frontend
npm install
# Install test dependencies if not already present:
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest jest-environment-jsdom
```

Run frontend tests from the repo root using the custom Jest config:
```bash
npx jest --config tests/frontend/jest.config.js --passWithNoTests
```

Or add a script to `frontend/package.json`:
```json
"scripts": {
  "test:integration": "jest --config ../tests/frontend/jest.config.js"
}
```

---

## Gemini Mock Strategy

All backend tests mock Gemini at the module-level `_model` object:

```python
from unittest.mock import patch
from tests.mocks.mock_gemini import make_client_memory_mock, make_synthesiser_mock

with patch("backend.agents.client_memory_agent._model") as mock_cm:
    mock_cm.generate_content.return_value = make_client_memory_mock()
    # ... run test
```

The `conftest.py` sets `GEMINI_API_KEY=fake-test-key-do-not-call-real-api` before
any backend module is imported, so `genai.configure()` does not fail at module load time.

`make_client_memory_mock()` returns a `MockGeminiResponse` with realistic JSON.
`make_synthesiser_mock()` returns a `MockGeminiStreamResponse` that is iterable and
has `.usage_metadata.prompt_token_count`.

---

## Key Invariants Verified

| Invariant | Test file |
|---|---|
| Advisor isolation (no cross-advisor data) | `test_data_isolation.py`, `test_pipeline.py`, `test_draft_followup.py` |
| Partner contact quarantine | `test_context_layer.py::test_partner_contact_info_not_in_threads` |
| No blocking LLM on request thread | `test_briefing_api.py::test_returns_immediately_without_waiting_for_llm` |
| Audit log on every LLM call | `test_audit.py`, `test_pipeline.py::TestAuditLogging`, `test_draft_followup.py` |
| SSE event ordering (trace before done) | `test_sse_stream.py::test_event_ordering_trace_before_done` |
| JWT expiry enforced | `test_jwt.py::test_expired_token_raises_401` |
| Gemini never called in unit/integration/api tests | `test_pipeline.py::TestGeminiMockIsCalled` |
