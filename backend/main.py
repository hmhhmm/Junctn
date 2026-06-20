import math
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="JUNCTN Partner Matching API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model (downloaded once, cached in ~/.cache/torch) ─────────────────────────
print("Loading embedding model…")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model ready.")

# ── Partner seed data ─────────────────────────────────────────────────────────
# Document strings are rich with synonyms so semantic search handles different
# phrasings ("trust" vs "estate planning" vs "inheritance").
PARTNERS = [
    {
        "id": "ptr-1",
        "name": "Meridian Trust Advisory",
        "specialty": "Estate & Trust",
        "region": "Central",
        "successRate": 0.92,
        "acceptanceRate": 0.95,
        "avgDaysToClose": 18,
        "document": (
            "estate planning family trust wealth transfer inheritance asset protection "
            "trust structuring high net worth legacy will enduring power of attorney"
        ),
    },
    {
        "id": "ptr-2",
        "name": "Pinnacle Tax Partners",
        "specialty": "Tax Planning",
        "region": "Central",
        "successRate": 0.88,
        "acceptanceRate": 0.90,
        "avgDaysToClose": 21,
        "document": (
            "tax planning tax optimisation corporate tax personal income tax GST "
            "tax efficiency restructuring tax advisory Singapore IRAS compliance"
        ),
    },
    {
        "id": "ptr-3",
        "name": "Northgate Mortgage Co.",
        "specialty": "Mortgage",
        "region": "North",
        "successRate": 0.80,
        "acceptanceRate": 0.86,
        "avgDaysToClose": 14,
        "document": (
            "mortgage home loan property financing refinancing HDB private property "
            "housing loan interest rate bridging loan bank loan purchase"
        ),
    },
    {
        "id": "ptr-4",
        "name": "Sentinel Corporate Risk",
        "specialty": "Corporate Insurance",
        "region": "East",
        "successRate": 0.85,
        "acceptanceRate": 0.88,
        "avgDaysToClose": 25,
        "document": (
            "corporate insurance business insurance keyman insurance partner buyout "
            "group medical group term SME risk commercial liability directors officers"
        ),
    },
    {
        "id": "ptr-5",
        "name": "Asia Capital Investments",
        "specialty": "Investments",
        "region": "Central",
        "successRate": 0.90,
        "acceptanceRate": 0.93,
        "avgDaysToClose": 12,
        "document": (
            "investments portfolio management unit trust bonds equities wealth management "
            "diversification alternative investments fund management asset allocation returns"
        ),
    },
    {
        "id": "ptr-6",
        "name": "Lex Estate Lawyers",
        "specialty": "Legal / Will",
        "region": "West",
        "successRate": 0.83,
        "acceptanceRate": 0.84,
        "avgDaysToClose": 30,
        "document": (
            "will writing lasting power of attorney probate legal advice estate administration "
            "beneficiary nominee legal documents succession planning solicitor"
        ),
    },
    {
        "id": "ptr-7",
        "name": "Continuity Succession Group",
        "specialty": "Business Succession",
        "region": "Central",
        "successRate": 0.78,
        "acceptanceRate": 0.80,
        "avgDaysToClose": 35,
        "document": (
            "business succession planning exit strategy shareholder agreement buy-sell "
            "family business transition ownership transfer valuation SME succession"
        ),
    },
    {
        "id": "ptr-8",
        "name": "Silverpine Retirement",
        "specialty": "Retirement",
        "region": "North",
        "successRate": 0.87,
        "acceptanceRate": 0.91,
        "avgDaysToClose": 16,
        "document": (
            "retirement planning CPF SRS annuity passive income pension retirement income "
            "retrenchment financial independence early retirement planning"
        ),
    },
    {
        "id": "ptr-9",
        "name": "Heritage Trust West",
        "specialty": "Estate & Trust",
        "region": "West",
        "successRate": 0.81,
        "acceptanceRate": 0.85,
        "avgDaysToClose": 22,
        "document": (
            "estate planning trust setup family trust charitable trust cross-border estate "
            "offshore assets inheritance tax legacy planning wealth preservation"
        ),
    },
    {
        "id": "ptr-10",
        "name": "Eastside Tax Chambers",
        "specialty": "Tax Planning",
        "region": "East",
        "successRate": 0.84,
        "acceptanceRate": 0.87,
        "avgDaysToClose": 20,
        "document": (
            "tax planning corporate restructuring individual tax personal income tax "
            "tax savings investment holding company tax incentives Singapore"
        ),
    },
    {
        "id": "ptr-11",
        "name": "Polaris Wealth (North)",
        "specialty": "Investments",
        "region": "North",
        "successRate": 0.86,
        "acceptanceRate": 0.90,
        "avgDaysToClose": 13,
        "document": (
            "investment management wealth growth equity portfolio fixed income "
            "robo-advisory ETF REITs structured products investment planning growth"
        ),
    },
    {
        "id": "ptr-12",
        "name": "Westview Home Loans",
        "specialty": "Mortgage",
        "region": "West",
        "successRate": 0.79,
        "acceptanceRate": 0.82,
        "avgDaysToClose": 15,
        "document": (
            "home loan mortgage refinancing property purchase HDB EC private condo "
            "fixed rate floating rate loan tenure cash outlay stamp duty"
        ),
    },
]

# Pre-compute and cache all partner embeddings at startup
print("Indexing partner embeddings…")
_docs = [p["document"] for p in PARTNERS]
_embeddings: np.ndarray = model.encode(_docs, normalize_embeddings=True)
print(f"Indexed {len(PARTNERS)} partners.")


# ── Helpers ───────────────────────────────────────────────────────────────────

def initials(name: str) -> str:
    return "".join(w[0] for w in name.split()[:2]).upper()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    # Both are already L2-normalised so dot product == cosine similarity
    return float(np.dot(a, b))


def similarity_to_score(sim: float) -> int:
    """Map cosine similarity [-1, 1] to a 0-100 display score."""
    return max(0, min(100, round((sim + 1) / 2 * 100)))


def build_reason(meta: dict) -> str:
    rate = int(meta["successRate"] * 100)
    return f"Matched on {meta['specialty'].lower()} — {rate}% success rate · {meta['region']} region"


# ── Endpoints ─────────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    query: str
    top_k: int = 3
    advisor_region: str | None = None


@app.post("/match")
def match_partners(req: MatchRequest):
    query_vec = model.encode([req.query], normalize_embeddings=True)[0]
    sims = [cosine_similarity(query_vec, emb) for emb in _embeddings]

    # Rank by similarity
    ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)
    top = ranked[: max(1, req.top_k)]

    matches = []
    for idx, sim in top:
        p = PARTNERS[idx]
        score = similarity_to_score(sim)
        if req.advisor_region and p["region"] == req.advisor_region:
            score = min(100, score + 5)
        matches.append({
            "id": p["id"],
            "name": p["name"],
            "initials": initials(p["name"]),
            "specialty": p["specialty"],
            "region": p["region"],
            "score": score,
            "reason": build_reason(p),
            "successRate": p["successRate"],
            "acceptanceRate": p["acceptanceRate"],
            "avgDaysToClose": p["avgDaysToClose"],
        })

    return {"matches": matches}


@app.get("/partners")
def list_partners():
    return {"partners": [
        {k: v for k, v in p.items() if k != "document"} | {"initials": initials(p["name"])}
        for p in PARTNERS
    ]}


@app.get("/health")
def health():
    return {"status": "ok", "partners_indexed": len(PARTNERS)}
