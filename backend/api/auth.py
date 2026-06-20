from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.services.auth import create_token
from backend.services.data import get_advisor

router = APIRouter(prefix="/auth", tags=["auth"])

_DEMO_PASSWORD = "demo"


class LoginRequest(BaseModel):
    advisor_id: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    advisor_id: str
    name: str


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    advisor = get_advisor(body.advisor_id)
    if not advisor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Advisor not found")
    if body.password != _DEMO_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    return LoginResponse(
        access_token=create_token(body.advisor_id),
        advisor_id=advisor.id,
        name=advisor.name,
    )
