from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.api.audit import router as audit_router
from backend.api.auth import router as auth_router
from backend.api.briefing import router as briefing_router
from backend.api.matching import router as matching_router
from backend.api.cpd import router as cpd_router
from backend.api.relationship import router as relationship_router

app = FastAPI(title="JUNCTN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(briefing_router)
app.include_router(matching_router)
app.include_router(cpd_router)
app.include_router(relationship_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
