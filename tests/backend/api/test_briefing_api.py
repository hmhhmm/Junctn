"""API tests — POST /briefing/generate and GET /audit (black-box)."""
import pytest
from unittest.mock import patch

from tests.mocks.mock_gemini import make_client_memory_mock, make_synthesiser_mock


@pytest.fixture
def mock_gemini_for_api():
    with (
        patch("backend.agents.client_memory_agent._model") as mock_cm,
        patch("backend.agents.synthesiser._model") as mock_synth,
    ):
        mock_cm.generate_content.return_value = make_client_memory_mock()
        mock_synth.generate_content.return_value = make_synthesiser_mock()
        yield


class TestGenerateEndpoint:
    async def test_requires_auth_header(self, async_client):
        resp = await async_client.post("/briefing/generate")
        assert resp.status_code == 401

    async def test_invalid_token_returns_401(self, async_client):
        resp = await async_client.post(
            "/briefing/generate",
            headers={"Authorization": "Bearer bad-token"},
        )
        assert resp.status_code == 401

    async def test_valid_token_returns_200(self, async_client, adv1_auth_header, mock_gemini_for_api):
        resp = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        assert resp.status_code == 200

    async def test_returns_job_id(self, async_client, adv1_auth_header, mock_gemini_for_api):
        resp = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        body = resp.json()
        assert "job_id" in body
        assert isinstance(body["job_id"], str)
        assert len(body["job_id"]) > 10

    async def test_returns_pending_status(self, async_client, adv1_auth_header, mock_gemini_for_api):
        resp = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        assert resp.json()["status"] == "pending"

    async def test_two_calls_return_different_job_ids(self, async_client, adv1_auth_header, mock_gemini_for_api):
        r1 = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        r2 = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        assert r1.json()["job_id"] != r2.json()["job_id"]

    async def test_returns_immediately_without_waiting_for_llm(
        self, async_client, adv1_auth_header
    ):
        # This test does NOT mock Gemini — it proves the endpoint returns before
        # the background task tries to call the LLM. The job_id is returned
        # synchronously; the background task hasn't run yet.
        import time
        start = time.monotonic()
        resp = await async_client.post("/briefing/generate", headers=adv1_auth_header)
        elapsed = time.monotonic() - start
        assert resp.status_code == 200
        assert elapsed < 1.0  # Must return in under 1 second even without LLM


class TestAuditEndpoint:
    async def test_audit_endpoint_reachable(self, async_client):
        resp = await async_client.get("/audit")
        assert resp.status_code == 200

    async def test_audit_returns_list(self, async_client):
        resp = await async_client.get("/audit")
        assert isinstance(resp.json(), list)

    async def test_audit_empty_on_fresh_state(self, async_client):
        resp = await async_client.get("/audit")
        assert resp.json() == []

    async def test_audit_populated_after_pipeline(
        self, async_client, adv1_auth_header, mock_gemini_for_api
    ):
        import asyncio
        await async_client.post("/briefing/generate", headers=adv1_auth_header)
        # Give the background task a moment to run
        await asyncio.sleep(0.3)
        resp = await async_client.get("/audit")
        assert len(resp.json()) > 0

    async def test_audit_entries_contain_correct_advisor_id(
        self, async_client, adv1_auth_header, mock_gemini_for_api
    ):
        import asyncio
        await async_client.post("/briefing/generate", headers=adv1_auth_header)
        await asyncio.sleep(0.3)
        for entry in (await async_client.get("/audit")).json():
            assert entry["advisor_id"] == "adv-1"

    async def test_audit_entries_have_feature_field(
        self, async_client, adv1_auth_header, mock_gemini_for_api
    ):
        import asyncio
        await async_client.post("/briefing/generate", headers=adv1_auth_header)
        await asyncio.sleep(0.3)
        for entry in (await async_client.get("/audit")).json():
            assert entry["feature"] == "briefing"
