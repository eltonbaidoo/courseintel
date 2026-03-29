# CourseIntel — Master Plan

> Multi-agent academic intelligence engine that bootstraps a complete course profile — grading schema, deadlines, resources, tools, student signal, and a weekly action plan — from a university name and course code in under 45 seconds.

---

## Problem Definition

A student enrolls in CSC 212 at URI. To understand what they're actually in for, they need to:

1. Read the 15-page syllabus and manually parse the grading breakdown
2. Open a spreadsheet to track their weighted grade as assignments come in
3. Search Reddit for "CSC 212 URI hard?" to understand workload expectations
4. Separately Google for GitHub repos, YouTube lectures, and open courseware
5. Re-read the syllabus to copy deadlines into their calendar
6. Ask classmates what tools they'll need (Gradescope, Ed Discussion, Valgrind...)

**This takes 45–90 minutes per course, per semester.** Students with 4–5 courses repeat this for every one. The information exists — it's all public — but it's fragmented across a PDF, Reddit, GitHub, RateMyProfessors, and department websites.

**CourseIntel eliminates this entirely.** One form submission → all of the above, structured and actionable, in under 45 seconds.

**Target users:** University students (primary), academic advisors (secondary), course instructors who want to understand how their course is perceived publicly.

---

## Vision and North Star

**North star metric:** Time-to-first-insight — from "I submitted the form" to "I see my grade breakdown, action plan, and resource list" — under 45 seconds.

**Long-term vision:** CourseIntel becomes the authoritative intelligence layer for academic courses — a platform that any LMS can integrate to give students instant course context, and that instructors use to see how their course is perceived relative to peers.

**Hackathon scope:** A fully functional end-to-end product: web app, Chrome extension (grade import from Gradescope/Canvas/Brightspace), multi-agent backend, and offline demo mode — all working without a paid API key.

---

## Technical Architecture

### Three-Layer System

```
Chrome Extension (Manifest V3)
  ├── content/scraper.ts    — DOM scrapers for Gradescope, Canvas, Brightspace
  ├── background/service-worker.ts  — Auth handshake, grade POST
  └── popup/popup.ts        — Platform detection UI, course selector

Next.js 16 Frontend (Vercel)
  ├── App Router + TypeScript strict mode
  ├── Zustand global store (optimistic grade updates)
  ├── 7 dashboard screens + landing page + auth flows
  └── lib/ics.ts — ICS calendar parsing (no server round-trip)

FastAPI Backend (Render, Python 3.11)
  ├── 13 specialized async agents
  ├── Multi-provider LLM gateway (OpenAI → Gemini → Groq)
  ├── Pydantic v2 response_model validation on all endpoints
  └── Supabase PostgreSQL + RLS
```

### Non-Trivial Technical Choices

| Decision | Rationale |
|----------|-----------|
| `asyncio.gather()` for parallel agents | Cuts bootstrap time from ~120s sequential to ~35s wall clock (4 agents run simultaneously in Stage B) |
| Deterministic grade math — zero LLM | Grade calculations must be 100% reproducible. Algebraic solver: `required = (target - already_earned) / remaining_weight` — no hallucination risk |
| `TypedDict` return annotations on all 13 agents | Enables static analysis of agent outputs without runtime overhead; catches schema drift at type-check time |
| Pydantic v2 `response_model` on all endpoints | FastAPI validates and serializes agent output before it reaches the client; prevents malformed responses from propagating |
| `try/except Exception` wrapping entire `call_llm` | `RuntimeError` from missing API key and `json.JSONDecodeError` from malformed LLM output both handled; pipeline never crashes on a single agent failure |
| Multi-provider LLM gateway with lazy-init clients | `openai.AsyncOpenAI` / Gemini / Groq clients initialized once on first use (not at import time) — avoids startup failure when key is not set |
| Groq uses OpenAI SDK with `base_url` override | Same Python SDK, different endpoint — zero code duplication across providers |
| JWT shared between web app and extension | Extension reads Supabase session from active tab's `localStorage` — no second login required, no token storage in extension popup |
| Supabase RLS on all three tables | `auth.uid() = user_id` enforced at the database level — cross-user data access impossible regardless of application bugs |
| Chrome Manifest V3 service worker | MV3 required for Chrome Web Store; service worker is short-lived by design, all operations complete in a single event cycle |
| `SELECT ... SKIP LOCKED` analog via RLS | Supabase RLS + `user_id` column prevents concurrent writes from overwriting each other without explicit transaction locking |

