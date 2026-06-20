"""Unit tests — JWT creation and validation (services/auth.py)."""
import pytest
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException

from backend.services.auth import create_token, get_current_advisor
from backend.config import settings


class TestCreateToken:
    def test_returns_string(self):
        token = create_token("adv-1")
        assert isinstance(token, str)
        assert len(token) > 20

    def test_sub_claim_equals_advisor_id(self):
        token = create_token("adv-1")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert payload["sub"] == "adv-1"

    def test_different_advisors_produce_different_tokens(self):
        t1 = create_token("adv-1")
        t2 = create_token("adv-2")
        assert t1 != t2

    def test_exp_claim_is_roughly_24_hours_from_now(self):
        token = create_token("adv-1")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = exp - now
        # Allow ±5 seconds tolerance
        assert timedelta(hours=23, minutes=59) < delta < timedelta(hours=24, minutes=1)

    def test_token_signed_with_configured_secret(self):
        token = create_token("adv-1")
        # Must not raise
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert payload is not None

    def test_token_invalid_with_wrong_secret(self):
        token = create_token("adv-1")
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong-secret", algorithms=[settings.jwt_algorithm])


class TestGetCurrentAdvisor:
    def test_valid_token_returns_advisor_id(self):
        token = create_token("adv-1")
        result = get_current_advisor(token)
        assert result == "adv-1"

    def test_adv2_token_returns_adv2_id(self):
        token = create_token("adv-2")
        assert get_current_advisor(token) == "adv-2"

    def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_advisor("not-a-real-token")
        assert exc_info.value.status_code == 401

    def test_token_with_wrong_secret_raises_401(self):
        bad_token = jwt.encode(
            {"sub": "adv-1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "wrong-secret",
            algorithm="HS256",
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_advisor(bad_token)
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self):
        expired = jwt.encode(
            {"sub": "adv-1", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_advisor(expired)
        assert exc_info.value.status_code == 401

    def test_token_missing_sub_claim_raises_401(self):
        no_sub = jwt.encode(
            {"exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_advisor(no_sub)
        assert exc_info.value.status_code == 401

    def test_error_detail_message(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_advisor("garbage")
        assert "Invalid or expired token" in exc_info.value.detail
