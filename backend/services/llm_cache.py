"""
LLM response cache for CourseIntel.

Architecture
------------
Current:  asyncio.Lock-protected in-memory dict with SHA-256 keying and TTL eviction.
Upgrade:  Drop-in Redis replacement — swap get/set to HGETALL/HSET with EXPIRE.
          Key structure stays identical: sha256(model+system+user) → serialized str.

Design decisions
----------------
* SHA-256 key: collision-resistant, fixed-length, provider/model included so a
  prompt cached against gpt-4o-mini won't be served for gpt-4o.
* TTL of 1 hour: LLM responses for a given syllabus are stable within a session.
  Reputation/resource data may drift over days but not within a bootstrap run.
* Capacity cap (_MAX_ENTRIES = 2000): prevents unbounded memory growth.  Evicts
  the oldest entry by creation timestamp (LRU would add O(n) complexity for
  minimal benefit at this scale).
* Separate hit/miss counters: surfaced via GET /health/cache so operators can
  measure real-world cache effectiveness.
* No negative caching: a failed LLM call is not stored; the next attempt retries.

Redis upgrade path
------------------
Replace get() / set() bodies with:
    import redis.asyncio as aioredis
    _redis = aioredis.from_url(os.environ["REDIS_URL"])

    async def get(key):
        raw = await _redis.get(f"llmcache:{key}")
        return raw.decode() if raw else None

    async def set(key, value, ttl=_DEFAULT_TTL):
        await _redis.setex(f"llmcache:{key}", ttl, value)

The rest of this module (stats, invalidate, clear) needs parallel Redis commands.
"""
import asyncio
import hashlib
import json
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
_DEFAULT_TTL = 3600       # seconds — 1 hour
_MAX_ENTRIES = 2000       # hard cap; oldest entry evicted when exceeded

# ── In-memory store ───────────────────────────────────────────────────────────
_lock = asyncio.Lock()
_store: dict[str, dict] = {}   # key → {value, created_at, expires_at}
_hits = 0
_misses = 0


# ── Public API ────────────────────────────────────────────────────────────────

def make_key(model: str, system: str, user: str) -> str:
    """
    Deterministic cache key: SHA-256 of (model, system_prompt, user_prompt).

    Including the model ensures that identical prompts sent to different model
    tiers (HAIKU vs OPUS) never share a cached response.
    """
    payload = json.dumps({"model": model, "system": system, "user": user}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


async def get(key: str) -> Optional[str]:
    """Return cached value for key, or None on miss / expiry."""
    global _hits, _misses
    async with _lock:
        entry = _store.get(key)
        if entry is None:
            _misses += 1
            logger.debug("Cache MISS key=%s…", key[:8])
            return None
        if time.time() > entry["expires_at"]:
            del _store[key]
            _misses += 1
            logger.debug("Cache EXPIRED key=%s…", key[:8])
            return None
        _hits += 1
        logger.debug("Cache HIT key=%s…", key[:8])
        return entry["value"]


async def set(key: str, value: str, ttl: int = _DEFAULT_TTL) -> None:
    """Store value under key with a TTL.  Evicts oldest entry if at capacity."""
    async with _lock:
        if len(_store) >= _MAX_ENTRIES:
            oldest = min(_store, key=lambda k: _store[k]["created_at"])
            del _store[oldest]
            logger.debug("Cache evicted oldest entry (cap=%d)", _MAX_ENTRIES)
        now = time.time()
        _store[key] = {
            "value": value,
            "created_at": now,
            "expires_at": now + ttl,
        }


async def invalidate(key: str) -> bool:
    """Remove a single entry by key.  Returns True if it existed."""
    async with _lock:
        if key in _store:
            del _store[key]
            return True
        return False


async def clear() -> int:
    """Flush the entire cache.  Returns the number of entries removed."""
    async with _lock:
        count = len(_store)
        _store.clear()
        logger.info("Cache cleared (%d entries removed)", count)
        return count


def stats() -> dict:
    """
    Return cache performance metrics.

    hit_rate approaching 1.0 means most agent calls are served from cache.
    A hit_rate near 0 during bootstrap is expected — first call per course is
    always a miss.  Repeated bootstraps for the same course should show >80%.
    """
    total = _hits + _misses
    # Count live (non-expired) entries without acquiring lock — approximate is fine
    now = time.time()
    live = sum(1 for e in _store.values() if e["expires_at"] > now)
    return {
        "hits": _hits,
        "misses": _misses,
        "total_requests": total,
        "hit_rate": round(_hits / total, 4) if total else 0.0,
        "cached_entries": live,
        "total_entries": len(_store),
        "max_entries": _MAX_ENTRIES,
        "ttl_seconds": _DEFAULT_TTL,
        "backend": "in-memory",
        "upgrade_path": "Redis SETEX — see module docstring",
    }
