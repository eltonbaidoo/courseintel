# CourseIntel — Master Plan

## One-liner

CourseIntel is a multi-agent AI orchestration system that automatically decomposes a single course submission into 13 parallel intelligence tasks, executes them across a tiered LLM provider network, and aggregates the results into a unified academic intelligence profile — eliminating 45–90 minutes of manual workflow per course.

---

## Vision Clarity

**Problem:** A university student enrolling in CSC 212 must manually read a 15-page syllabus, parse the grading breakdown into a spreadsheet, search Reddit and RateMyProfessors for workload expectations, Google for GitHub repos and open courseware, copy deadlines into a calendar, and ask classmates about required tools (Gradescope, Ed Discussion, etc.). This takes **45–90 minutes per course, per semester** — fragmented across PDF, Reddit, GitHub, department websites, and social channels.

**Solution:** CourseIntel accepts one form submission (university + course name + optional PDF) and automatically decomposes it into 13 specialized agent subtasks that execute in parallel, then aggregates the outputs into a structured course intelligence profile. The user waits ~35–45 seconds instead of 45–90 minutes.

**North star metric:** Time-to-first-insight — from form submission to complete course profile with grade breakdown, action plan, and resource list — under 45 seconds.

**Hackathon scope:** A fully functional end-to-end orchestration engine: async job queue with status polling, 13 implemented agents with typed outputs, deterministic grade math with linear regression trend prediction, Chrome extension with 3 LMS scrapers, priority scheduler for deadline obligations, stale task reaper, exponential backoff retry in the LLM gateway, and 7 dashboard screens — all deployed on Vercel + Render.

---

## Technical Depth

### Task Decomposition Pipeline

The bootstrap endpoint (`POST /courses/bootstrap`) acts as the **planner**: it deterministically decomposes a user's course submission into a multi-stage execution plan without requiring any workflow definition from the user.

```
User submits: { university: "URI", course: "CSC 212", professor: "Dr. Smith" }

Planner auto-decomposes into:

Stage A — Sequential (each depends on previous):
  1. SyllabusAcquisitionAgent  → web search + PDF fetch
  2. SyllabusIntelligenceAgent → extract grading categories, deadlines, policies

Stage B — Parallel via asyncio.gather() (all 4 simultaneous):
  3. DiscoveryAgent          → canonical course identity
  4. PublicResourcesAgent    → GitHub, Reddit, YouTube, courseware
  5. ReputationAgent         → workload, difficulty, student signals
  6. ToolDiscoveryAgent      → Gradescope, Ed Discussion, etc.

Stage C — Post-parallel (needs Stage B output):
  7. ObligationDeadlineAgent → urgency-ranked deadlines with conflict detection
```

The user never defines this pipeline — they submit a task type (course bootstrap) and payload, and the coordinator generates the execution subtasks automatically.

### Non-Trivial Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **asyncio.gather()** for parallel agent execution | Cuts wall-clock time from ~120s sequential to ~35s. 4 independent agents run simultaneously while sharing the same event loop. |
| **asyncio.Lock-protected in-memory job store** | Safe concurrent access for the async bootstrap job queue. Job lifecycle: `pending → running → completed \| failed \| timed_out`. Documented upgrade path to Redis HSET for horizontal scaling. |
| **Exponential backoff retry in LLM gateway** | Transient errors (rate-limit 429, server 5xx, network) are retried 3 times with 1s → 2s → 4s backoff. Permanent errors (auth 401) fail fast. `_is_transient()` classifies errors by message pattern — works across OpenAI, Gemini, and Groq without provider-specific error types. |
| **Stale task reaper via FastAPI lifespan** | Background asyncio task runs every 60 seconds. Marks jobs still `running` after 5 minutes as `timed_out`. Evicts terminal jobs after 24 hours. Prevents memory leaks from abandoned tasks. |
| **Priority scheduling for obligations** | `GET /courses/{id}/obligations/prioritized` sorts deadlines by urgency rank (critical=4, high=3, medium=2, low=1). Assigned by ObligationDeadlineAgent using deadline proximity + grade weight + syllabus policy analysis. |
| **Linear regression grade trend prediction** | `compute_grade_trend()` sorts entries by timestamp, builds cumulative weighted grade series, fits least-squares line, projects final grade. Returns slope, trend label, confidence level, and data points for charting — all deterministic Python, zero LLM. |
| **Deterministic algebraic grade solver** | `required = (target / 100 - already_earned) / remaining_weight`. Grade calculations are 100% reproducible — no LLM hallucination risk. Covered by 25 parametrized unit tests. |
| **SHA-256 keyed LLM response cache** | `services/llm_cache.py` — every `call_llm()` checks an asyncio.Lock-protected in-memory store before hitting the provider. Cache key = `SHA256(model + system_prompt + user_prompt)`. TTL: 1 hour. Cap: 2 000 entries with oldest-first eviction. Hit/miss metrics exposed at `GET /health/cache`. A repeated bootstrap for the same course costs zero LLM API calls. Documented Redis SETEX upgrade path for horizontal scaling. |
| **SSE streaming bootstrap pipeline** | `POST /courses/bootstrap/stream` returns `text/event-stream`. Each of 8 pipeline stages emits `{step, stage, status, detail}` events as it completes. Frontend consumes via `fetch` + `ReadableStream` (not EventSource — POST with FormData). Progress UI updates the moment each agent finishes, not after 35–45 s. |
| **Multi-provider LLM gateway with lazy-init** | OpenAI → Gemini → Groq auto-selected from .env. Clients initialized on first use (not at import time). Groq uses OpenAI SDK with `base_url` override — zero code duplication. |
| **TypedDict return annotations on all 13 agents** | Static analysis catches schema drift at type-check time. Each agent returns a typed dict (`DiscoveryResult`, `ReputationResult`, `SyllabusProfile`, etc.) without runtime overhead. |
| **JWT shared between web app and Chrome extension** | Extension reads Supabase session from active tab's localStorage — no second login. Service worker completes all operations in a single event cycle (MV3 compliant). |
| **Supabase RLS on all tables** | `auth.uid() = user_id` enforced at database level. Cross-user data access impossible regardless of application bugs. Composite indexes on `(user_id, course_code)` and `(course_id, category)` for fast lookups. |