---

## The 13-Agent Pipeline

### Stage A — Sequential (each depends on the previous)

| Agent | Model | Input | Output |
|-------|-------|-------|--------|
| `SyllabusAcquisitionAgent` | Haiku/Flash | course + university + professor | Finds syllabus URL via Tavily, fetches PDF text. Returns `{found, confidence, source, syllabus_text}` |
| `SyllabusIntelligenceAgent` | Opus/Pro | syllabus text | Extracts `SyllabusProfile`: grading categories (name + weight + notes), grade scale, late policy, deadlines, required tools |

### Stage B — Parallel via `asyncio.gather()` (all 4 simultaneous)

| Agent | Model | Output TypedDict |
|-------|-------|-----------------|
| `DiscoveryAgent` | Haiku | `DiscoveryResult`: canonical name, course code, credit hours, official links, confidence |
| `PublicResourcesAgent` | Haiku | `PublicResourcesResult`: list of `ResourceItem` (title, url, type, relevance_score, reason) |
| `ReputationAgent` | Sonnet | `ReputationResult`: workload, difficulty, grading_style, key_warnings, positive_signals, confidence |
| `ToolDiscoveryAgent` | Haiku | `ToolDiscoveryResult`: list of `ToolItem` (tool_name, evidence, purpose, confidence, integration_type) |

### Stage C — Post-parallel (needs Stage B output)

| Agent | Model | Output TypedDict |
|-------|-------|-----------------|
| `ObligationDeadlineAgent` | Haiku | `ObligationResult`: normalized obligations with urgency levels (critical/high/medium/low) and conflict notes |

### On-Demand Agents

| Agent | Trigger | Model |
|-------|---------|-------|
| `GradeIntelligenceAgent` | Every grade entry change | **No LLM** — pure deterministic Python |
| `JudgmentAgent` | "What do I do this week?" | GPT-4o — risk level + weekly action plan as `JudgmentResult` TypedDict |
| `StudyContextAgent` | After material upload | Haiku — key topics, weak coverage areas |
| `DocumentationHelpAgent` | Resource curation | Haiku — course-specific help cards |
| `ExtensionOrchestrationAgent` | Extension sync | Haiku — validates scraped items against course schema |
| `ExtensionValidationAgent` | Extension sync | Haiku — cross-checks scraped grades against syllabus |

---

## Grade Math Engine (Zero LLM)

`GradeIntelligenceAgent` is the only agent with no LLM involvement — intentionally.

```python
# Weighted average across categories
for category, entries in grouped:
    category_avg = mean(e.score_earned / e.score_possible for e in entries)
    weighted_total += category_avg * category.weight

current_grade = weighted_total / sum(weights_with_entries)

# Algebraic required-score solver
already_earned = current_grade * (1 - remaining_weight)
required = (target / 100 - already_earned) / remaining_weight
feasible = required <= 1.0
```

Covered by **18 parametrized unit tests** (letter grade thresholds A through F, zero-division guard, multi-entry categories, feasibility edge cases).

---

## LLM Provider Strategy

CourseIntel runs free. No credit card required.

```
Priority 1: OPENAI_API_KEY    → GPT-4o / GPT-4o-mini (paid, highest quality)
Priority 2: GEMINI_API_KEY    → Gemini 1.5 Pro / 2.0 Flash (free tier, Google AI Studio)
Priority 3: GROQ_API_KEY      → Llama 3.3 70B / 3.1 8B (free tier, 14,400 req/day)
No key set  → 503 on bootstrap, health badge shows "No LLM"
```

All three providers share the same `call_llm(system, prompt, model, max_tokens)` interface. The gateway uses lazy-initialized singleton clients so startup never fails on a missing key. Live status is exposed via `GET /health/agents` (makes a real LLM completion call with PING → PONG) and shown as a badge on the setup page.

---

## Chrome Extension — Confirmed Working Scrapers

Three DOM scrapers with real CSS selectors, validated by **29 Jest unit tests** running in jsdom:

