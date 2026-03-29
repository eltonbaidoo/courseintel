"""
In-memory job store for async bootstrap tasks.

Provides create / update / get / reap operations with an asyncio.Lock
for safe concurrent access.  Upgrade path: replace _store with
Redis HSET calls for horizontal scaling across multiple workers.

Job lifecycle:
    pending → running → completed
                      → failed
                      → timed_out  (set by reap_stale_jobs if still
                                    running after STALE_THRESHOLD_SECONDS)
"""
import asyncio
import time
import uuid
from typing import Any, Dict, Literal, Optional, TypedDict

JobStatus = Literal["pending", "running", "completed", "failed", "timed_out"]

# Jobs that stay "running" longer than this are considered hung
STALE_THRESHOLD_SECONDS: int = 300  # 5 minutes

# Completed / failed / timed_out records are evicted after this
JOB_TTL_SECONDS: int = 86_400  # 24 hours


class JobRecord(TypedDict):
    job_id: str
    status: JobStatus
    created_at: float
    updated_at: float
    result: Optional[Any]
    error: Optional[str]
    meta: Dict[str, Any]


# --------------------------------------------------------------------------- #
# Internal store — keyed by job_id                                            #
# --------------------------------------------------------------------------- #
_store: Dict[str, JobRecord] = {}
_lock: asyncio.Lock = asyncio.Lock()


# --------------------------------------------------------------------------- #
# Public API                                                                  #
# --------------------------------------------------------------------------- #

async def create_job(meta: Dict[str, Any] | None = None) -> str:
    """Create a new job record and return its ID."""
    job_id = str(uuid.uuid4())
    now = time.time()
    async with _lock:
        _store[job_id] = JobRecord(
            job_id=job_id,
            status="pending",
            created_at=now,
            updated_at=now,
            result=None,
            error=None,
            meta=meta or {},
        )
    return job_id


async def update_job(
    job_id: str,
    *,
    status: JobStatus,
    result: Any = None,
    error: str | None = None,
) -> None:
    """Update the status (and optionally result / error) of an existing job."""
    async with _lock:
        if job_id not in _store:
            return
        _store[job_id]["status"] = status
        _store[job_id]["updated_at"] = time.time()
        if result is not None:
            _store[job_id]["result"] = result
        if error is not None:
            _store[job_id]["error"] = error


async def get_job(job_id: str) -> Optional[JobRecord]:
    """Return the job record, or None if not found."""
    async with _lock:
        record = _store.get(job_id)
        # Return a shallow copy so callers can't mutate store internals
        return dict(record) if record else None  # type: ignore[return-value]


async def reap_stale_jobs() -> int:
    """
    Scan the store and:
      - Mark running jobs silent for > STALE_THRESHOLD_SECONDS as 'timed_out'
      - Evict terminal jobs (completed/failed/timed_out) older than JOB_TTL_SECONDS

    Returns the count of jobs newly marked timed_out.
    Intended to be called periodically (e.g. every 60 s via an asyncio task).
    """
    now = time.time()
    reaped = 0
    to_evict: list[str] = []

    async with _lock:
        for job_id, job in _store.items():
            age = now - job["created_at"]
            idle = now - job["updated_at"]

            if job["status"] == "running" and idle > STALE_THRESHOLD_SECONDS:
                job["status"] = "timed_out"
                job["updated_at"] = now
                reaped += 1

            elif job["status"] in ("completed", "failed", "timed_out") and age > JOB_TTL_SECONDS:
                to_evict.append(job_id)

        for job_id in to_evict:
            del _store[job_id]

    return reaped


def store_size() -> int:
    """Return the current number of tracked jobs (for health/metrics)."""
    return len(_store)