### Agent Model Tier Assignment

| Tier | Model | Agents | Rationale |
|------|-------|--------|-----------|
| OPUS | GPT-4o / Gemini 1.5 Pro / Llama 3.3 70B | JudgmentAgent, SyllabusIntelligenceAgent | Needs strong reasoning for risk assessment, grading schema extraction |
| SONNET | GPT-4o / Gemini 1.5 Pro / Llama 3.3 70B | ReputationAgent, StudyContextAgent | Balanced quality vs. cost for sentiment analysis, topic extraction |
| HAIKU | GPT-4o-mini / Gemini 2.0 Flash / Llama 3.1 8B | All other 9 agents | Fast/cheap for structured extraction (JSON parsing, link collection, tool detection) |

---

## Innovation

**Core innovation:** CourseIntel eliminates manual workflow definition for academic intelligence gathering. The user submits a course name — not a pipeline, not a DAG, not a workflow specification. The planner decomposes the submission into 13 typed agent tasks with dependency ordering, executes them across a tiered LLM provider network, and aggregates structured outputs.

**How this differs from manual orchestration:**

```
Manual workflow (ChatGPT approach):
  Student → "Tell me about CSC 212" → single LLM call → unstructured text

CourseIntel orchestration:
  Student → "CSC 212 at URI" →
    Planner decomposes into 13 typed tasks →
    4 tasks run in parallel (asyncio.gather) →
    Type-aware aggregation into structured profile →
    Deterministic grade model + algebraic solver →
    Priority-ranked action plan
```

