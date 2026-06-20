from __future__ import annotations
import redis
from backend.config import settings

# Shared synchronous Redis client — connection pool managed by redis-py.
# decode_responses=True so all values come back as str, not bytes.
_pool = redis.ConnectionPool.from_url(settings.redis_url, decode_responses=True)


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=_pool)
