# Security Policy: CourseIntel

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue**.

Email: **security@courseintel.app** (replace with your actual address)

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix

You will receive an acknowledgement within 48 hours. We aim to ship a patch within 14 days of confirmed vulnerabilities.

---

## Secret Management

### Development
- Copy `backend/.env.example` → `backend/.env` and fill in real values
- Copy `frontend/.env.local.example` → `frontend/.env.local`
- **Never commit `.env` files**; they are in `.gitignore`
- Generate `INTERNAL_HEALTH_TOKEN` with: `openssl rand -hex 32`

### Production
- Store all secrets in a dedicated secrets manager (AWS Secrets Manager, GCP Secret Manager, Doppler, etc.)
- Never bake secrets into Docker images or CI environment logs
- Rotate keys immediately if any are accidentally exposed

### Secret Rotation
All secrets can be rotated without downtime:
| Secret | How to rotate |
|---|---|
| `OPENAI_API_KEY` | Rotate in OpenAI dashboard → update secrets manager → redeploy |
| `GOOGLE_API_KEY` | Regenerate in Google AI Studio → update |
| `TAVILY_API_KEY` | Regenerate in Tavily dashboard → update |
| `SUPABASE_JWT_SECRET` | Rotate via Supabase dashboard (invalidates all existing sessions) |
| `SUPABASE_SERVICE_KEY` | Regenerate in Supabase → update backend only |
| `INTERNAL_HEALTH_TOKEN` | Generate new random string → update |

---

## Authentication Model

- All authentication is handled by **Supabase Auth** (industry-standard OAuth/email flows)
- The backend validates Supabase-issued **JWTs** on every protected route via `api/deps.py`
- JWTs are short-lived (1 hour); Supabase handles refresh token rotation automatically
- Passwords **never touch the CourseIntel backend**; Supabase handles credential storage with bcrypt
- The Chrome extension stores the auth token in `chrome.storage.local` (not `localStorage`)

---

## What Is and Is Not Stored

| Data | Stored? | Where |
|---|---|---|
| Syllabus text | Yes | Supabase (Postgres), per user row |
| Grades entered | Yes | Supabase, per user |
| Scraped page text | Processed then discarded | Not persisted raw |
| Student notes/PDFs | Yes | Supabase storage bucket |
| Passwords | Never | Supabase handles hashing |
| API keys | Never | Secrets manager only |

---

## Security Controls in Place

| Control | Implementation |
|---|---|
| Security headers | `SecurityHeadersMiddleware` in `main.py`: CSP, HSTS, X-Frame-Options, etc. |
| Rate limiting | `slowapi`: 30 req/min per IP by default (configurable) |
| CORS | Strict allowlist; no wildcard `*` |
| Input validation | Pydantic v2 with explicit `max_length` on all fields |
| File upload validation | MIME type header + magic byte check + size cap |
| Auth | JWT validated server-side on every protected route |
| Error handling | Global handler; stack traces never reach clients |
| Health endpoint | `/health/llm` requires `X-Internal-Token` header |
| Dependency pinning | All versions pinned in `requirements.txt` and `package.json` |

---

## Dependency Scanning

Run before every release:

```bash
# Backend
pip install pip-audit && pip-audit -r backend/requirements.txt

# Frontend
cd frontend && npm audit

# Extension
cd extension && npm audit
```

---

## Known Limitations (Non-Issues for MVP)

- The Chrome extension content script reads page DOM; this is expected and disclosed to users
- `chrome.storage.local` is not encrypted on disk; this matches the security model of all browser extensions
- The `/health` liveness endpoint is public by design (needed for load balancers)
