from __future__ import annotations
import json
import uuid
from typing import Literal

JobStatus = Literal["pending", "running", "complete", "error"]

_JOB_TTL = 7200  # 2 hours
_JOB_PREFIX = "JOB:"

# In-memory L1 cache — hot path for SSE polling during active pipeline runs.
# Redis is the durable store; memory is the fast path.
_jobs: dict[str, "Job"] = {}


class Job:
    def __init__(self, advisor_id: str, job_id: str | None = None) -> None:
        self.id = job_id or str(uuid.uuid4())
        self.advisor_id = advisor_id
        self.status: JobStatus = "pending"
        self.trace_events: list[dict] = []
        self.tokens: list[str] = []
        self.full_text: str = ""
        self.calendar_data: list[dict] = []
        self.error: str | None = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "advisor_id": self.advisor_id,
            "status": self.status,
            "trace_events": self.trace_events,
            "tokens": self.tokens,
            "full_text": self.full_text,
            "calendar_data": self.calendar_data,
            "error": self.error,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Job":
        job = cls(data["advisor_id"], job_id=data["id"])
        job.status = data["status"]
        job.trace_events = data["trace_events"]
        job.tokens = data["tokens"]
        job.full_text = data["full_text"]
        job.calendar_data = data.get("calendar_data", [])
        job.error = data["error"]
        return job


def _write_redis(job: Job) -> None:
    try:
        from backend.services.redis_client import get_redis
        get_redis().setex(f"{_JOB_PREFIX}{job.id}", _JOB_TTL, json.dumps(job.to_dict()))
    except Exception:
        pass


def create_job(advisor_id: str) -> Job:
    job = Job(advisor_id)
    _jobs[job.id] = job
    _write_redis(job)
    return job


def get_job(job_id: str) -> Job | None:
    # L1: memory
    if job_id in _jobs:
        return _jobs[job_id]
    # L2: Redis (job created in a different process or after restart)
    try:
        from backend.services.redis_client import get_redis
        raw = get_redis().get(f"{_JOB_PREFIX}{job_id}")
        if raw:
            job = Job.from_dict(json.loads(raw))
            _jobs[job.id] = job  # warm the local cache
            return job
    except Exception:
        pass
    return None


def update_job(job: Job) -> None:
    """Persist job state after every mutation (status change, new tokens, etc.)."""
    _jobs[job.id] = job
    _write_redis(job)
