from __future__ import annotations
import uuid
from typing import Literal

JobStatus = Literal["pending", "running", "complete", "error"]


class Job:
    def __init__(self, advisor_id: str) -> None:
        self.id = str(uuid.uuid4())
        self.advisor_id = advisor_id
        self.status: JobStatus = "pending"
        self.trace_events: list[dict] = []
        self.tokens: list[str] = []
        self.full_text: str = ""
        self.error: str | None = None


_jobs: dict[str, Job] = {}


def create_job(advisor_id: str) -> Job:
    job = Job(advisor_id)
    _jobs[job.id] = job
    return job


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)
