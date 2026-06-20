# JUNCTN
## Product Requirements Document
**Track 1, ImagineHack 2026 — AAG × ASG: Secure, Scalable, Sustainable Advisory Platform**
Version 1.0 · June 2026 · Confidential

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Criteria](#3-goals--success-criteria)
4. [Platform Architecture](#4-platform-architecture)
5. [Feature 1 — Morning Briefing Agent](#5-feature-1--morning-briefing-agent)
6. [Feature 2 — CPD Compliance Engine](#6-feature-2--cpd-compliance-engine)
7. [Feature 3 — Partner Matching](#7-feature-3--partner-matching)
8. [The Telegram Bot](#8-the-telegram-bot)
9. [Platform Layer — Cross-Cutting Requirements](#9-platform-layer--cross-cutting-requirements)
10. [Design System](#10-design-system)
11. [Build Roadmap](#11-build-roadmap)
12. [Out of Scope](#12-out-of-scope)
13. [Glossary](#13-glossary)

---

## 1. What We're Building

JUNCTN is a platform for AAG's advisor force — not a tool for one advisor having a better day. It runs on one shared **Advisor Context Layer** that three modules read from: a morning briefing agent (productivity), a CPD compliance engine (learning), and a partner-matching engine (referrals).

The **web app is the full product.** A **Telegram bot** sits on top as a lightweight input/notification channel — advisors get nudged and can do small actions from their phone without opening the dashboard. The web app is what gets judged in depth. The Telegram bot is the moment that makes judges go *"oh, that's clever."*

### Judging criteria alignment

| Criterion | Weight | How JUNCTN addresses it |
|---|---|---|
| Technical | 30% | Multi-agent LangGraph pipeline, live tool calls, streaming LLM output, ChromaDB RAG, JWT-scoped isolation, audit log |
| Content | 20% | Regulatory CPD framing, business viability via org-level compliance view, innovation in shared context architecture |
| Design | 15% | Dark fintech aesthetic, streaming agent trace panel, CPD progress rings, partner card slide-in interaction |
| Track Relevance | 10% | All three brief outcomes addressed; platform architecture diagram built into the product; brief language mirrored |
| Growth & Exploration | 5% | Reasoning trace toggle, Telegram bot as second surface, CRM-as-agent pattern, architectural stretch |

---

## 2. Problem Statement

AAG and ASG operate in a fast-changing advisory landscape where advisors must manage client relationships, continuous learning, and a broad ecosystem of partners — with consistency and care. Today, this happens across fragmented tools: CRM systems, calendar apps, spreadsheets for CPD tracking, and informal networks for partner referrals. The result is cognitive overhead, missed follow-ups, compliance risk, and under-utilised partnerships.

### Pain points by workflow

| Workflow area | Current pain |
|---|---|
| Morning readiness | Advisors spend 20–30 min each morning manually checking four systems before they have a clear picture of the day |
| Client follow-up | Overdue touchpoints slip through — no system tracks promises and flags neglected clients proactively |
| CPD compliance | Advisors self-track credits on spreadsheets; deadlines are missed and proving compliance to regulators is manual |
| Learning relevance | LMS modules are not matched to what advisors are actively advising on — consumption is low, retention is lower |
| Partner referrals | The right specialist is identified too late or not at all; referral outcomes are untracked, relationship history is lost |
| Org-level visibility | Management has no real-time view of compliance health, partnership coverage gaps, or advisor performance signals |

### The brief's explicit requirement

> "The challenge is to build a solution that goes beyond one-off productivity tools and instead creates an **organisation-wide capability** that supports advisors securely, at scale, and over time."

JUNCTN addresses this through the Advisor Context Layer: a shared intelligence core that all three modules — and the Telegram bot — read from and write to. The platform grows smarter with every advisor action.

---

## 3. Goals & Success Criteria

### Primary goals

- Reduce advisor morning preparation time from 20–30 minutes to under 3 minutes via AI-generated briefings
- Achieve 100% CPD compliance visibility for all 800+ advisors at the organisational level
- Surface the right partner specialist at the moment of need — eliminating missed referral opportunities
- Establish a secure, auditable, scalable shared platform that persists advisor intelligence over time
- Provide glance-and-tap access to priority actions via Telegram — no dashboard required for fast micro-tasks

### Definition of done (hackathon scope)

| Goal | Done when |
|---|---|
| Briefing agent | Planner → subagent → synthesiser pipeline runs end-to-end, streams into UI, agent trace visible |
| CPD engine | Semantic search returns ranked results; CPD dashboard shows live credit state; personalised recs show reasoning |
| Partner matching | One live topic-trigger → partner card → Introduce action works end-to-end |
| Platform layer | Two advisor logins show zero data crossover; audit log table visible; architecture screen rendered in-app |
| Telegram bot | /briefing, /followups with inline button, /cpd, and scheduled morning push all working |

---

## 4. Platform Architecture

JUNCTN is built on one shared **Advisor Context Layer** — a persistent per-advisor intelligence store that every module and the Telegram bot read from and write to. This is the architectural decision that makes JUNCTN a platform rather than a collection of independent features.

### Advisor Context Layer — schema

```
active_client_topics[]       — topics clients have been discussing this week
today_calendar_events        — JSON, structured event list from the calendar subagent
pending_follow_ups[]         — client IDs flagged as overdue for contact
cpd_status                   — { completed, required, category_breakdown }
active_referrals[]           — open referral lifecycle IDs
last_briefing_at             — timestamp; prevents redundant briefing generation
expense_flags                — { count, total, oldest_item }
```

Stored in **Redis** (context cache, 1-hour TTL) backed by a **Postgres JSON column** (persistent). Refreshed on every briefing generation, every module completion, every referral status change. All three web modules and the Telegram bot read from this layer — that is what makes a follow-up logged this morning able to inform a CPD nudge and a partner match by the afternoon.

### Technology stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript. Dark-first UI. Tailwind CSS with custom design tokens. |
| Backend | FastAPI (Python). Async request handling. Background task queue via asyncio/Celery. |
| Agent orchestration | LangGraph — stateful multi-agent graph with typed state. Planner → subagents → synthesiser. |
| LLM | Gemini 2.0 Flash via Gemini API. Streaming enabled on all user-facing completions. |
| Vector store | ChromaDB (local). Per-advisor collections namespaced by `advisor_id`. Cosine similarity search. |
| Relational store | PostgreSQL. Advisor state, CPD records, referral lifecycle, audit log. |
| Context cache | Redis. Advisor context with 1-hour TTL. Stale-read-ok; background refresh on expiry. |
| Authentication | JWT. `advisor_id` embedded in token. Every API route validates scope before any DB or LLM call. |
| Embeddings | Gemini `text-embedding-004`. Module search and partner topic matching. |
| Telegram | python-telegram-bot. Webhook-based. Reads/writes same backend as web app — no separate logic. |

### The in-app architecture screen

> **Build this. Render it inside the actual product — not just in a slide.**

One diagram rendered in the app: Advisor Context Layer at the centre, three web modules reading from it, the Telegram bot as a fourth reader/writer on the same layer, auth wrapping the outside, audit log underneath. Most teams won't have this. You will.

**The line to rehearse:**
*"Everything you've just seen — the briefing, the CPD recommendation, the partner match — all read from the same advisor context layer. The Telegram bot you saw earlier reads from that exact same layer too. That's what makes this a platform, not four separate features."*

---

## 5. Feature 1 — Morning Briefing Agent

> **Deep build. This is where the Technical score lives.**

Every morning, an advisor opens JUNCTN and within 30 seconds sees: who needs attention today, what is on the calendar, what follow-ups have been neglected — pulled from four sources, synthesised into one card.

### User story

> *As an advisor, I open JUNCTN each morning and within 30 seconds have a clear, prioritised picture of: who needs my attention, what's on my calendar, what follow-ups I've been neglecting — without touching four different systems.*

### Agent architecture — LangGraph pipeline

| Agent | Job | Priority |
|---|---|---|
| **Planner (orchestrator)** | Decides which subagents to run, in what order, with what parameters. Built on LangGraph. Shown live in the UI as a "thinking" trace. | CORE |
| **Calendar subagent** | Pulls today's meetings from Google Calendar API (or seeded mock). Flags conflicts, back-to-back blocks, and client meetings with no briefing notes. Returns structured JSON to planner. | CORE |
| **Client memory subagent** | CRM-as-agent. Reads the Context Layer for each client on today's calendar — last interaction, open threads, relationship health. This is a reasoning step, not a database lookup. | CORE |
| **Follow-up subagent** | Scans all advisor clients for overdue touchpoints: unread replies, unkept promises from meeting notes, clients not contacted in >14 days. Returns a ranked nudge list sorted by urgency. | CORE |
| **Synthesiser** | Merges all subagent outputs into one structured briefing, streamed token-by-token into the UI. Tone: concise, professional, advisory-appropriate. | CORE |
| **Expense subagent** | Flags uncategorised or unsubmitted expenses from the past 7 days. Auto-categorises using LLM classification. Returns: count, total value, oldest item. | ENHANCE |

### Key UI moments

| Component | Description | Priority |
|---|---|---|
| **Streaming briefing card** | Renders token-by-token. Sections appear progressively: Calendar → Follow-ups → Client summaries. Left-border colour per section type (teal = calendar, amber = follow-ups, purple = L&D nudges). Not a spinner — a live structured build. | CORE |
| **Agent trace panel** | Collapsible right sidebar. Each agent step appears as it fires: timestamp, tool called, output summary. Monospace log-style feed. Green checkmark on completion. Toggle-able for judges. This alone wins Growth & Exploration (5%). | CORE |
| **Draft follow-up button** | Per nudged client. One click calls LLM with that client's context and generates a personalised message. Shows the CRM-as-agent loop closing in a single interaction. | CORE |
| **Advisor isolation demo** | Two advisor logins, completely separate briefings with zero data crossover. Switch between accounts — judges see the security model in 10 seconds. | CORE |
| **Async skeleton loader** | Briefing generation runs as a background task. UI shows skeleton screen while polling for completion. No synchronous LLM blocking. Signals production-readiness. | ENHANCE |

---

## 6. Feature 2 — CPD Compliance Engine

> **Medium build. Content and Track Relevance score lives here.**

### Framing — this is risk management, not learning

Don't pitch this as "a learning library." Advisors operate under CPD/regulatory requirements (FASEA or equivalent) — missing credits is a **licensing risk**, not a missed class. Name the actual regulation in the demo. Show the audit trail. Frame every interaction as risk reduction. This reframe alone is worth real points on Content.

### User story

> *As an advisor, I'm not chasing CPD deadlines on a spreadsheet. The system tells me I have 4 credits to complete by end of quarter, shows me the two modules most relevant to what I've been advising on this week, and marks me compliant when I'm done — all in one place.*

### Feature components

| Component | Description | Priority |
|---|---|---|
| **Natural language search** | Advisor types a topic ("estate planning for high net worth clients") → gets 3 most relevant modules, ranked, with a one-line reason why. Powered by ChromaDB semantic search over embedded module content. | CORE |
| **Personalised weekly recommendations** | Reads `active_client_topics` from the Context Layer. Surfaces 2–3 modules matched to what this advisor's clients have been discussing. Explicit reasoning shown: *"Recommended because 3 clients discussed trust structures this week and you haven't completed Module 14."* | CORE |
| **CPD dashboard** | Progress rings per category (not bars) — ethics, technical, professional skills. Red/amber/green by compliance status. Quarter-end countdown. Credit count inside each ring. | CORE |
| **One-click enrol and complete** | Advisor enrols in a module and marks completion. CPD state updates immediately in the shared Context Layer — all three features and the bot see the updated compliance status. | CORE |
| **Org-level compliance manager view** | All advisors' CPD status in one screen. Who is at risk. Which categories are most commonly missed. Exportable compliance report. This is the slide that proves the tool scales to 800 advisors, not just one. | ENHANCE |
| **AI-generated module summaries** | Before opening a module, advisor sees a 3-sentence LLM-generated summary: what it covers, who it is for, which CPD category it counts towards. High perceived value, low build cost. | ENHANCE |

### CPD credit schema

| Field | Type | Description |
|---|---|---|
| `advisor_id` | UUID FK | Foreign key to advisor table |
| `module_id` | string | Module identifier from knowledge base |
| `completed_at` | timestamp | Immutable once set |
| `credit_type` | enum | `ethics` · `technical` · `professional_skills` |
| `credit_count` | decimal | 0.5 · 1.0 · 1.5 · 2.0 |
| `quarter` | string | Derived: `YYYY-Q` format for quarterly rollup |

---

## 7. Feature 3 — Partner Matching

> **Intentionally thin — one unforgettable moment, not three half-built ones.**

### The single demo beat that wins this feature

Advisor is in a client conversation view. Client says:

> *"I'm thinking about setting up a family trust for my assets."*

JUNCTN detects the topic cluster (trust, assets, estate, family) using **embedding similarity — not hardcoded keywords**. A partner card slides into the sidebar:

**James Lim — Estate Planning Partner** `[Introduce]`

That's it. 60 seconds. Most memorable thing in the whole demo.

### Feature components

| Component | Description | Priority |
|---|---|---|
| **Topic detection engine** | Embedding similarity against topic cluster centroids (trust/estate, tax, insurance, SMSF, property). Confidence threshold triggers partner card. Vector similarity, not keyword matching — technically credible. | CORE |
| **Partner card surface** | Slides into sidebar on trigger. Name, specialty badges, region tag, referral track record, single Introduce CTA. Dismissable without losing the record. | CORE |
| **Referral lifecycle tracker** | Kanban: Suggested → Introduced → In Progress → Closed. Each card shows client, partner, date, status. Advisor approval required before any partner contact — security boundary visibly enforced, not just claimed. | CORE |
| **Partner contact isolation** | Partner contact details never sent to the LLM. Matching runs on specialty/region vectors only. Actual introduction only happens when advisor clicks Approve. Security boundary is architectural, not policy. | CORE |
| **Relationship graph** | Force-directed D3.js graph. Advisor nodes, partner nodes, edges weighted by referral history. Even with seeded data, this is the most visually memorable thing in the entire demo. | ENHANCE |
| **Coverage gap map** | Org-level: "No tax partner in North region." Mock screenshot for the deck is sufficient — don't build. | VISION (roadmap slide only) |

---

## 8. The Telegram Bot

> **Lightweight input, big demo payoff. Same backend, different front door.**

The bot's job is not to be a second app. It is a side door for small, fast actions an advisor would otherwise have to open the dashboard for. Same Context Layer, same backend, no separate logic, no separate data model.

### Commands (4 max — keep it short)

| Command / trigger | What happens |
|---|---|
| `/briefing` | Bot sends today's top 3 priorities as a short message — same data as the web briefing card, condensed for Telegram. |
| Scheduled push (no command) | Every morning, the bot **proactively** messages the advisor their briefing. This is the moment that sells "proactive," not "ask and wait." Build this even if you cut everything else. |
| `/followups` | Lists clients needing a nudge, each with an inline button: **Mark contacted** — updates the Context Layer directly. |
| `/cpd` | Shows credits earned vs required, one line. No dashboard needed. |
| Inline button on partner-match push | **Approve introduction** — same approval step as the web app, reachable from a phone notification. |

### Why this works as a stretch, not a distraction

- **Zero extra backend logic** — the bot is just another reader/writer of the same shared Context Layer. It is a second proof point for "platform, not feature."
- **Believable real-world detail** — advisors are mobile-first between client meetings. A bot that pings "3 follow-ups due, tap to mark done" is a genuinely useful pattern.
- **Cheap to build relative to demo impact** — a Telegram bot is a thin webhook layer on top of logic already built for the web app.

### What NOT to do

Don't try to replicate the full briefing UI, the CPD search, or the partner graph inside Telegram. Telegram is for glance-and-tap, not depth.

> If a judge asks *"can I do everything from the bot?"* — the honest answer is: *"No, by design. The bot is for 30-second actions. The web app is for the real work."* That is a better answer than pretending the bot does everything.

---

## 9. Platform Layer — Cross-Cutting Requirements

> **This is the most important piece, and the easiest to skip by accident.**

"Organisation-wide capability" is not three features — it is three features (and a bot) reading the same state, behind the same security, built to hold up at scale.

### Security — shown with evidence, not claims

| Requirement | Implementation |
|---|---|
| Data isolation | Every API route validates `advisor_id` from JWT before touching any data. Advisor A's context is never reachable by Advisor B under any code path. |
| Demo | Two logins, switch between them live — completely separate data, zero crossover. |
| Audit log | Every AI action logged: timestamp, advisor, feature, what happened. Visible as a simple table in the admin screen. |
| Partner isolation | Partner contact info never sent to the LLM. Matching runs on vectorised specialty/region data. Actual introduction requires explicit advisor click. |
| Bot parity | The Telegram bot enforces the same JWT validation and the same advisor-scoped data access as the web app. |

### Scalability

| Requirement | Implementation |
|---|---|
| Async briefing | Briefing generation is a background task — never blocks the UI thread. Skeleton loader polls for completion. |
| Rate limiting | Token-bucket rate limiter per `advisor_id` on the LLM gateway. Show in architecture diagram. |
| Context TTL | 1-hour TTL with background refresh on expiry. Stale reads acceptable on non-critical paths. |
| Capacity | Architecture designed for 800+ concurrent advisors. `MAX_ADVISORS = 800` config constant — reference it in the demo. |
| Namespace isolation | ChromaDB collections namespaced by `advisor_id` to enable horizontal sharding if required. |

### Sustainability

| Requirement | Implementation |
|---|---|
| Client memory | Persists across sessions — relationship history accumulates over the lifetime of the engagement |
| CPD records | Immutable completion records tracked across quarters |
| Referral history | Accumulates on the relationship graph — edges gain weight over time |
| Context refresh | Advisor context updated on every significant action: briefing, module completion, referral update, bot interaction |

---

## 10. Design System

> **Dark-first. Bloomberg Terminal meets fintech — dense and authoritative, not soft-SaaS.**

### Colour tokens

| Token | Value | Usage |
|---|---|---|
| Base background | `#0D1117` | Application background. Dark navy, not pure black. |
| Surface | `#161B22` | Cards, panels, elevated containers. |
| Teal accent | `#1D9E75` | Primary actions, CORE indicators, success states, F1 identity. |
| Purple accent | `#7F77DD` | L&D and knowledge features. Recommendation surfaces. |
| Amber accent | `#BA7517` | Warnings, urgency, ENHANCE indicators, F3 identity. |
| Coral accent | `#D85A30` | Errors, overdue states, critical compliance flags. |
| Blue accent | `#378ADD` | Informational elements, platform architecture surfaces. |
| Text primary | `#E2E8F0` | Body copy and headings on dark backgrounds. |
| Text muted | `#8B9099` | Descriptions, metadata, labels. |

### Typography

| Role | Spec |
|---|---|
| Display / headings | Inter or system-ui. Bold. White on dark surfaces. |
| Body | Inter Regular, 14px, 1.6 line-height. |
| Data / agent trace | JetBrains Mono or equivalent. 13px. Agent step logs, CPD numbers, timestamps. |
| Labels / tags | Inter Semi-Bold, 11px, uppercase, letter-spacing 0.06em. |

### Signature UI components

- **Agent trace panel** — monospace log feed in right sidebar. Each step appears as it fires. Green check on completion. Feels like a terminal — deliberately.
- **Streaming briefing card** — left-border colour per section type (teal = calendar, amber = follow-ups, purple = L&D nudges). Text renders progressively. Not a chat bubble.
- **CPD progress rings** — circular per category. Amber if at risk; teal if on track; coral if overdue. Credit count inside the ring. Immediately legible to non-technical judges.
- **Partner card** — slides in from right sidebar with subtle animation on trigger. Name, specialty badges, region tag, single CTA.
- **Left sidebar nav** — 4 icons (briefing / learning / partners / admin). Teal active-state left-border. No top tabs.
- **Empty states** — every screen has real copy. *"No follow-ups outstanding — good work"* instead of a blank screen. Judges notice this.

### Two rules for every screen

1. **Show the AI working** — never a blank screen while something loads. Skeleton loaders, streaming text, visible agent steps.
2. **Always show why** — every recommendation gets one line: *"Recommended because…"*, *"Matched because…"* This answers the brief's content-accuracy criterion and keeps the product from feeling like a chatbot wrapper.

---

## 11. Build Roadmap

### Phase 1 — Foundation (build first, nothing works without it)

| Step | What to build |
|---|---|
| 1 | Project scaffold: Next.js/React frontend, FastAPI backend, Postgres, ChromaDB, Redis, JWT auth. Two seeded advisor accounts. |
| 2 | **Advisor Context Layer** — schema wired so every feature reads/writes to it. Do this before building any feature on top. |

### Phase 2 — Core features (this is what gets judged)

| Step | What to build | Score impact |
|---|---|---|
| 3 | **F1** — Planner + Calendar + Client-memory subagents, LangGraph pipeline, streaming output, agent trace panel. | ~60% of Technical (30%) |
| 4 | **F2** — RAG search over 10–15 seeded CPD modules + CPD dashboard with progress rings + personalised recommendations reading from Context Layer. | Content (20%) + Track (10%) |
| 5 | **F3** — One working topic-detection → partner-card trigger end to end. Referral Kanban with seeded data. | Track (10%) |
| 6 | **Security demo** — audit log table visible in admin screen + two-advisor-isolation switch. | Technical (30%) |

### Phase 3 — The platform reveal

| Step | What to build |
|---|---|
| 7 | **In-app architecture screen** — Context Layer diagram rendered inside the live product, not just in slides. |

### Phase 4 — Telegram bot (stretch — build only after Phases 1–3 work)

| Step | What to build |
|---|---|
| 8 | Bot scaffold + webhook, connected to the same backend. |
| 9 | `/briefing`, `/followups` with inline "Mark contacted" button, `/cpd`. |
| 10 | **Scheduled morning push** — this is the single most impressive bot feature. Build this even if you cut the others. |

### Phase 5 — Enhancements (only if time remains)

- Follow-up subagent + expense subagent added to F1 pipeline
- Org-level CPD compliance manager view with exportable report
- D3.js force-directed relationship graph for partner ecosystem
- Async briefing queue with skeleton loader
- AI-generated module summaries on hover in L&D search
- Coverage gap map (or mock it for the deck)

---

## 12. Out of Scope

The following are explicitly excluded from the hackathon build and reserved for the product roadmap.

- Live production integrations with Xplan, Salesforce, or any real CRM system
- Real financial data of any kind — all client and advisor data is seeded and synthetic
- Client-facing portal or any interface exposed directly to end clients
- Mobile native application — web-responsive + Telegram only for the hackathon build
- Automated CPD credit verification with any regulatory body or external certification system
- Payment processing, subscription billing, or any financial transaction capability
- Full feature parity between the Telegram bot and the web app — the bot is intentionally limited to 4 commands

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Advisor Context Layer** | The shared per-advisor intelligence store that all JUNCTN modules and the Telegram bot read from and write to. The architectural core of the platform. |
| **CPD** | Continuing Professional Development. Mandatory credit requirements for licensed financial advisors under FASEA or equivalent regulation. |
| **LangGraph** | Python framework for building stateful multi-agent pipelines as directed graphs. Used for the F1 briefing agent orchestration. |
| **RAG** | Retrieval-Augmented Generation. Grounding LLM responses in a retrieved document corpus — used in F2 knowledge search. |
| **ChromaDB** | Open-source vector database used for semantic search over embedded module content and advisor client memory. |
| **CRM-as-agent** | The pattern where client relationship data is accessed via a reasoning LLM step rather than a direct database lookup — enabling contextual synthesis rather than record retrieval. |
| **Topic cluster** | A group of semantically related terms (e.g. trust, estate, inheritance, beneficiary) embedded as a centroid vector for partner matching. |
| **Relationship graph** | A force-directed graph of advisors and partners with edges weighted by referral history — used in F3 ecosystem visualisation. |
| **Advisor-mediated** | Security principle: no AI-initiated outbound communication to partners or clients. All external actions require explicit advisor approval. |
| **JUNCTN** | The platform name. A unified advisory intelligence platform with three web modules and a Telegram bot, all sharing one Advisor Context Layer. |

---

*JUNCTN · ImagineHack 2026 · Track 1 · AAG × ASG · Confidential*