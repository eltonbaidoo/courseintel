# CourseIntel

> Understand your course. Discover the tools. Predict your outcome. Know what to do next.

A multi-agent academic intelligence engine connected to a Chrome extension. CourseIntel
bootstraps a full intelligence model for any university course in under 90 seconds —
discovering course context, parsing syllabi, modeling grading, and generating a weekly
action plan.

---

## What's Built

| Screen | Route | Description |
|--------|-------|-------------|
| Course Setup | `/dashboard/course/new/setup` | Bootstrap form: university + course + optional PDF syllabus. Runs 8-agent pipeline with live progress animation. |
| Course Profile | `/dashboard/course/[id]` | Risk level badge, course metadata, focus note, upcoming obligations, quick-nav to all sub-screens. |
| Grades Dashboard | `/dashboard/course/[id]/grades` | Weighted grade calculator with per-category breakdown, GradeBar visualization, inline entry add/delete. |
| Goal Simulator | `/dashboard/course/[id]/goals` | Enter target letter grade + remaining weight → required % on remaining work. Algebraic solver, no LLM. |
| Study Buddy | `/dashboard/course/[id]/study` | Upload PDFs/notes → AI identifies weak coverage areas and prioritized study list. |
| Resource Hub | `/dashboard/course/[id]/resources` | Detected platforms (confidence %), public resources (GitHub, open courseware, Reddit), extension Connect buttons. |
| Action Board | `/dashboard/course/[id]/actions` | JudgmentAgent output: risk level, focus note, up to 5 weekly actions with priority + rationale. |

**Chrome Extension:** One-click grade import from Gradescope, Canvas, Blackboard, D2L Brightspace, Schoology, Google Classroom, and more. Validated by `ExtensionValidationAgent` before merging into the grade model.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                                 │
│  content/scraper.ts → background/service-worker.ts              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ POST /extension/scrape (Bearer JWT)
┌───────────────────────────▼─────────────────────────────────────┐
│  Next.js 16 Frontend (Vercel)                                   │
│  App Router · TypeScript · Tailwind CSS                         │
│  7 dashboard screens + landing page + auth flows                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (Bearer JWT)
┌───────────────────────────▼─────────────────────────────────────┐
│  FastAPI Backend (Render)                                       │
│                                                                 │
│  POST /courses/bootstrap — Pipeline Coordinator                 │
│  ├── SyllabusAcquisition (web search + PDF fetch)               │
│  ├── SyllabusIntelligence (GPT-4o — grades, deadlines)          │
│  ├── asyncio.gather() ──────────────────────────────────────┐   │
│  │   DiscoveryAgent     PublicResourcesAgent                 │   │
│  │   ReputationAgent    ToolDiscoveryAgent                   │   │
│  └────────────────────────────────────────────────────────── ┘  │
│  ├── JudgmentAgent (GPT-4o — risk level + action plan)          │
│  └── ObligationDeadlineAgent (urgency ranking)                  │
│                                                                 │
│  Grade Math: deterministic Python (no LLM)                      │
│  compute_current_grade() · compute_required_scores()            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Supabase JS / service key
┌───────────────────────────▼─────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth + Row Level Security)              │
│  courses · grade_entries · study_materials                      │
└─────────────────────────────────────────────────────────────────┘
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full system design, database schema, extension auth handshake, and frontend state patterns.

See [`docs/AGENTS.md`](./docs/AGENTS.md) for the full 13-agent registry, pipeline coordinator, and failure handling.

See [`docs/API.md`](./docs/API.md) for all endpoint schemas and authentication details.

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for Vercel + Render + Supabase production setup.

---

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase + API URL
npm run dev
```

### Extension
```bash
cd extension
npm install
npm run build
# Load dist/ folder in chrome://extensions with Developer Mode on
```

---

## Environment Variables

### Backend: `backend/.env` (copy from `.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | GPT-4o / GPT-4o-mini for all agents |
| `TAVILY_API_KEY` | Yes | Web search for Discovery + SyllabusAcquisition |
| `SUPABASE_URL` | Yes | Project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (backend only, never exposed to client) |
| `SUPABASE_JWT_SECRET` | Yes | JWT verification — copy from Supabase Dashboard → Settings → API → JWT Secret |
| `CORS_ORIGINS` | No | Default `http://localhost:3000`; set to your Vercel domain in production |
| `INTERNAL_HEALTH_TOKEN` | No | Protects `GET /health/llm`; shown as LLM badge on dashboard |
| `MAX_UPLOAD_BYTES` | No | Default 10 MB; max PDF syllabus size |
| `RATE_LIMIT_PER_MINUTE` | No | Default 30 req/IP/min |
| `DEV_AUTH_BYPASS` | No | Default `true` in dev; set `false` in production |
| `DEV_BEARER_TOKEN` | No | Default `courseintel-local-dev-bearer`; must match frontend |

### Frontend: `frontend/.env.local` (copy from `.env.local.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_HEALTH_TOKEN` | No | Must match `INTERNAL_HEALTH_TOKEN` to show LLM badge |
| `NEXT_PUBLIC_DEV_BEARER_TOKEN` | No | Default `courseintel-local-dev-bearer`; must match backend |

### Quick progress check

1. **Backend**: `cd backend && uvicorn main:app --reload` then `curl http://localhost:8000/health` → `{"status":"ok"}`
2. **Frontend**: `cd frontend && npm run dev` → open `http://localhost:3000`
3. **Full stack**: With both env files filled, sign up/in, and bootstrap a course. Agent routes require `OPENAI_API_KEY` + `TAVILY_API_KEY` + Supabase credentials.

---

## Low-Memory Local Development

Running Next.js dev and `uvicorn --reload` together can use multiple GB of RAM.

**Frontend (pick one):**

| Command | When to use |
|---------|-------------|
| `npm run dev` | Default: webpack dev server, Node heap capped at ~3 GB |
| `npm run dev:turbo` | Faster HMR if you have RAM to spare |
| `npm run dev:prod` | Lowest RAM: production build, no hot reload |

**Backend: skip the reloader to save ~1 Python process:**

```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000
```

Use `--reload` only when you need auto-restart on file saves.
