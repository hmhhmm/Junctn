from __future__ import annotations
import math
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

router = APIRouter(prefix="/cpd", tags=["cpd"])

print("Loading CPD embedding model…")
_model = SentenceTransformer("all-MiniLM-L6-v2")
print("CPD model ready.")

MODULES = [
    {"id": "mod-1",  "title": "Trust Structures & Probate Essentials",     "topic": "Estate & Trust",       "credits": 2, "durationMin": 45, "required": True,  "document": "trust structures probate estate planning family trust asset protection inheritance will enduring power of attorney"},
    {"id": "mod-2",  "title": "Advanced Estate Planning for HNW Families", "topic": "Estate & Trust",       "credits": 3, "durationMin": 90, "required": False, "document": "advanced estate planning high net worth families trust offshore assets multi-generational legacy wealth transfer"},
    {"id": "mod-3",  "title": "Personal & Corporate Tax Planning 2026",    "topic": "Tax Planning",         "credits": 2, "durationMin": 60, "required": True,  "document": "personal income tax corporate tax planning Singapore IRAS 2026 GST tax efficiency optimisation"},
    {"id": "mod-4",  "title": "GST & Cross-Border Tax Update",             "topic": "Tax Planning",         "credits": 1, "durationMin": 30, "required": False, "document": "GST goods services tax cross-border international tax update compliance Singapore"},
    {"id": "mod-5",  "title": "Mortgage & Property Financing Masterclass", "topic": "Mortgage",             "credits": 2, "durationMin": 50, "required": False, "document": "mortgage property financing HDB private condo refinancing home loan interest rate bridging loan"},
    {"id": "mod-6",  "title": "Keyman & Business Insurance Fundamentals",  "topic": "Corporate Insurance",  "credits": 2, "durationMin": 45, "required": True,  "document": "keyman insurance business insurance partner buyout group medical SME corporate risk commercial liability"},
    {"id": "mod-7",  "title": "Portfolio Construction & Risk",             "topic": "Investments",          "credits": 3, "durationMin": 75, "required": True,  "document": "portfolio construction risk management equity bonds asset allocation diversification investment returns"},
    {"id": "mod-8",  "title": "Behavioural Finance for Advisors",          "topic": "Investments",          "credits": 1, "durationMin": 30, "required": False, "document": "behavioural finance cognitive bias client psychology investment decisions advisor coaching"},
    {"id": "mod-9",  "title": "Will Writing & Legal Compliance",           "topic": "Legal / Will",         "credits": 2, "durationMin": 40, "required": True,  "document": "will writing legal compliance probate lasting power of attorney beneficiary nominee estate administration"},
    {"id": "mod-10", "title": "Business Succession Playbook",              "topic": "Business Succession",  "credits": 3, "durationMin": 80, "required": False, "document": "business succession planning exit strategy shareholder agreement buy-sell family business ownership transfer valuation"},
    {"id": "mod-11", "title": "Retirement Income & CPF Strategies",        "topic": "Retirement",           "credits": 2, "durationMin": 55, "required": True,  "document": "retirement income CPF SRS annuity passive income pension financial independence retirement planning"},
    {"id": "mod-12", "title": "SRS & Tax-Efficient Retirement",            "topic": "Retirement",           "credits": 1, "durationMin": 25, "required": False, "document": "SRS supplementary retirement scheme tax-efficient retirement savings CPF drawdown annuity"},
    {"id": "mod-13", "title": "Ethics & Fair Dealing (Mandatory)",         "topic": "Compliance",           "credits": 2, "durationMin": 40, "required": True,  "document": "ethics fair dealing MAS compliance code of conduct advisor obligations client interests regulatory"},
    {"id": "mod-14", "title": "AML / KYC Annual Refresher",               "topic": "Compliance",           "credits": 1, "durationMin": 30, "required": True,  "document": "anti-money laundering AML KYC know your client compliance annual refresher suspicious transactions MAS"},
    {"id": "mod-15", "title": "Client Conversations & Discovery",          "topic": "Practice",             "credits": 1, "durationMin": 35, "required": False, "document": "client conversations discovery needs analysis communication skills relationship building advisor practice"},
]

print("Indexing CPD module embeddings…")
_module_docs: list[str] = [m["document"] for m in MODULES]
_module_embeddings: np.ndarray = _model.encode(_module_docs, normalize_embeddings=True)
print(f"Indexed {len(MODULES)} CPD modules.")


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def _similarity_to_score(sim: float) -> int:
    return max(0, min(100, round((sim + 1) / 2 * 100)))


class CpdSearchRequest(BaseModel):
    query: str
    top_k: int = 3
    exclude_ids: list[str] = []


@router.post("/search")
def search_cpd_modules(req: CpdSearchRequest):
    query_vec = _model.encode([req.query], normalize_embeddings=True)[0]
    sims = [_cosine_similarity(query_vec, emb) for emb in _module_embeddings]

    candidates = [
        (i, sim) for i, sim in enumerate(sims)
        if MODULES[i]["id"] not in req.exclude_ids
    ]
    ranked = sorted(candidates, key=lambda x: x[1], reverse=True)[: max(1, req.top_k)]

    results = []
    for idx, sim in ranked:
        m = MODULES[idx]
        score = _similarity_to_score(sim)
        results.append({
            "id": m["id"],
            "title": m["title"],
            "topic": m["topic"],
            "credits": m["credits"],
            "durationMin": m["durationMin"],
            "required": m["required"],
            "score": score,
            "reason": f"Semantically matched on {m['topic']} · {m['credits']} credit{'s' if m['credits'] > 1 else ''} · {'required' if m['required'] else 'optional'}",
        })

    return {"results": results}
