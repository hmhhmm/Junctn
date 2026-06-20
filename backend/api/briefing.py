from __future__ import annotations
import asyncio
import json
from datetime import datetime, timezone

import google.generativeai as genai
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from starlette.responses import StreamingResponse

from backend.agents.pipeline import BriefingState, build_briefing_graph
from backend.config import settings
from backend.services.audit import append_audit
from backend.services.auth import get_current_advisor
from backend.services.data import get_advisor, get_client
from backend.services.job_store import Job, create_job, get_job, update_job

router = APIRouter(prefix="/briefing", tags=["briefing"])

genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-2.5-flash")


def _run_pipeline(job: Job, gmail_threads: list[dict] | None = None) -> None:
    job.status = "running"
    update_job(job)
    try:
        graph = build_briefing_graph()
        initial: BriefingState = {
            "advisor_id": job.advisor_id,
            "calendar_data": [],
            "client_memory": {},
            "followup_list": [],
            "gmail_threads": gmail_threads or [],
            "synthesised_text": "",
            "trace_events": [],
            "error": None,
        }
        result: BriefingState = graph.invoke(initial)

        # Stream tokens from synthesised_text into job so SSE can replay them
        for char in result["synthesised_text"]:
            job.tokens.append(char)

        job.trace_events = result["trace_events"]
        job.full_text = result["synthesised_text"]
        job.calendar_data = result.get("calendar_data", [])
        job.status = "complete"
        update_job(job)
    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
        update_job(job)


@router.post("/generate")
async def generate_briefing(
    request: Request,
    background_tasks: BackgroundTasks,
    advisor_id: str = Depends(get_current_advisor),
) -> dict:
    body: dict = {}
    try:
        body = await request.json()
    except Exception:
        pass
    gmail_threads: list[dict] = body.get("gmail_threads", [])
    job = create_job(advisor_id)
    background_tasks.add_task(_run_pipeline, job, gmail_threads)
    return {"job_id": job.id, "status": "pending"}


@router.get("/stream/{job_id}")
async def stream_briefing(job_id: str) -> StreamingResponse:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    def _format_event(event: str, data: str) -> str:
        return f"event: {event}\ndata: {data}\n\n"

    async def generator():
        sent_traces = 0
        sent_tokens = 0

        while True:
            # Yield any new trace events
            while sent_traces < len(job.trace_events):
                yield _format_event("trace", json.dumps(job.trace_events[sent_traces]))
                sent_traces += 1

            # Yield any new tokens
            while sent_tokens < len(job.tokens):
                yield _format_event("token", json.dumps({"text": job.tokens[sent_tokens]}))
                sent_tokens += 1

            if job.status == "complete":
                yield _format_event("done", json.dumps({"full_text": job.full_text, "calendar_data": job.calendar_data}))
                break

            if job.status == "error":
                yield _format_event("error", json.dumps({"detail": job.error or "Pipeline failed"}))
                break

            await asyncio.sleep(0.05)

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.post("/draft-followup")
async def draft_followup(
    body: dict,
    advisor_id: str = Depends(get_current_advisor),
) -> dict:
    client_id: str = body.get("client_id", "")
    client = get_client(client_id)
    if not client or client.advisor_id != advisor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    notes_text = "\n".join(
        f"[{n.date} {n.channel}] {n.summary}" for n in client.notes[-3:]
    ) or "No recent notes."

    prompt = (
        f"Write a short, warm follow-up message (100–150 words) from a financial advisor "
        f"to their client {client.name}. "
        f"Recent context:\n{notes_text}\n\n"
        f"Tone: professional, personal, not salesy. Address the most recent open question directly."
    )

    response = _model.generate_content(prompt)
    draft = response.text.strip()

    append_audit(
        advisor_id=advisor_id,
        feature="briefing",
        agent_step="draft_followup",
        input_token_count=response.usage_metadata.prompt_token_count,
        output_summary=f"Draft follow-up for {client.name}",
    )

    return {"draft": draft, "client_name": client.name}
