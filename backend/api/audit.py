from fastapi import APIRouter
from backend.services.audit import get_audit_log

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
async def audit_log() -> list[dict]:
    return get_audit_log()