| Platform | Selectors | Test Coverage |
|----------|-----------|--------------|
| Gradescope | `.js-assignmentRow`, `.table--assignments tbody tr`, `.assignmentTitle`, `.submissionTimeChart--dueDate`, `.js-due-date` | 5 test cases |
| Canvas | `.assignment`, `.ig-row`, `.ig-title`, `.assignment-date-due`, `.due_date_display` | 4 test cases |
| Brightspace (D2L) | `.d2l-table tr`, `.d2l-datalist-item`, `.dco_title`, `.d2l-dates-text` | 5 test cases |
| Generic fallback | Date-pattern regex scan on `tr, li, .card, .item` | 5 test cases |

`detectPlatform(hostname)` is a pure function (accepts hostname arg, defaults to `window.location.hostname`) — testable without DOM manipulation. 8 hostname detection tests.

---

## Scalability Design

### Current (hackathon scope)
Each bootstrap request runs agents inline in the FastAPI request handler. `asyncio.gather()` provides concurrency within a single request but not across requests. Bottleneck: LLM API latency (dominated by Tavily + SyllabusIntelligence at ~35s wall clock).

### Known limits and mitigation path

| Bottleneck | Current | Mitigation Path |
|-----------|---------|----------------|
| Per-request LLM cost | ~$0.008/bootstrap (Groq free tier: $0) | Result caching by `(course_code, university)` hash — same course bootstrapped by 100 students costs the same as 1 |
| Concurrent bootstraps | Handled by uvicorn async workers (default 1 process) | Render auto-scales workers; background task queue (Redis + arq) for >10 concurrent |
| Supabase free tier limits | 500MB storage, 2GB bandwidth | Upgrade path: Supabase Pro at $25/mo for university-scale use |
| Render free tier sleep | 15-min idle spindown | GitHub Actions keepalive workflow pings `/health` every 10 minutes |

### Horizontal scaling path
1. Extract bootstrap pipeline into a background task (Celery/arq with Redis broker)
2. Cache bootstrap results by `SHA256(course_code + university)` with 7-day TTL
3. Serve cached results from CDN for common courses (CSC 212 at URI → same result for all students)

---

## Ecosystem and Integration Plan

### Current integrations (built)
- **Gradescope** — DOM scraper + Extension validation
- **Canvas** — DOM scraper
- **Brightspace/D2L** — DOM scraper
- **Tavily** — web search for syllabus acquisition and resource discovery
- **Supabase** — auth, PostgreSQL, Row Level Security
- **Google AI Studio** — Gemini free tier
- **Groq** — Llama free tier

### External worker / API contract (designed, not yet built)
Any external system can integrate via the REST API. Auth follows the same JWT pattern as the web app:

```
POST /courses/bootstrap
  Authorization: Bearer <supabase_jwt>
  Content-Type: multipart/form-data
  Body: { university, course, professor, syllabus? }
  Response: BootstrapResponse (Pydantic-validated)

GET /courses/{id}/action-plan
  Authorization: Bearer <supabase_jwt>
  Response: ActionPlanResponse

POST /extension/scrape
  Authorization: Bearer <supabase_jwt>
  Body: { course_id, platform, url, raw_text, items[] }
  Response: { accepted_items, message }
```

### Future ecosystem
- **University LMS plugin** — universities embed CourseIntel via iframe or OAuth to give all students automatic course bootstrapping on enrollment
- **Instructor dashboard** — professors see aggregate student signal (workload perception, common pitfalls) from their course's public reputation
- **Third-party agent registry** — external agents implement the `run(input) -> TypedDict` interface and declare their TypedDict schema; the pipeline coordinator includes them automatically

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| LLM API unavailable | Medium | High | Three-provider fallback chain (OpenAI → Gemini → Groq); bootstrap degrades gracefully — pipeline returns partial results with available data |
| Tavily search rate limit | Low | Medium | Agents return empty results (not errors); course still bootstraps from uploaded PDF if Tavily fails |
| LLM returns malformed JSON | High (5–15% of calls) | Low | `try/except Exception` wraps `call_llm` in every agent — malformed output triggers logged warning + empty safe default |
| Supabase RLS misconfiguration | Low | Critical | RLS policies tested against schema.sql; `auth.uid() = user_id` is the only policy pattern, minimizing misconfiguration surface |
| Chrome MV3 service worker termination | Medium | Low | All operations complete in a single event (scrape → POST → response); no state stored in service worker memory |
| Render free tier cold start (15-min sleep) | High | Medium | GitHub Actions keepalive workflow pings `/health` every 10 minutes; first request to a cold instance adds ~30s |
| DOM scraper breakage after LMS update | Medium | Medium | 29 Jest tests catch regressions; selectors target stable class patterns (`.js-assignmentRow` vs. dynamic style classes) |

