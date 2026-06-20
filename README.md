# JUNCTN

**Track 1 — ImagineHack 2026 · AAG x ASG**
Secure, Scalable, Sustainable Advisory Platform

---

## What is JUNCTN?

JUNCTN is an AI-powered platform built for AAG's advisor force — not a productivity tool for one advisor having a better day, but a shared platform where every feature reads from the same state. Three modules — a morning briefing agent, a CPD compliance engine, and a partner-matching engine — all run on a single **Advisor Context Layer**. A Telegram bot sits on top as a lightweight notification and input channel.

The web app is the full product. The Telegram bot is the moment that makes judges go "oh, that's clever."

---

## Core Features

### 1. Morning Briefing Agent
Every morning, an advisor opens JUNCTN and within 30 seconds sees who needs attention, what's on the calendar, and what follow-ups have been neglected — pulled from live sources and synthesised into one briefing card.

Built as a **LangGraph multi-agent pipeline**:

| Agent | Job |
|---|---|
| Planner (orchestrator) | Decides which subagents to run and in what order |
| Calendar subagent | Pulls today's meetings, flags conflicts |
| Client memory subagent | Reads the Context Layer per client — last interaction, open threads, relationship health |
| Follow-up subagent | Scans for overdue touchpoints and unread replies |
| Synthesiser | Merges all agent output into a structured briefing, streamed token-by-token |

The UI shows a **live agent trace panel** — advisors (and judges) can see the planner routing through subagents in real time. The briefing streams section by section, not behind a spinner.

### 2. CPD Compliance Engine
CPD isn't a learning library — it's a licensing risk. Missing credits means regulatory exposure, not a missed class. JUNCTN reframes this accordingly.

- **Semantic search** — advisor types a plain-language question, gets the 3 most relevant CPD modules ranked by embedding similarity (RAG over ChromaDB)
- **Personalised weekly picks** — reads active client topics from the Context Layer and recommends modules tied to what this advisor's clients have actually been discussing, with visible reasoning: *"Recommended because 3 clients discussed trust structures this week"*
- **CPD dashboard** — progress rings per category, red/amber/green by deadline status, quarter-end countdown
- **Org-level view** — every advisor's CPD status in one screen, who's at risk, exportable report

### 3. Partner Matching
One unforgettable demo moment, not three half-built features.

An advisor is in a client conversation view. The client mentions *"setting up a family trust."* JUNCTN detects the topic using **embedding similarity** — not hardcoded keywords — and a partner card slides in: *James Lim — Estate Planning Partner*, with one button: **Introduce**.

Supporting pieces:
- Referral lifecycle Kanban — Suggested → Introduced → In progress → Closed
- Advisor approval required before any partner is contacted — the security boundary is enforced, not just claimed
- Partner contact details are never sent to the AI; matching runs on specialty and region only

---

## Platform Architecture

The part most teams skip. Three features reading the same state, behind the same security, built to hold up at scale.

### Advisor Context Layer

Stored per advisor (Redis cache + Postgres):

```
active_client_topics[]      what clients have been talking about
today_calendar_events        JSON from the calendar subagent
pending_follow_ups[]         client IDs needing attention
cpd_status                   credits earned / required / category breakdown
active_referrals[]           open referral IDs
last_briefing_at             timestamp
expense_flags                object
```

Every briefing run, module completion, and referral status change refreshes this layer. That's what makes a follow-up logged this morning able to inform a CPD nudge and a partner match by the afternoon.

### Security

- Every API call validates the advisor's JWT before touching any data — Advisor A's context is unreachable by Advisor B
- Every AI action is logged (timestamp, advisor, feature, outcome) — visible as an audit table in the admin screen
- Partner contact info never touches the AI layer

---

## Telegram Bot

Same Context Layer, same backend, different front door.

| Command / trigger | What happens |
|---|---|
| `/briefing` | Today's top 3 priorities as a short message |
| Scheduled push (07:30) | Bot proactively sends the morning briefing — this is what "proactive AI" looks like |
| `/followups` | Lists clients needing a nudge with inline "Mark contacted" button |
| `/cpd` | Credits earned vs required, one line |
| Inline approval button | "Approve introduction" — same approval step as the web app, from a phone |