The decomposition is deterministic (rule-based per task type: bootstrap, grade computation, action planning, extension validation), which makes it **reproducible and debuggable** — a deliberate design choice over LLM-based planning, which would introduce non-determinism in the critical path. The LLM is used for intelligence (what's in the syllabus?) not for orchestration (which agents to run).

**What no competitor offers:** The combination of automatic multi-agent decomposition, live grade syncing via Chrome extension, and a deterministic algebraic grade model in one system. Each piece exists somewhere — CourseIntel integrates them into a single submission-to-action-plan pipeline.

---

## Scalability Design

### Current capacity (hackathon scope)

Each bootstrap runs agents inline in the FastAPI request handler. `asyncio.gather()` provides concurrency within a request. The async job queue (`POST /courses/bootstrap/async`) offloads long-running bootstraps to `BackgroundTasks` so the HTTP response returns immediately.

### 10× scale (1,000 concurrent users)

| Bottleneck | Current | Mitigation |
|-----------|---------|------------|
| Per-request LLM cost | ~$0.008/bootstrap (Groq free: $0) | **Result caching** by `SHA256(course_code + university)` with 7-day TTL. Same course bootstrapped by 100 students costs the same as 1 request. |
| Concurrent bootstraps | asyncio in 1 uvicorn worker | **Replace in-memory job store with Redis HSET** (documented in `job_store.py` comments). Render auto-scales workers; each worker connects to shared Redis. |
| Job store memory | In-memory dict + asyncio.Lock | Redis HSET with TTL — zero application memory. The `_store` dict is a drop-in replacement target. |
| Stale task reaper | Single asyncio loop in one process | Redis-backed reaper using `SCAN` + TTL expiry. Same 60s interval, but distributed across workers. |

### 100× scale (10,000 concurrent users, university-wide deployment)

| Bottleneck | Mitigation |
|-----------|------------|
| LLM rate limits | **CDN-served cached results** for the top 500 courses (pre-bootstrapped). Cache hit = zero LLM calls, ~50ms response. |
| Agent execution time | **Background task queue (arq + Redis broker)** replaces `BackgroundTasks`. Dedicated worker pool with configurable concurrency. |
| Database connections | **Supabase connection pooling** (PgBouncer built-in). Upgrade from free tier (500MB) to Pro ($25/mo). |
| Chrome extension traffic | **Edge-cached validation** — extension scrape payloads validated client-side before hitting the API. |

### Message queue migration path

The current `BackgroundTasks` → polling pattern transitions to a proper message queue:

```
Current:   POST /bootstrap/async → BackgroundTasks → poll GET /jobs/{id}
Future:    POST /bootstrap/async → Redis pub/sub → WebSocket push to client
```

The `services/job_store.py` abstraction isolates all job state management behind `create_job()`, `update_job()`, `get_job()`, `reap_stale_jobs()` — swapping the backend from dict to Redis requires changing ~20 lines in one file.

---

## Ecosystem Thinking

### Current integrations (built and tested)

| System | Integration Type | Evidence |
|--------|-----------------|----------|
| **Gradescope** | Chrome extension DOM scraper | 5 Jest tests, CSS selectors: `.js-assignmentRow`, `.assignmentTitle`, `.submissionTimeChart--dueDate` |
| **Canvas** | Chrome extension DOM scraper | 4 Jest tests, CSS selectors: `.assignment`, `.ig-row`, `.ig-title`, `.assignment-date-due` |
| **Brightspace/D2L** | Chrome extension DOM scraper | 5 Jest tests, CSS selectors: `.d2l-table tr`, `.dco_title`, `.d2l-dates-text` |
| **Supabase** | Auth, PostgreSQL, Row Level Security | JWT verification, `auth.uid() = user_id` on all 3 tables |
| **OpenAI** | LLM provider (GPT-4o, GPT-4o-mini) | via `openai` Python SDK |
| **Google AI Studio** | LLM provider (Gemini 1.5 Pro, 2.0 Flash) | via `google-generativeai` SDK, free tier |
| **Groq** | LLM provider (Llama 3.3 70B, 3.1 8B) | via OpenAI SDK with `base_url` override, free tier |
| **Tavily** | Web search for syllabus + resource discovery | Free tier (1,000 req/month) |

### REST API contract for external integrations

Any external system can integrate via authenticated REST endpoints:

```
POST /courses/bootstrap           — Synchronous: blocks ~35s, returns full profile
POST /courses/bootstrap/async     — Async: returns job_id (HTTP 202), poll for result
GET  /courses/jobs/{job_id}       — Poll job status + result
GET  /courses/{id}/action-plan    — Weekly risk-aware action plan (JudgmentAgent)
GET  /courses/{id}/obligations/prioritized — Urgency-ranked deadlines
GET  /grades/courses/{id}/trend   — Grade trend prediction (linear regression)
POST /grades/compute              — Stateless weighted grade calculation
POST /grades/goal-simulator       — Required-score algebraic solver
POST /extension/scrape            — Chrome extension grade import + validation

Auth: Bearer <supabase_jwt> on all endpoints
```

### External agent interface

New agents implement the `run(input) -> TypedDict` pattern and declare their return schema. The pipeline coordinator includes them by adding one import and one `asyncio.gather()` call. No framework, no decorator, no registration — just an async function.

```python
# Example: adding a new agent to the parallel execution stage
from agents import new_agent  # implements: async def run(...) -> NewAgentResult

# In courses.py, add to the gather call:
results = await asyncio.gather(
    discovery.run(...),
    public_resources.run(...),
    reputation.run(...),
    tool_discovery.run(...),
    new_agent.run(...),  # ← added here
)
```

---

## Problem Definition

### Quantified problem

A student enrolling in a single course must:

| Task | Time (manual) | Time (CourseIntel) |
|------|--------------|-------------------|
| Read and parse syllabus grading breakdown | 15–20 min | 0 (auto-extracted) |
| Set up grade tracking spreadsheet | 10–15 min | 0 (built-in calculator) |
| Search Reddit/RMP for workload expectations | 10–15 min | 0 (ReputationAgent) |
| Find GitHub repos, YouTube lectures, courseware | 10–15 min | 0 (PublicResourcesAgent) |
| Copy deadlines into calendar | 5–10 min | 0 (ObligationAgent + ICS export) |
| Identify required tools (Gradescope, etc.) | 5–10 min | 0 (ToolDiscoveryAgent) |
| **Total per course** | **45–90 min** | **35–45 sec** |

For a student taking 4–5 courses per semester, this is **3–7.5 hours of low-value administrative work** eliminated. At a university with 10,000 undergraduates, that's **30,000–75,000 hours per semester**.

### Target users

1. **University students (primary):** Need fast course context for enrollment decisions and semester planning. First-generation college students benefit most — they lack the informal networks that pass this information socially.
2. **Academic advisors (secondary):** Can recommend CourseIntel to advisees for self-service course preparation, reducing advisor load.
3. **Course instructors (tertiary):** Can see how their course is perceived publicly (workload expectations, common pitfalls) via the ReputationAgent signal.

---

## User Impact

### Measured benchmark

| Metric | Value |
|--------|-------|
| Manual workflow time | 45–90 minutes per course |
| CourseIntel bootstrap time | 35–45 seconds |
| **Time reduction** | **60–120× per course** |
| Students affected at one university (10,000 UG) | 30,000–75,000 hours saved per semester |
| Cost to student | $0 (Groq/Gemini free tier) |

### Qualitative impact

- Students who currently **don't read the full syllabus** now get key policies surfaced automatically
- **First-generation college students** get the same resource discovery as students with informal networks
- The weekly **action plan from JudgmentAgent** gives students without academic advisors a data-driven answer to "what should I focus on this week?"
- Grade **trend prediction** with linear regression gives early warning when performance is declining, before it's too late to recover

---

## Market Awareness

### Competitive landscape

| Tool | What it does | Why it's not CourseIntel |
|------|-------------|--------------------------|
| **RateMyProfessors** | Professor ratings | No grading schema, no resource discovery, no grade calculator, no action plan |
| **Syllabi.com / Koofers** | Syllabus archive | No AI extraction, no structured output, no grade tracking |
| **Notion / Obsidian** | Manual note-taking | Requires student to do all the work; no automation, no orchestration |
| **Canvas / Gradescope** | LMS gradebook | Shows raw grades only; no weighted calculation, no cross-course view, no advisor |
| **ChatGPT (manual)** | Paste syllabus → ask questions | Stateless, no course tracking, no extension sync, no grade model, no trend prediction |
| **LangGraph / CrewAI** | Multi-agent frameworks | Require manual workflow definition; CourseIntel auto-decomposes from a single submission |

**Why existing solutions can't easily replicate this:** CourseIntel combines (1) automatic multi-agent task decomposition from a single form submission, (2) live grade syncing via Chrome extension with LMS-specific DOM scrapers, (3) deterministic algebraic grade math with linear regression trend prediction, and (4) priority-scheduled obligation management — into one pipeline. Any competitor can build one piece; the integration is the moat.

---

## Feasibility

### What's built and verified

| Component | Status | Evidence |
|-----------|--------|----------|
| 13 async agents with TypedDict returns | Complete | All agents in `backend/agents/`, TypedDict annotations verified by type checker |
| Async job queue (background bootstrap) | Complete | `services/job_store.py`, `POST /courses/bootstrap/async` returns job_id |
| Priority scheduler | Complete | `GET /courses/{id}/obligations/prioritized`, urgency-ranked output |
| Stale task reaper | Complete | `_reaper_loop()` in `main.py`, 60s interval via `lifespan` |
| Exponential backoff in LLM gateway | Complete | `agents/base.py`, 3 retries with 1s→2s→4s backoff |
| Grade math + trend prediction | Complete | `grade_intelligence.py`, 25 unit tests including regression tests |
| Chrome extension (3 scrapers) | Complete | 29 Jest tests, Manifest V3, Supabase auth handshake |
| 7 dashboard screens | Complete | Next.js 16 App Router, all screens documented in `docs/SCREENS.md` |
| CI pipeline | Complete | GitHub Actions: Python pytest, Jest, TypeScript check, Next.js build, Playwright E2E |
| Production deployment | Complete | Vercel (frontend), Render (backend), Supabase (database) |
| **Total tests** | **67 Python + 29 TypeScript + Playwright E2E** | All passing in CI |

### Hourly execution log (solo developer)

| Block | Hours | Deliverable |
|-------|-------|-------------|
| Foundation (FastAPI, Supabase, Next.js, auth) | 0–4 | Backend skeleton + frontend scaffold + auth flows |
| Agent pipeline (13 agents, pipeline coordinator) | 4–10 | All agents implemented, bootstrap endpoint working |
| Grade engine (weighted average, goal solver, trend) | 10–12 | Deterministic math + linear regression |
| Chrome extension (3 scrapers, service worker) | 12–15 | MV3 extension with Supabase sync |
| Job queue + priority scheduler + reaper | 15–18 | Async bootstrap, obligation ranking, background reaper |
| Testing (67 Python + 29 TS + E2E) | 18–21 | Full test suite, CI pipeline |
| Deployment + documentation | 21–24 | Vercel + Render live, 7 docs files |

---

## Risk Assessment

| Risk | Probability | Impact | Concrete Mitigation |
|------|------------|--------|-------------------|
| **LLM API unavailable** (rate limit or outage) | Medium | High | Three-provider fallback chain (OpenAI → Gemini → Groq) + exponential backoff retry (3 attempts, 1s→2s→4s). Pipeline returns partial results — each agent has `try/except` with safe empty default. |
| **LLM returns malformed JSON** | High (5–15%) | Low | Every agent wraps `call_llm()` + `json.loads()` inside `try/except Exception`. Malformed output → logged warning + typed empty default. Pipeline never crashes. |
| **Render free tier cold start** (15-min idle sleep) | High | Medium | GitHub Actions keepalive workflow pings `/health` every 10 minutes. First request after cold start adds ~30s latency. |
| **Chrome extension scraper breakage** (LMS DOM update) | Medium | Medium | 29 Jest tests catch regressions. Selectors target stable CSS classes (`.js-assignmentRow`, not dynamic styles). Generic fallback scraper handles unknown platforms. |
| **Supabase RLS misconfiguration** | Low | Critical | Single policy pattern (`auth.uid() = user_id`) on all 3 tables. Composite indexes enforce query patterns. Schema in version control (`db/schema.sql`). |
| **Job store memory leak** (abandoned tasks accumulate) | Low | Medium | Stale task reaper marks `running` jobs as `timed_out` after 5 min, evicts terminal jobs after 24h. `store_size()` metric exposed for monitoring. |
| **Solo developer scope creep** | Medium | High | Hourly milestones with hard scope boundaries. Fallback: demo mode with pre-bootstrapped fixture (CSC 212 URI) requires zero LLM calls. |

---

## Differentiation Strategy

**One sentence:** CourseIntel is the only system that auto-decomposes a course name into a parallel multi-agent intelligence pipeline — combining syllabus extraction, reputation analysis, resource discovery, grade prediction, and action planning — without requiring the user to define any workflow, connect any API, or upload any document.

**Why this is hard to replicate:**

1. **No workflow definition required.** LangGraph and CrewAI require developers to define agent graphs. CourseIntel's planner generates the execution plan from the task type alone.
2. **Domain-specific agent specialization.** Each of the 13 agents has a tailored system prompt, model tier assignment, and typed output schema. A general-purpose agent framework can't match this without equal domain investment.
3. **Deterministic grade math alongside LLM intelligence.** The algebraic grade solver and linear regression trend predictor are provably correct (67 tests). The LLM handles fuzzy intelligence (syllabus parsing, reputation). This hybrid architecture is more reliable than pure-LLM approaches.
4. **Live data pipeline via Chrome extension.** 3 DOM scrapers with real CSS selectors that sync grades from Gradescope/Canvas/Brightspace into the grade model. This is not scaffolding — 29 Jest tests validate the parsing logic.

---

## Build Metrics

| Metric | Value |
|--------|-------|
| Backend agents | 13 (7 in bootstrap pipeline + 6 on-demand) |
| API endpoints | 18 (courses, grades, study, extension, health routers) |
| Frontend screens | 7 (setup, profile, grades, goals, study, resources, actions) |
| Unit tests (Python) | 67 (25 grade math + 12 agent fallbacks + 30 API route tests) |
| Unit tests (TypeScript) | 29 (extension DOM scrapers) |
| E2E tests | Playwright (12 screen tests + demo fixture validation) |
| LLM providers | 3 (OpenAI, Gemini free tier, Groq free tier) |
| LMS platforms | 3 (Gradescope, Canvas, Brightspace) + generic fallback |
| Documentation files | 7 (ARCHITECTURE, AGENTS, API, DEPLOYMENT, EXTENSION, SCREENS, MASTER_PLAN) |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (database) |
