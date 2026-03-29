# CourseIntel — Master Plan

## Product Vision

CourseIntel answers the four questions every student has but no single tool answers:

1. **What does my professor actually expect?** (syllabus intelligence)
2. **Where do I stand right now?** (grade computation + LMS sync)
3. **What should I do next week?** (AI-driven action plan)
4. **What do other students say about this course?** (reputation + workload signals)

It replaces three separate workflows — reading the syllabus, doing grade math in a spreadsheet, and Googling "is CSC 212 hard reddit" — with one AI-powered dashboard that surfaces all of this automatically from a single course upload.

---

## North Star Metric

**Time-to-first-insight** — from "I uploaded my syllabus" to "I see my current grade, action plan, and resource list" — under 45 seconds.

---

## Architecture Overview

Three layers:

```
Chrome Extension (MV3)
  └── DOM scrapers: Gradescope, Canvas, Brightspace
  └── One-click grade import → POST /extension/scrape

Next.js 16 Frontend (App Router + TypeScript)
  └── 7 screens: Setup, Profile, Grades, Goals, Study, Resources, Actions
  └── Zustand store, optimistic UI, typed API client

FastAPI Backend (Python 3.11)
  └── 13 specialized AI agents
  └── Multi-provider LLM gateway: OpenAI → Gemini → Groq
  └── Supabase PostgreSQL with Row Level Security
```

---

## The 13-Agent Intelligence Pipeline

### Phase 1 — Bootstrap (on first course setup)

The `POST /courses/bootstrap` endpoint orchestrates agents in two stages:

**Stage A — Sequential (each needs the previous result)**

| # | Agent | Model | Output |
|---|-------|-------|--------|
| 1 | `SyllabusAcquisitionAgent` | GPT-4o-mini / Groq | Finds and fetches syllabus text (Tavily search or PDF upload) |
| 2 | `SyllabusIntelligenceAgent` | GPT-4o / Gemini 1.5 Pro | Extracts grading categories, deadlines, grade scale, late policy |

**Stage B — Parallel (all 4 run simultaneously via `asyncio.gather()`)**

| # | Agent | Model | Output |
|---|-------|-------|--------|
| 3 | `DiscoveryAgent` | GPT-4o-mini | Canonical name, course code, credit hours, official links |
| 4 | `PublicResourcesAgent` | GPT-4o-mini | GitHub repos, open courseware, Reddit threads, YouTube |
| 5 | `ReputationAgent` | GPT-4o-mini | Workload hours/week, difficulty, grading style, common pitfalls |
| 6 | `ToolDiscoveryAgent` | GPT-4o-mini | Software tools students need (IDE, simulator, frameworks) |

**Stage C — Post-parallel (needs Stage B output)**

| # | Agent | Model | Output |
|---|-------|-------|--------|
| 7 | `ObligationDeadlineAgent` | GPT-4o-mini | Normalized obligations with urgency levels from raw deadlines |

### Phase 2 — Ongoing Intelligence (on demand)

| # | Agent | Model | Trigger |
|---|-------|-------|---------|
| 8 | `GradeIntelligenceAgent` | None (pure math) | Every grade entry change |
| 9 | `JudgmentAgent` | GPT-4o | "What do I do this week?" button |
| 10 | `StudyContextAgent` | GPT-4o-mini | Uploaded notes → study insights |
| 11 | `DocumentationHelpAgent` | GPT-4o-mini | Course-specific resource curation |
| 12 | `ExtensionOrchestrationAgent` | GPT-4o-mini | Validates scraped data before import |
| 13 | `ExtensionValidationAgent` | GPT-4o-mini | Cross-checks scraped grades against syllabus schema |

---

## LLM Provider Strategy

CourseIntel is intentionally **provider-agnostic**. The backend auto-selects based on which API key is present, in priority order:

```
OPENAI_API_KEY set?  →  Use OpenAI (GPT-4o for complex, GPT-4o-mini for fast)
GEMINI_API_KEY set?  →  Use Google Gemini (1.5 Pro / 2.0 Flash)
GROQ_API_KEY set?    →  Use Groq (Llama 3.3 70B / Llama 3.1 8B)
None set?            →  Bootstrap returns 503, health badge shows "No LLM"
```

All three providers use the same `call_llm(system, prompt, model, max_tokens)` interface in `backend/agents/base.py`. Groq uses the OpenAI Python SDK with `base_url="https://api.groq.com/openai/v1"`. Gemini uses the `google-generativeai` SDK.

This allows judges and users to run CourseIntel **for free** using either Groq (14,400 req/day free) or Gemini (free tier).

---

## Grade Math Engine

`GradeIntelligenceAgent` contains **zero LLM calls** — it is pure deterministic Python. This is intentional: grade calculations must be 100% reproducible and explainable.

```
Inputs: grade_entries[], grading_categories[]
  ↓
For each category: average all scores (score_earned / score_possible)
  ↓
Weighted sum: Σ(category_avg × weight) / Σ(weights_with_entries)
  ↓
Outputs: current_grade_pct, letter_grade, category_breakdown, weight_graded
```

Required score solver (algebraic, not LLM):
```
required = (target_pct/100 - already_earned) / remaining_weight
feasible = required ≤ 1.0
```

