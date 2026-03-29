# CourseIntel — Architecture

## System Overview

CourseIntel is a three-layer system: a Chrome extension scrapes live grade data from campus LMS platforms, a Next.js frontend provides the student dashboard, and a FastAPI backend runs the multi-agent intelligence pipeline backed by Supabase.

```
┌──────────────────────────────────────────────────────────────────────┐
│  CHROME EXTENSION (Manifest V3)                                      │
│                                                                      │
│  popup/          — platform detection UI, one-click import trigger   │
│  content/        — DOM scrapers for Gradescope, Canvas, Brightspace  │
│  background/     — service worker: auth handshake, API POST          │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ POST /extension/scrape
                              │ Authorization: Bearer <supabase_jwt>
┌─────────────────────────────▼────────────────────────────────────────┐
│  NEXT.JS 16 FRONTEND (App Router · TypeScript · Tailwind)            │
│                                                                      │
│  app/(auth)/          — login, signup, verify, demo onboarding       │
│  app/dashboard/       — course list, course sub-screens              │
│  components/landing/  — landing page with 3D scene, integrations     │
│  lib/api.ts           — typed API client (fetch + auth headers)      │
│  hooks/               — useBootstrap, useCourse, useComputeGrade     │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ REST (Bearer JWT)
                              │ Content-Type: application/json
┌─────────────────────────────▼────────────────────────────────────────┐
│  FASTAPI BACKEND (Python 3.11)                                       │
│                                                                      │
│  api/routes/courses.py   — bootstrap pipeline coordinator            │
│  api/routes/grades.py    — grade CRUD + computation                  │
│  api/routes/study.py     — material upload + AI analysis             │
│  api/routes/extension.py — scrape validation + orchestration         │
│  api/deps.py             — JWT auth dependency (Supabase + Clerk)    │
│  agents/                 — 13 specialized agents (see AGENTS.md)     │
│  services/pdf_parser.py  — PDF text extraction                       │
│  db/queries.py           — Supabase database access layer            │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ Supabase JS client (service key)
┌─────────────────────────────▼────────────────────────────────────────┐
│  SUPABASE (PostgreSQL + Auth + Row Level Security)                   │
│                                                                      │
│  courses          — course profiles + all bootstrap JSONB data       │
│  grade_entries    — individual assignment scores                      │
│  study_materials  — uploaded notes and extracted text                │
│                                                                      │
│  RLS: auth.uid() = user_id enforced on all tables                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Bootstrap Pipeline Data Flow

`POST /courses/bootstrap` is the **pipeline coordinator** in `backend/api/routes/courses.py`.

```
Student submits form
  university: "University of Rhode Island"
  course: "CSC 212"
  professor: "Marco Alvarez"  (optional)
  syllabus: file.pdf          (optional)
        │
        ▼
1. INPUT VALIDATION
   _sanitize_str() — strips whitespace, enforces 256-char max
   PDF check — MIME type + magic byte (%PDF header)
        │
        ▼
2. SYLLABUS ACQUISITION
   If PDF uploaded:
     → extract_text_from_pdf_bytes() (services/pdf_parser.py)
     → confidence: 1.0, source: "upload"
   If no PDF:
     → syllabus_acquisition.run(course, university, professor)
     → Tavily web search → finds syllabus URL → fetches text
     → returns {found, confidence, source, syllabus_text}
        │
        ▼
3. SYLLABUS INTELLIGENCE  (sequential — needs syllabus text)
   → syllabus_intelligence.run(syllabus_text)
   → GPT-4o extracts:
       grading_categories: [{name, weight, assignment_types}]
       key_deadlines: [{title, date, type, weight_pct}]
       late_policy: string
       grade_scale: {A: 93, A-: 90, ...}
        │
        ▼
4. PARALLEL AGENTS  (asyncio.gather — all 4 run simultaneously)
   ┌─────────────────────────────────────────────────────────┐
   │ discovery.run()        → canonical_name, course_code,   │
   │                          credit_hours, official_links   │
   │                                                         │
   │ public_resources.run() → GitHub repos, open courseware, │
   │                          Reddit threads, YouTube        │
   │                                                         │
   │ reputation.run()       → workload_hours, difficulty,    │
   │                          grading_style, common_pitfalls │
   │                                                         │
   │ tool_discovery.run()   → [{tool_name, category,         │
   │                            confidence, signup_url}]     │
   └─────────────────────────────────────────────────────────┘
        │
        ▼
5. DATABASE PERSIST
   queries.create_course(user_id, {
     university, course_name, course_code, professor,
     course_identity, course_profile, resources,
     detected_tools, student_signal, syllabus_status
   })
   All bootstrap outputs stored as JSONB columns.
   On DB failure: returns data anyway (local-first).
        │
        ▼
6. RESPONSE  →  Frontend unlocks dashboard
   {id, course_identity, course_profile, resources,
    detected_tools, student_signal, syllabus_status}
```

**Typical timing:** 15–45s (dominated by web search latency from Tavily)
**With PDF upload:** 8–20s (skips SyllabusAcquisition web search)

---

## Grade Math Engine

`backend/agents/grade_intelligence.py` — **zero LLM involvement**.

### `compute_current_grade(entries, categories)`

```python
# For each category: average all scores in that category
category_scores[cat].append(score_earned / score_possible)
category_avg = mean(scores_in_category)

