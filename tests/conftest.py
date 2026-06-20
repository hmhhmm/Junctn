"""
Root conftest — sets environment variables BEFORE any backend module is imported
so that pydantic-settings can construct Settings() without a real GEMINI_API_KEY.
"""
import os

# Must happen before any `from backend.*` import in any test file.
os.environ.setdefault("GEMINI_API_KEY", "fake-test-key-do-not-call-real-api")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-testing-only-32chars!")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("CORS_ORIGIN", "http://localhost:3000")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/junctn")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

import pytest
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.services import audit as audit_service
from backend.services import job_store as job_store_module
from backend.services.auth import create_token


# ---------------------------------------------------------------------------
# Token fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def adv1_token() -> str:
    return create_token("adv-1")


@pytest.fixture
def adv2_token() -> str:
    return create_token("adv-2")


@pytest.fixture
def adv1_auth_header(adv1_token) -> dict:
    return {"Authorization": f"Bearer {adv1_token}"}


@pytest.fixture
def adv2_auth_header(adv2_token) -> dict:
    return {"Authorization": f"Bearer {adv2_token}"}


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


# ---------------------------------------------------------------------------
# State reset — keep tests independent of shared in-memory stores
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_audit_log():
    """Clear the in-memory audit log before and after every test."""
    audit_service._log.clear()
    yield
    audit_service._log.clear()


@pytest.fixture(autouse=True)
def reset_job_store():
    """Clear the in-memory job store before and after every test."""
    job_store_module._jobs.clear()
    yield
    job_store_module._jobs.clear()