Covered by 18 unit tests in `backend/tests/test_grade_intelligence.py`.

---

## Chrome Extension Design

Manifest V3 extension with three components:

- **`popup/popup.ts`** — platform detection UI. Detects Gradescope, Canvas, or Brightspace from the active tab URL. Fetches course list from the authenticated API to let users pick which course to sync.
- **`content/scraper.ts`** — DOM scrapers for each LMS. Reads assignment names, scores, and categories directly from the page structure.
- **`background/service-worker.ts`** — Auth handshake: reads the Supabase JWT from the active tab's `localStorage`, stores it in `chrome.storage.session`, and POSTs scraped data to `/extension/scrape`.

Authentication is shared with the web app — the extension reads the same Supabase session token from `localStorage`. No separate login required.

---

## Frontend Screen Map

| Route | Screen | Key Features |
|-------|---------|-------------|
| `/dashboard` | Course List | All courses, quick stats, "Add course" CTA |
| `/dashboard/course/[id]/setup` | Bootstrap | 7-step agent pipeline with parallel execution visualization, LLM health banner |
| `/dashboard/course/[id]` | Course Profile | Identity, tools, student signal, resources |
| `/dashboard/course/[id]/grades` | Grade Calculator | Category breakdown, required score solver, goal setting |
| `/dashboard/course/[id]/goals` | Goal Tracking | Target grade, progress toward goal, gap analysis |
| `/dashboard/course/[id]/study` | Study Material | Upload notes → AI extracts key concepts |
| `/dashboard/course/[id]/resources` | Resources | Curated links from PublicResourcesAgent |
| `/dashboard/course/[id]/actions` | Action Board | JudgmentAgent weekly plan, ICS calendar import |

---

## Data Model

Three Supabase tables with Row Level Security (RLS) enforcing `auth.uid() = user_id` on all operations:

```sql
courses         — course metadata + all JSONB agent outputs
grade_entries   — individual assignment scores (source: manual | extension | import)
study_materials — uploaded notes + extracted text
```

All bootstrap agent outputs (course_identity, course_profile, resources, detected_tools, student_signal, obligations) are stored as JSONB columns, enabling schema-free evolution without migrations.

---

## Security Design

- **JWT auth**: Supabase HS256 (default) or Clerk RS256/JWKS (optional enterprise)
- **RLS**: cross-user data access impossible at the database level
- **CORS**: strict origin allowlist (`CORS_ORIGINS` env var)
- **Rate limiting**: 30 req/min per IP via `slowapi`
- **Upload validation**: MIME type + `%PDF` magic byte check before any processing
- **Input sanitization**: `_sanitize_str()` on all user strings before LLM injection
- **Internal health endpoints**: gated by `X-Internal-Token` (returns 404 if wrong, not 403)

---

## Deployment Targets

| Component | Platform | Config |
|-----------|----------|--------|
| Frontend | Vercel | `vercel.json` (rootDirectory: frontend) |
| Backend | Render | `render.yaml` (web service, Python 3.11) |
| Database | Supabase | Hosted PostgreSQL + Auth + Storage |
| Extension | Chrome sideload / Web Store | `extension/manifest.json` |
| Keepalive | GitHub Actions | `.github/workflows/keepalive.yml` (ping every 10 min) |

---

## Build Milestones

### Phase 1 — Foundation (Complete)
- FastAPI project structure, Supabase schema, auth middleware
- Chrome extension MV3 scaffold, popup, scraper, service worker
- Next.js project with App Router, Tailwind, Zustand store

### Phase 2 — Core Intelligence (Complete)
- All 13 agents implemented with `except Exception` fallbacks
- Multi-provider LLM gateway (OpenAI + Gemini + Groq)
- Grade math engine with 18 unit tests
- `POST /courses/bootstrap` pipeline coordinator
- All 7 frontend screens wired to backend

### Phase 3 — Polish & Demo (Complete)
- Demo fixture: static JSON loads without LLM at `/demo/csc212-uri-bootstrap-demo.json`
- Agent health check: `GET /health/agents` live LLM ping, frontend banner
- LLM provider badge: shows active provider on setup page
- Agent pipeline visualization with parallel execution grouping
- Pydantic response models on all endpoints (`BootstrapResponse`, `ActionPlanResponse`)
- TypedDict annotations on all agent return types

### Phase 4 — Deployment (In Progress)
- `vercel.json` and `render.yaml` created for one-click deploy
- GitHub Actions keepalive to prevent Render free tier sleep
- `CORS_ORIGINS` env var for production URL allowlist

---

## Why CourseIntel Is Different

| Pain Point | Existing Tools | CourseIntel |
|-----------|----------------|-------------|
| "What's my grade?" | Manual spreadsheet or LMS gradebook | Real-time weighted grade + goal solver |
| "What's on the syllabus?" | Read 15-page PDF manually | AI extracts grading schema, deadlines, tools |
| "What do I do next week?" | Nothing | JudgmentAgent: risk-aware weekly action plan |
| "How hard is this course?" | Reddit search | ReputationAgent: structured workload/difficulty data |
| "Where are the best resources?" | Google | PublicResourcesAgent: GitHub + courseware + Reddit |
| "Is my scraper getting accurate data?" | Hope | ExtensionValidationAgent cross-checks against syllabus |