The bot reuses the same backend and Context Layer with zero separate logic. It's a second proof point for "platform, not feature."

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, CSS custom properties for design tokens |
| UI components | Radix UI (Dialog, Avatar, Progress, Tabs) |
| Icons | Lucide React |
| Charts | Recharts |
| State | React Context store |

### Backend
| | |
|---|---|
| Framework | FastAPI |
| Language | Python 3.12 |
| AI orchestration | LangGraph 0.2 (multi-agent pipeline) |
| LLM | Google Gemini API (`google-generativeai`) |
| Embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Vector store | ChromaDB (CPD semantic search) + NumPy cosine similarity (partner matching) |
| Database | PostgreSQL via SQLAlchemy (async) + Alembic migrations |
| Cache / context layer | Redis |
| Auth | JWT (`python-jose`) |
| Streaming | Server-Sent Events via `sse-starlette` |
| HTTP client | HTTPX |

### Infrastructure
- **PostgreSQL** — persistent advisor data, audit log, referral lifecycle
- **Redis** — Advisor Context Layer cache, briefing job store
- **ChromaDB** — embedded CPD module vectors for RAG search

---

## Project Structure

```
Junctn/
├── frontend/               # Next.js 14 app
│   └── src/
│       ├── app/
│       │   ├── advisor/    # Dashboard, clients, CPD, partners, settings
│       │   ├── partner/    # Partner inbox
│       │   ├── org/        # Org-level compliance view
│       │   └── api/        # Next.js API routes (proxy to FastAPI)
│       ├── components/
│       │   ├── advisor/    # BriefingBand, AgentTracePanel, LiveCalendar, etc.
│       │   ├── layout/     # Topbar, AppShell, ThemeProvider
│       │   └── ui/         # Button, Card, Avatar, Badge, etc.
│       └── lib/            # Store, data layer, types, API client
│
├── backend/                # FastAPI app
│   ├── agents/             # LangGraph pipeline + subagents
│   │   ├── pipeline.py     # Graph: Planner → Calendar → CRM → Followup → Synthesiser
│   │   ├── calendar_agent.py
│   │   ├── client_memory_agent.py
│   │   ├── followup_agent.py
│   │   └── synthesiser.py
│   ├── api/                # Route handlers (auth, briefing, matching, audit)
│   ├── services/           # Context layer, data access, auth, audit
│   └── config.py           # Settings via pydantic-settings
│
├── tests/                  # pytest test suite
└── docs/                   # Architecture and planning docs
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12
- PostgreSQL
- Redis

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy the environment file and fill in your keys:

```bash
cp .env.local.example .env
```

Required environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/junctn
REDIS_URL=redis://localhost:6379/0
CORS_ORIGIN=http://localhost:3000
```

Start the backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

API runs on [http://localhost:8000](http://localhost:8000). Health check: `GET /health`.

---

## Design System

Dark-first — "Bloomberg Terminal meets fintech." Dense and authoritative, not soft-SaaS.

| Token | Value | Usage |
|---|---|---|
| Background | `#0D1117` | Page background |
| Surface | `#161B22` | Cards, panels |
| Accent (teal) | `#1D9E75` | Primary actions, active states |
| Alert (amber) | `#BA7517` | Follow-ups, CPD warnings |
| Learning (purple) | `#7F77DD` | CPD / L&D elements |
| Text | `#E2E8F0` | Primary text |

Two rules followed on every screen:
1. **Show the AI working** — no blank loading screens; skeleton loaders, streaming text, visible agent steps
2. **Always show why** — every recommendation includes one line of reasoning: *"Recommended because…"*, *"Matched because…"*

---

## The Platform Story

> "Everything you've just seen — the briefing, the CPD recommendation, the partner match — all read from the same advisor context layer. The Telegram bot reads from that exact same layer too. That's what makes this a platform, not four separate features."

---

Built for ImagineHack 2026.
