"""API tests — POST /briefing/draft-followup."""
import pytest
from unittest.mock import patch

from tests.mocks.mock_gemini import make_draft_followup_mock


@pytest.fixture
def mock_draft_model():
    with patch("backend.api.briefing._model") as mock:
        mock.generate_content.return_value = make_draft_followup_mock()
        yield mock


class TestDraftFollowup:
    async def test_requires_auth(self, async_client):
        resp = await async_client.post(
            "/briefing/draft-followup",
            json={"client_id": "cli-2"},
        )
        assert resp.status_code == 401

    async def test_invalid_token_returns_401(self, async_client):
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers={"Authorization": "Bearer garbage"},
            json={"client_id": "cli-2"},
        )
        assert resp.status_code == 401

    async def test_valid_client_returns_200(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        assert resp.status_code == 200

    async def test_response_contains_draft(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        body = resp.json()
        assert "draft" in body
        assert len(body["draft"]) > 0

    async def test_response_contains_client_name(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        assert resp.json()["client_name"] == "Serena Koh"

    async def test_draft_is_the_mocked_text(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        from tests.mocks.mock_gemini import DRAFT_FOLLOWUP_TEXT
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        assert resp.json()["draft"] == DRAFT_FOLLOWUP_TEXT

    async def test_unknown_client_returns_404(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-9999"},
        )
        assert resp.status_code == 404

    async def test_cross_advisor_access_returns_404(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        # cli-9 belongs to adv-2 — adv-1's token must not reach it
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-9"},
        )
        assert resp.status_code == 404

    async def test_adv2_cannot_access_adv1_client(
        self, async_client, adv2_auth_header, mock_draft_model
    ):
        # cli-1 belongs to adv-1
        resp = await async_client.post(
            "/briefing/draft-followup",
            headers=adv2_auth_header,
            json={"client_id": "cli-1"},
        )
        assert resp.status_code == 404

    async def test_gemini_called_once(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        mock_draft_model.generate_content.assert_called_once()

    async def test_audit_entry_written_after_draft(
        self, async_client, adv1_auth_header, mock_draft_model
    ):
        from backend.services.audit import get_audit_log
        await async_client.post(
            "/briefing/draft-followup",
            headers=adv1_auth_header,
            json={"client_id": "cli-2"},
        )
        log = get_audit_log()
        steps = [e["agent_step"] for e in log]
        assert "draft_followup" in steps
