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
backend/      FastAPI + 13 Claude agents (Haiku / Sonnet / Opus)
frontend/     Next.js 14 App Router — 7 screens
extension/    Chrome Manifest V3 — content script + service worker
```

See `../Doc/EXECUTION_PLAN.md` for the full phased build plan.

---

## Environment Variables

| Service | File | Keys needed |
|---|---|---|
| Backend | `backend/.env` | `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| Frontend | `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