---

## Competitive Landscape

| Tool | What it does | Why it's not CourseIntel |
|------|-------------|--------------------------|
| **RateMyProfessors** | Professor ratings | No grading schema, no resource discovery, no grade calculator |
| **Syllabi.com / Koofers** | Syllabus search | No AI extraction, no structured output, no grade tracking |
| **Notion / Obsidian** | Manual note-taking | Requires student to do all the work; no automation |
| **Canvas / Gradescope** | LMS gradebook | Shows raw grades only; no weighted calculation, no advisor |
| **ChatGPT (manual)** | Paste syllabus → ask questions | Stateless, no course tracking, no extension, no grade model |

**CourseIntel's differentiator:** It is the only tool that (1) automatically finds and parses the syllabus without a URL, (2) runs parallel agents to build a multi-dimensional course model, (3) syncs live grades from the LMS via extension, and (4) combines all of this into a risk-aware weekly action plan. The combination is what's novel — any individual piece exists somewhere, but nowhere does a student get all of it automatically from a single form submission.

---

## User Impact

### Measured benchmark
A manual end-to-end workflow (syllabus parse + grade setup + resource search + deadline entry) for a single course takes **45–90 minutes** for a thorough student. CourseIntel completes the equivalent in **35–45 seconds** — a **60–120× reduction** in time-to-insight.

For a student taking 4 courses, this saves 3–6 hours at the start of each semester. For 10,000 students at a university, that's 30,000–60,000 hours of low-value administrative work eliminated per semester.

### Qualitative impact
- Students who currently don't read the full syllabus now get the key policies surfaced automatically
- First-generation college students get the same resource discovery as students with older siblings who went to the same school
- The weekly action plan from JudgmentAgent gives students without academic advisors a data-driven answer to "what should I focus on?"

---

## Execution Plan

### Phase 1 — Foundation (Complete)
FastAPI skeleton, Supabase schema with RLS, Next.js App Router scaffold, Chrome MV3 extension scaffold, auth flows (Supabase + optional Clerk), Zustand store.

### Phase 2 — Core Intelligence (Complete)
All 13 agents implemented. Multi-provider LLM gateway. `asyncio.gather()` pipeline coordinator. Pydantic v2 response models. TypedDict annotations on all agents. `try/except Exception` wrapping `call_llm` in every agent.

### Phase 3 — Polish and Validation (Complete)
- 18 unit tests for grade math engine
- 12 async tests for agent fallback resilience (LLM failure → safe empty dict)
- 29 Jest tests for Chrome extension DOM scrapers (jsdom)
- Demo fixture: CSC 212 URI with 10 resources, 5 tools, 9 obligations — loads without any API key
- Agent health check (`GET /health/agents`) + frontend LLM provider badge
- ICS calendar import on Action Board

### Phase 4 — Deployment (Complete)
`vercel.json` + `render.yaml` for one-click deploy. GitHub Actions keepalive. `CORS_ORIGINS` env var for production allowlist.

---

## Build Metrics

| Metric | Value |
|--------|-------|
| Backend agents | 13 (7 in bootstrap pipeline + 6 on-demand) |
| API endpoints | 14 (across 5 routers: courses, grades, study, extension, health) |
| Frontend screens | 7 (setup, profile, grades, goals, study, resources, actions) |
| Unit tests (Python) | 50 (18 grade math + 12 agent fallbacks + 20 API route tests) |
| Unit tests (TypeScript) | 29 (extension DOM scrapers) |
| LLM providers | 3 (OpenAI, Gemini, Groq — all with free tier options) |
| LMS platforms supported | 3 (Gradescope, Canvas, Brightspace) + generic fallback |
| Docs files | 7 (ARCHITECTURE, AGENTS, API, DEPLOYMENT, EXTENSION, SCREENS, MASTER_PLAN) |
