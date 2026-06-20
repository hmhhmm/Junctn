"""
SSE streaming tests — GET /briefing/stream/{job_id}

Strategy: manually inject pre-built Job objects into the job store so we can
control status and content without waiting for the real pipeline.
The SSE generator polls every 50 ms and exits when status is "complete" or "error".
"""
import json
import asyncio
import pytest

from backend.services.job_store import Job, _jobs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_sse(raw: str) -> list[dict]:
    """Parse raw SSE text into a list of {event, data} dicts."""
    events: list[dict] = []
    current: dict = {}
    for line in raw.splitlines():
        if line.startswith("event:"):
            current["event"] = line[len("event:"):].strip()
        elif line.startswith("data:"):
            current["data"] = line[len("data:"):].strip()
        elif line == "" and current:
            events.append(current)
            current = {}
    if current:
        events.append(current)
    return events


def _make_complete_job(advisor_id: str = "adv-1") -> Job:
    """Return a Job already in 'complete' state with tokens and trace events."""
    job = Job(advisor_id)
    job.trace_events = [
        {"agent": "planner", "status": "thinking", "timestamp": "2026-06-19T00:00:00+00:00", "summary": "Planning"},
        {"agent": "calendar_agent", "status": "complete", "timestamp": "2026-06-19T00:00:01+00:00", "summary": "5 meetings found"},
        {"agent": "synthesiser", "status": "complete", "timestamp": "2026-06-19T00:00:02+00:00", "summary": "Briefing generated"},
    ]
    job.tokens = list("[CALENDAR]\n• 09:30 Lawrence Goh")
    job.full_text = "[CALENDAR]\n• 09:30 Lawrence Goh"
    job.status = "complete"
    return job


def _make_error_job(advisor_id: str = "adv-1") -> Job:
    job = Job(advisor_id)
    job.status = "error"
    job.error = "Gemini service unavailable"
    return job


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestSSEJobNotFound:
    async def test_unknown_job_id_returns_404(self, async_client):
        resp = await async_client.get("/briefing/stream/non-existent-job-id")
        assert resp.status_code == 404

    async def test_404_detail_mentions_job(self, async_client):
        resp = await async_client.get("/briefing/stream/non-existent-job-id")
        assert "Job not found" in resp.json()["detail"]


class TestSSECompleteJob:
    async def test_200_status_on_valid_job(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        assert resp.status_code == 200

    async def test_content_type_is_event_stream(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        assert "text/event-stream" in resp.headers.get("content-type", "")

    async def test_done_event_present(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        event_types = [e.get("event") for e in events]
        assert "done" in event_types

    async def test_trace_events_emitted(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        trace_events = [e for e in events if e.get("event") == "trace"]
        assert len(trace_events) == len(job.trace_events)

    async def test_token_events_emitted(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        token_events = [e for e in events if e.get("event") == "token"]
        assert len(token_events) == len(job.tokens)

    async def test_token_events_reconstruct_full_text(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        token_events = [e for e in events if e.get("event") == "token"]
        reconstructed = "".join(
            json.loads(e["data"])["text"] for e in token_events
        )
        assert reconstructed == job.full_text

    async def test_trace_event_data_is_valid_json(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        for evt in events:
            if evt.get("event") == "trace":
                parsed = json.loads(evt["data"])
                assert "agent" in parsed
                assert "status" in parsed

    async def test_done_event_contains_full_text(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        done_event = next(e for e in events if e.get("event") == "done")
        payload = json.loads(done_event["data"])
        assert payload["full_text"] == job.full_text

    async def test_event_ordering_trace_before_done(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        event_types = [e.get("event") for e in events]
        done_idx = event_types.index("done")
        trace_indices = [i for i, t in enumerate(event_types) if t == "trace"]
        assert all(i < done_idx for i in trace_indices)

    async def test_no_error_event_on_success(self, async_client):
        job = _make_complete_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        event_types = [e.get("event") for e in events]
        assert "error" not in event_types


class TestSSEErrorJob:
    async def test_error_event_emitted_on_failed_job(self, async_client):
        job = _make_error_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        event_types = [e.get("event") for e in events]
        assert "error" in event_types

    async def test_error_event_contains_detail(self, async_client):
        job = _make_error_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        error_event = next(e for e in events if e.get("event") == "error")
        payload = json.loads(error_event["data"])
        assert "detail" in payload
        assert payload["detail"] == "Gemini service unavailable"

    async def test_no_done_event_on_error(self, async_client):
        job = _make_error_job()
        _jobs[job.id] = job
        resp = await async_client.get(f"/briefing/stream/{job.id}")
        events = _parse_sse(resp.text)
        event_types = [e.get("event") for e in events]
        assert "done" not in event_types


class TestSSEIsolation:
    async def test_two_jobs_yield_independent_events(self, async_client):
        job1 = Job("adv-1")
        job1.tokens = list("BRIEFING_A")
        job1.full_text = "BRIEFING_A"
        job1.status = "complete"
        _jobs[job1.id] = job1

        job2 = Job("adv-2")
        job2.tokens = list("BRIEFING_B")
        job2.full_text = "BRIEFING_B"
        job2.status = "complete"
        _jobs[job2.id] = job2

        r1 = await async_client.get(f"/briefing/stream/{job1.id}")
        r2 = await async_client.get(f"/briefing/stream/{job2.id}")

        e1 = _parse_sse(r1.text)
        e2 = _parse_sse(r2.text)

        done1 = next(e for e in e1 if e.get("event") == "done")
        done2 = next(e for e in e2 if e.get("event") == "done")

        assert json.loads(done1["data"])["full_text"] == "BRIEFING_A"
        assert json.loads(done2["data"])["full_text"] == "BRIEFING_B"

    async def test_stream_for_nonexistent_job_does_not_affect_other_jobs(self, async_client):
        good_job = _make_complete_job()
        _jobs[good_job.id] = good_job

        bad_resp = await async_client.get("/briefing/stream/does-not-exist")
        assert bad_resp.status_code == 404

        good_resp = await async_client.get(f"/briefing/stream/{good_job.id}")
        assert good_resp.status_code == 200
