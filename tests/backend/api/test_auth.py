"""API tests — POST /auth/login (black-box, via httpx.AsyncClient)."""
import pytest


class TestLoginEndpoint:
    async def test_valid_credentials_returns_200(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "demo"},
        )
        assert resp.status_code == 200

    async def test_response_contains_access_token(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "demo"},
        )
        body = resp.json()
        assert "access_token" in body
        assert len(body["access_token"]) > 10

    async def test_response_contains_advisor_id(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "demo"},
        )
        assert resp.json()["advisor_id"] == "adv-1"

    async def test_response_contains_name(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "demo"},
        )
        assert resp.json()["name"] == "Marcus Tan"

    async def test_token_type_is_bearer(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "demo"},
        )
        assert resp.json()["token_type"] == "bearer"

    async def test_wrong_password_returns_401(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-1", "password": "wrong"},
        )
        assert resp.status_code == 401

    async def test_unknown_advisor_returns_404(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-999", "password": "demo"},
        )
        assert resp.status_code == 404

    async def test_adv2_login_returns_adv2_name(self, async_client):
        resp = await async_client.post(
            "/auth/login",
            json={"advisor_id": "adv-2", "password": "demo"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Aisyah Rahman"

    async def test_tokens_for_different_advisors_are_different(self, async_client):
        r1 = await async_client.post("/auth/login", json={"advisor_id": "adv-1", "password": "demo"})
        r2 = await async_client.post("/auth/login", json={"advisor_id": "adv-2", "password": "demo"})
        assert r1.json()["access_token"] != r2.json()["access_token"]

    async def test_missing_body_field_returns_422(self, async_client):
        resp = await async_client.post("/auth/login", json={"advisor_id": "adv-1"})
        assert resp.status_code == 422

    async def test_health_endpoint_needs_no_auth(self, async_client):
        resp = await async_client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
