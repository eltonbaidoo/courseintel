# CourseIntel

> Understand your course. Discover the tools. Predict your outcome. Know what to do next.

A multi-agent academic intelligence engine connected to a Chrome extension.

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

## Architecture

```
backend/      FastAPI + agents (OpenAI: gpt-4o / gpt-4o-mini)
frontend/     Next.js App Router — dashboard, auth, landing
extension/    Chrome Manifest V3 — content script + service worker
```

See `../Doc/EXECUTION_PLAN.md` for the full phased build plan.

---

## Environment Variables

### Backend — `backend/.env` (copy from `.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes (for LLM agents) | Chat Completions for all agents |
| `TAVILY_API_KEY` | Yes | Web search / discovery |
| `SUPABASE_URL` | Yes | Project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (server only) |
| `SUPABASE_JWT_SECRET` | Yes | JWT verification (`Settings` → JWT) |
| `CORS_ORIGINS` | No | Default `http://localhost:3000` |
| `INTERNAL_HEALTH_TOKEN` | No | Protects `GET /health/llm`; optional dashboard LLM badge |
| `MAX_UPLOAD_BYTES` | No | Default 10 MB |
| `RATE_LIMIT_PER_MINUTE` | No | Default 30 |

### Frontend — `frontend/.env.local` (copy from `.env.local.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `NEXT_PUBLIC_API_URL` | Yes (for API features) | Backend base URL, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_HEALTH_TOKEN` | No | Must match `INTERNAL_HEALTH_TOKEN` to show LLM status on dashboard |

### Quick progress check

1. **Backend**: `cd backend && uvicorn main:app --reload` then `curl http://localhost:8000/health` → `{"status":"ok"}`.
2. **Frontend**: `cd frontend && npm run dev` → open `http://localhost:3000`.
3. **Full stack**: With both env files filled, sign up/in, add a course — agent routes need `OPENAI_API_KEY` + Tavily + Supabase.

### Low-memory local development

Running **Next.js dev (especially Turbopack)** and **`uvicorn --reload`** together can use multiple GB of RAM.

**Frontend (pick one):**

| Command | When to use |
|---------|-------------|
| `npm run dev` | Default: **webpack** dev server, source maps off, Node heap capped at **~3 GB** (lighter than Turbopack on many machines). |
| `npm run dev:turbo` | Faster refresh if you have RAM to spare. |
| `npm run dev:prod` | **Lowest steady RAM**: production server after a one-time `build` (no hot reload — rebuild after code changes). |

Scripts use **`cross-env`** so `NODE_OPTIONS` works on macOS, Linux, and Windows.

**Backend — avoid the reloader (saves ~1 extra Python process):**

```bash
cd backend
# Restart this yourself when you change Python code
uvicorn main:app --host 127.0.0.1 --port 8000
```

Use `--reload` only when you need auto-restart on file saves.

**Also try:** run only one service at a time (e.g. backend first, then frontend) while debugging, or close other heavy apps (browsers with many tabs, Docker, etc.).
