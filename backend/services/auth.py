from __future__ import annotations
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from backend.config import settings

_TOKEN_EXPIRE_HOURS = 24
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_token(advisor_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": advisor_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def get_current_advisor(token: str = Depends(_oauth2_scheme)) -> str:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        advisor_id: str | None = payload.get("sub")
        if not advisor_id:
            raise credentials_error
        return advisor_id
    except JWTError:
        raise credentials_error