# Weighted sum across categories
weighted_total = Σ(category_avg × category_weight)
earned_weight  = Σ(category_weight for categories with entries)

current_grade = weighted_total / earned_weight
```

Returns: `{current_grade_pct, letter_grade, category_breakdown, weight_graded}`

### `compute_required_scores(current_grade_pct, target_pct, remaining_weight)`

```python
# Solve algebraically: what score X on remaining work hits target?
already_earned = current_grade_pct × (1 - remaining_weight) / 100
required = (target_pct / 100 - already_earned) / remaining_weight

# feasible = True if required ≤ 1.0 (≤ 100%)
```

Returns: `{required_pct, feasible, message}`

Letter grade thresholds: A=93, A-=90, B+=87, B=83, B-=80, C+=77, C=73, C-=70, D=60, F=<60.

---

## Database Schema

Three tables in Supabase PostgreSQL. Full DDL in `backend/db/schema.sql`.

```
courses
  id            uuid PK
  user_id       uuid → auth.users (CASCADE DELETE)
  university    text
  course_name   text
  course_code   text
  professor     text
  course_identity  jsonb   ← DiscoveryAgent output
  syllabus_status  jsonb   ← acquisition metadata
  course_profile   jsonb   ← SyllabusIntelligenceAgent output
  resources        jsonb   ← PublicResourcesAgent output (array)
  detected_tools   jsonb   ← ToolDiscoveryAgent output (array)
  student_signal   jsonb   ← ReputationAgent output
  created_at    timestamptz
  updated_at    timestamptz (auto-updated via trigger)

grade_entries
  id               uuid PK
  course_id        uuid → courses
  user_id          uuid → auth.users
  assignment_title text
  category         text    (must match a category from course_profile)
  score_earned     float
  score_possible   float
  due_date         timestamptz
  source           text    (manual | extension | import)

study_materials
  id          uuid PK
  course_id   uuid → courses
  user_id     uuid → auth.users
  title       text
  file_path   text    (Supabase Storage bucket path)
  content     text    (extracted full text)
  type        text    (notes | slides | textbook | other)
```

**Row Level Security:** All three tables have `auth.uid() = user_id` enforced for all operations (SELECT, INSERT, UPDATE, DELETE). Cross-user data access is impossible at the database level.

**Indexes:** `(user_id)` on courses, `(course_id, user_id)` on grade_entries and study_materials.

---

## Extension Auth Handshake

The extension authenticates using the same Supabase session as the web app — no separate login required.

```
1. Student logs in via Next.js frontend
   → Supabase JS SDK stores session in localStorage
      key: "sb-<project-ref>-auth-token"

2. On extension activation, popup.ts calls:
   chrome.runtime.sendMessage({ type: "GET_AUTH_TOKEN" })

3. Background service worker (service-worker.ts) reads from
   chrome.storage.session (MV3-safe, tab-isolated):
   → Returns stored JWT to popup

4. If no token in storage, background reads from the active tab's
   localStorage via chrome.scripting.executeScript()

5. Every POST to /extension/scrape includes:
   Authorization: Bearer <supabase_jwt>

6. Backend api/deps.py validates JWT via jose library:
   jwt.decode(token, supabase_jwt_secret, algorithms=["HS256"])
   Same validation path as web app requests.
```

Session is valid for 1 hour (Supabase default). Extension automatically uses the
refreshed token on the next activation.

---

## Frontend State Management

### Optimistic UI Pattern

All grade operations update local state first, then confirm with the backend:

```typescript
// 1. Update local state immediately (user sees instant feedback)
setEntries(prev => [...prev, newEntry])

// 2. Fire API call in background
try {
  await api.addGradeEntry(courseId, entry)
} catch {
  // 3. Rollback on failure
  setEntries(prev => prev.filter(e => e.id !== newEntry.id))
  toast({ title: "Failed to save", variant: "error" })
}
```

### Course Data Flow

```
useBootstrap() hook
  → POST /courses/bootstrap (multipart form)
  → stores result in component state
  → router.push(/dashboard/course/[id])

useCourse(id) hook
  → GET /courses/[id]
  → provides course data to all sub-screens

useComputeGrade(id, categories) hook
  → POST /grades/compute (with local entries)
  → recalculates on every entry change
```

### Auth Flow

```
Supabase Auth (primary) → middleware.ts route guard
  → /dashboard/* requires valid Supabase session
  → /login, /signup, /demo are public

Dev bypass (local dev only, DEV_AUTH_BYPASS=true)
  → frontend sends "Bearer courseintel-local-dev-bearer"
  → backend accepts in require_auth() before JWT validation
  → resolved to {sub: "courseintel-dev-local"}
```

---

## Agent Failure Handling

All agents follow the same resilience pattern:

```python
async def run(...) -> dict:
    try:
        raw = await call_llm(SYSTEM, prompt, model=MODEL)
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Agent %s returned non-JSON", __name__)
        return SAFE_EMPTY_RESPONSE  # defined per-agent
    except Exception as exc:
        logger.error("Agent %s failed: %s", __name__, exc)
        return SAFE_EMPTY_RESPONSE
```

The bootstrap pipeline uses `null`-safe access on all agent outputs:

```python
resources = resources_result.get("resources", [])
detected_tools = tools_result.get("tools", [])
```

A failed agent produces an empty result — the rest of the pipeline continues and the
course is saved with partial data. Students can re-bootstrap to retry.
