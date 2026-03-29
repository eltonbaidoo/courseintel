# CourseIntel — Deployment Guide

Three services to deploy: **Supabase** (database + auth), **Render** (FastAPI backend), **Vercel** (Next.js frontend). The Chrome extension can be sideloaded for demos or published to the Chrome Web Store.

---

## 1. Supabase — Database & Auth

### Create a Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Save your database password (you won't see it again)

### Run the Schema

In the Supabase dashboard: **SQL Editor** → New query → paste the contents of `backend/db/schema.sql` → Run.

This creates three tables (`courses`, `grade_entries`, `study_materials`) with Row Level Security enabled.

### Collect Your Credentials

From **Settings → API**:

| Value | Where to find it | Used in |
|-------|-----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Frontend `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / public key | Frontend `.env.local` |
| `SUPABASE_URL` | Project URL | Backend `.env` |
| `SUPABASE_SERVICE_KEY` | `service_role` key | Backend `.env` — never expose to client |
| `SUPABASE_JWT_SECRET` | Settings → API → JWT Secret | Backend `.env` |

### Enable Auth

In **Authentication → Settings**:
- Enable Email provider (for email/password sign-up)
- Set **Site URL** to your Vercel production URL (e.g. `https://courseintel.vercel.app`)
- Add your Vercel URL to **Redirect URLs** (needed for OAuth flows)

---

## 2. Render — FastAPI Backend

### Create a Web Service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set the root directory to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Environment: **Python 3**

### Environment Variables

Set these in Render's **Environment** tab:

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Your OpenAI API key (get at platform.openai.com) |
| `TAVILY_API_KEY` | Your Tavily API key (get at tavily.com) |
| `SUPABASE_URL` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | From Supabase → Settings → API (service_role key) |
| `SUPABASE_JWT_SECRET` | From Supabase → Settings → API → JWT Secret |
| `CORS_ORIGINS` | Your Vercel URL, e.g. `https://courseintel.vercel.app` |
| `DEV_AUTH_BYPASS` | `false` |
| `INTERNAL_HEALTH_TOKEN` | A random secret string (also set in Vercel as `NEXT_PUBLIC_HEALTH_TOKEN`) |

### Free Tier Keep-Alive

Render free instances spin down after 15 minutes of inactivity, causing a 30–60s cold start.
Add a cron ping to `GET /health` every 10 minutes via [cron-job.org](https://cron-job.org) or
a GitHub Actions workflow to prevent spin-down during demos.

```yaml
# .github/workflows/keepalive.yml
name: Keep Backend Alive
on:
  schedule:
    - cron: "*/10 * * * *"
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s ${{ secrets.BACKEND_URL }}/health
```

---

## 3. Vercel — Next.js Frontend

### Deploy

```bash
cd frontend
npm run build   # verify locally first
```

Then push to GitHub and connect the `frontend/` directory in Vercel:

1. Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Set **Root Directory** to `frontend`
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### Environment Variables

Set these in Vercel's **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g. `https://courseintel-api.onrender.com`) |
| `NEXT_PUBLIC_HEALTH_TOKEN` | Must match `INTERNAL_HEALTH_TOKEN` in backend |

### Custom Domain (optional)

In Vercel → Settings → Domains, add your domain. Then update Supabase Auth Settings → Site URL
and Redirect URLs to match.

---

## 4. Chrome Extension — Sideload or Publish

### Build

```bash
cd extension
npm install
npm run build
```

Output is in `extension/dist/`.

### Sideload for Demo

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `extension/dist/` folder
4. The CourseIntel icon appears in your toolbar

### Configure Extension

In `extension/src/config.ts` (or `.env`), set `API_URL` to your Render backend URL before building.

### Publish to Chrome Web Store

1. Zip the `dist/` folder: `cd extension && zip -r courseintel-extension.zip dist/`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the zip, fill in store listing details, screenshots, and privacy policy
4. Submit for review (typically 1–3 business days)

---

## 5. Production Checklist

Before going live, verify each item:

**Backend**
- [ ] `DEV_AUTH_BYPASS=false` — dev token disabled in production
- [ ] `CORS_ORIGINS` set to exact Vercel URL (not `*`)
- [ ] `INTERNAL_HEALTH_TOKEN` set and matches frontend
- [ ] `OPENAI_API_KEY` and `TAVILY_API_KEY` active and have sufficient credits
- [ ] `SUPABASE_SERVICE_KEY` is the `service_role` key (not `anon`)

**Frontend**
- [ ] `NEXT_PUBLIC_API_URL` points to production Render URL (not localhost)
- [ ] No `DEV_BEARER_TOKEN` in production env vars (or `DEV_AUTH_BYPASS=false` on backend)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are production values

**Supabase**
- [ ] `schema.sql` has been run and all 3 tables exist
- [ ] RLS is enabled on all tables (verify in Supabase → Table Editor → RLS)
- [ ] Site URL and Redirect URLs updated to production domain

**Smoke Test**
```bash
# 1. Backend health
curl https://your-app.onrender.com/health
# → {"status":"ok"}

# 2. Auth (should reject)
curl https://your-app.onrender.com/courses/
# → 401

# 3. Frontend
open https://your-app.vercel.app
# → Landing page loads, sign up works, course bootstrap runs
```

---

## Local Development Reference

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in API keys
uvicorn main:app --reload

# Frontend (in a separate terminal)
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase + API URL
npm run dev

# Extension (optional)
cd extension
npm install && npm run build
# Load extension/dist/ in chrome://extensions
```

With `DEV_AUTH_BYPASS=true` in `backend/.env` and matching `NEXT_PUBLIC_DEV_BEARER_TOKEN`
in `frontend/.env.local`, you can use the full app locally without Supabase Auth configured.
