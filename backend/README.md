# JUNCTN Backend — Partner Matching API

FastAPI + sentence-transformers semantic partner matching. No external vector DB needed — embeddings are computed at startup and held in memory.

## Setup

Requires **Python 3.12** (sentence-transformers wheels not available for 3.13+).

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

The `all-MiniLM-L6-v2` model (~90 MB) is downloaded automatically on first run and cached in `~/.cache/torch`.

## Run

```bash
uvicorn main:app --reload --port 8000
```

12 partners are indexed in memory at startup. No seed step needed.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/match` | Semantic partner match from freeform query |
| GET | `/partners` | List all indexed partners |
| GET | `/health` | Health check + partner count |

### POST /match

```json
{
  "query": "client wants to set up a family trust for assets",
  "top_k": 3,
  "advisor_region": "Central"
}
```

Returns partners ranked by cosine similarity, with a +5 point boost for same-region partners.
