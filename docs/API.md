# CourseIntel — API Reference

**Base URL:** `http://localhost:8000` (dev) · `https://your-app.onrender.com` (prod)

All endpoints that access user data require a `Authorization: Bearer <token>` header.
Tokens are Supabase HS256 JWTs or Clerk RS256 session tokens.

---

## Authentication

### Token Types

| Type | Algorithm | Source |
|------|-----------|--------|
| Supabase JWT | HS256 | Supabase Auth SDK (`supabase.auth.getSession()`) |
| Clerk session token | RS256 | Clerk SDK (optional) |
| Dev bypass token | — | `DEV_BEARER_TOKEN` env var (local dev only) |

**Dev bypass:** When `DEV_AUTH_BYPASS=true`, send `Authorization: Bearer courseintel-local-dev-bearer`
(or whatever `DEV_BEARER_TOKEN` is set to). Backend resolves this to a fixed dev user. Never
enable in production.

### Error Codes

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid Bearer token |
| `403` | Valid token but insufficient permissions (RLS violation) |
| `404` | Resource not found (or intentionally hidden, e.g. internal health endpoint) |
| `413` | File upload exceeds `MAX_UPLOAD_BYTES` (default 10 MB) |
| `415` | Unsupported media type (non-PDF syllabus, non-PDF/text study material) |
| `422` | Validation error — field too long, malformed JSON body, or PDF extraction failure |
| `429` | Rate limit exceeded (`RATE_LIMIT_PER_MINUTE`, default 30 req/IP/min) |

---

## Health

### `GET /health`

Public liveness check. No auth required.

**Response**
```json
{ "status": "ok" }
```

---

### `GET /health/llm`

Internal-only LLM provider status. Gated by `X-Internal-Token` header.

**Request Headers**
```
X-Internal-Token: <INTERNAL_HEALTH_TOKEN>
```

**Response**
```json
{
  "active_provider": "openai",
  "openai": true
}
```

Returns `404` if token is missing or wrong (security by obscurity — don't expose this endpoint).

---

## Courses

### `POST /courses/bootstrap`

Runs the full 8-agent intelligence pipeline for a course. Multipart form upload.

**Auth:** Required

**Request** — `multipart/form-data`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `university` | string | Yes | Max 256 chars |
| `course` | string | Yes | Max 256 chars (e.g. "CSC 212") |
| `professor` | string | No | Max 256 chars |
| `syllabus` | file (PDF) | No | Max 10 MB, must start with `%PDF` magic bytes |

**Response** — `200 OK`
```json
{
  "id": "uuid-or-null",
  "course_identity": {
    "canonical_name": "Data Structures and Algorithms",
    "course_code": "CSC 212",
    "credit_hours": 4,
    "official_links": ["https://cs.uri.edu/..."],
    "confidence": 0.92
  },
  "syllabus_status": {
    "found": true,
    "confidence": 0.87,
    "source": "web",
    "best_url": "https://..."
  },
  "course_profile": {
    "grading_categories": [
      { "name": "Exams", "weight": 50, "assignment_types": ["Midterm", "Final"] },
      { "name": "Labs", "weight": 30, "assignment_types": ["Weekly lab"] },
      { "name": "Homework", "weight": 20, "assignment_types": ["Problem sets"] }
    ],
    "key_deadlines": [
      { "title": "Midterm", "date": "2025-03-15", "type": "exam", "weight_pct": 25 }
    ],
    "late_policy": "10% deduction per day, max 3 days",
    "grade_scale": { "A": 93, "A-": 90, "B+": 87, "B": 83 },
    "course_topics": ["Binary Trees", "Sorting", "Graph Algorithms"]
  },
  "resources": [
    {
      "title": "CSC 212 GitHub Repo",
      "url": "https://github.com/...",
      "type": "github",
      "relevance_score": 0.95
    }
  ],
  "detected_tools": [
    {
      "tool_name": "Gradescope",
      "category": "grading",
      "confidence": 0.98,
      "signup_url": "https://gradescope.com"
    }
  ],
  "student_signal": {
    "workload_hours": 12,
    "difficulty": "hard",
    "grading_style": "fair but strict",
    "common_pitfalls": ["Exams are cumulative", "Start assignments early"],
    "professor_rating": 4.1
  }
}
```

**Error Cases**
- `415` — syllabus is not a PDF
- `413` — syllabus exceeds size limit
- `422` — PDF text extraction failed, or field exceeds 256 chars

**Note:** If the database write fails, `id` will be `null` but all bootstrap data is still returned
(local-first pattern). Typical timing: 15–45s (8–20s with PDF upload).

---

### `GET /courses/`

List all courses for the authenticated user.

**Auth:** Required

**Response**
```json
{
  "courses": [
    {
      "id": "uuid",
      "university": "University of Rhode Island",
      "course_name": "CSC 212",
      "course_code": "CSC 212",
      "professor": "Marco Alvarez",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:31:45Z"
    }
  ]
}
```

---

### `GET /courses/{course_id}`

Fetch the full course object including all bootstrap JSONB data.

**Auth:** Required

**Response** — same shape as the bootstrap response, plus `university`, `course_name`, `professor`,
`created_at`, `updated_at`.

**Errors:** `404` if course not found or belongs to a different user.

---

### `DELETE /courses/{course_id}`

Permanently delete a course and all its grade entries and study materials (CASCADE).

**Auth:** Required

**Response**
```json
{ "deleted": true }
```

**Errors:** `404` if not found.

---

### `GET /courses/{course_id}/action-plan`

Runs the JudgmentAgent on the current course state. Returns a prioritized weekly action plan.
This is an on-demand endpoint — not cached, runs a fresh LLM call each time.

**Auth:** Required

**Response**
```json
{
  "risk_level": "high",
  "risk_explanation": "Midterm is in 8 days and no grades entered yet",
  "weekly_actions": [
    {
      "title": "Complete Lab 3 before Friday",
      "rationale": "Lab 3 is 10% of final grade and due in 3 days",
      "priority": 1,
      "due_date": "2025-03-14"
    }
  ],
  "missing_data_flags": [
    "No grades entered yet",
    "Tool not connected: Gradescope"
  ],
  "focus_note": "Exam preparation is the critical path this week."
}
```

`risk_level` values: `"low"` | `"medium"` | `"high"` | `"critical"`

---

## Grades

### `POST /grades/compute`

Stateless weighted grade computation — no database read or write. Pass entries and category
weights, receive the computed grade. Used for the live grade calculator.

**Auth:** Not required (stateless math endpoint)

**Request Body**
```json
{
  "entries": [
    {
      "assignment_title": "Lab 1",
      "category": "Labs",
      "score_earned": 88,
      "score_possible": 100
    }
  ],
  "categories": {
    "Labs": 30,
    "Exams": 50,
    "Homework": 20
  }
}
```

**Response**
```json
{
  "current_grade_pct": 87.5,
  "letter_grade": "B+",
  "category_breakdown": {
    "Labs": 88.0,
    "Exams": 0,
    "Homework": 0
  },
  "weight_graded": 30
}
```

`weight_graded` is the sum of category weights for categories that have at least one entry.
`letter_grade` thresholds: A=93, A-=90, B+=87, B=83, B-=80, C+=77, C=73, C-=70, D=60, F=<60.

---

### `POST /grades/goal-simulator`

Algebraically computes the required score on remaining work to hit a target letter grade.
Zero LLM — deterministic math only.

**Auth:** Not required

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| `current_grade` | float | Current weighted grade percentage (0–100) |
| `remaining_weight` | float | Fraction of total weight not yet graded (0.0–1.0) |

**Request Body**
```json
{
  "course_id": "uuid",
  "target_letter": "B+"
}
```

`target_letter` accepted values: `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D`

**Response**
```json
{
  "required_pct": 89.3,
  "feasible": true,
  "message": "You need 89.3% on remaining work to reach B+ (87%)."
}
```

`feasible` is `true` if `required_pct ≤ 100`. When `false`, the target is mathematically
unreachable with the remaining weight.

---

### `POST /grades/courses/{course_id}/entries`

Add a grade entry to the database for a course.

**Auth:** Required

**Request Body**
```json
{
  "assignment_title": "Homework 2",
  "category": "Homework",
  "score_earned": 92,
  "score_possible": 100,
  "due_date": "2025-02-20",
  "source": "manual"
}
```

`source` values: `"manual"` | `"extension"` | `"import"`

**Response**
```json
{ "id": "uuid" }
```

---

### `GET /grades/courses/{course_id}/entries`

List all grade entries for a course.

**Auth:** Required

**Response**
```json
{
  "entries": [
    {
      "id": "uuid",
      "assignment_title": "Homework 2",
      "category": "Homework",
      "score_earned": 92,
      "score_possible": 100,
      "due_date": "2025-02-20T00:00:00Z",
      "source": "manual"
    }
  ]
}
```

---

### `DELETE /grades/entries/{entry_id}`

Delete a grade entry by ID. User must own the entry.

**Auth:** Required

**Response**
```json
{ "deleted": true }
```

---

## Study Materials

### `POST /study/courses/{course_id}/upload`

Upload a study material (PDF, plain text, or markdown). Extracts and stores full text content.

**Auth:** Required

**Request** — `multipart/form-data`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Display name |
| `material_type` | string | No | `"notes"` \| `"slides"` \| `"textbook"` \| `"other"` (default: `"notes"`) |
| `file` | file | Yes | PDF, `.txt`, or `.md` — max 10 MB |

**Response**
```json
{
  "id": "uuid",
  "title": "Week 5 Lecture Notes",
  "type": "notes",
  "content_length": 8432
}
```

---

### `GET /study/courses/{course_id}/materials`

List all uploaded study materials (metadata only, no content).

**Auth:** Required

**Response**
```json
{
  "materials": [
    {
      "id": "uuid",
      "title": "Week 5 Lecture Notes",
      "type": "notes",
      "created_at": "2025-02-18T14:22:00Z"
    }
  ]
}
```

---

### `POST /study/courses/{course_id}/analyze`

Runs the StudyContextAgent on all uploaded materials. Returns AI-powered study recommendations.
Requires at least one uploaded material.

**Auth:** Required

**Response**
```json
{
  "summary": "3 materials cover sorting algorithms and graph theory with limited coverage of dynamic programming.",
  "key_topics": ["Merge Sort", "Dijkstra's Algorithm", "Binary Search Trees"],
  "weak_coverage": ["Dynamic Programming", "Amortized Analysis"],
  "study_priorities": [
    "Review dynamic programming — appears on syllabus but not in your notes",
    "Practice graph traversal problems before the midterm"
  ]
}
```

**Errors:** `400` if no study materials have been uploaded yet.

---

## Extension

### `POST /extension/scrape`

Validates a grade payload scraped by the Chrome extension. Runs the ExtensionValidationAgent
to check for duplicates, weight sum consistency, and category matching.

**Auth:** Required (Bearer JWT from the extension's stored session)

**Request Body**
```json
{
  "platform": "gradescope",
  "course_context": "CSC 212",
  "raw_text": "...",
  "items": [
    {
      "assignment_title": "Lab 1",
      "category": "Labs",
      "score_earned": 88,
      "score_possible": 100,
      "due_date": "2025-02-01"
    }
  ]
}
```

**Response**
```json
{
  "scrape_job_id": "uuid",
  "status": "accepted",
  "usefulness_score": 0.87,
  "accepted_items": 12,
  "rejected_items": 1,
  "merged_obligations": 12,
  "message": ""
}
```

`status` values: `"accepted"` | `"partial"` | `"rejected"`

---

### `GET /extension/orchestrate/{platform}`

Returns step-by-step scraping instructions for a given LMS platform. Used by the extension popup
to guide the content script.

**Auth:** Not required

**Path Parameters**
| Param | Values |
|-------|--------|
| `platform` | `gradescope`, `canvas`, `blackboard`, `brightspace`, `schoology`, `google_classroom` |

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| `course_context` | string | Optional — course name/code to tailor instructions |

**Response**
```json
{
  "platform": "gradescope",
  "steps": [
    "Navigate to your Gradescope dashboard",
    "Click on the course matching your context",
    "..."
  ],
  "selectors": { "grade_table": ".gradescope-table", "assignment_row": "tr.assignment" }
}
```

---

### `GET /extension/help/{platform}`

Returns a contextual help card explaining a campus platform to the student.

**Auth:** Not required

**Path Parameters** — same platform values as `/extension/orchestrate/{platform}`

**Response**
```json
{
  "platform": "Gradescope",
  "what_it_is": "An AI-assisted grading platform used for programming assignments and exams.",
  "how_to_access": "Go to gradescope.com and log in with your university SSO.",
  "common_issues": ["Submissions may close 1 minute before the listed deadline"],
  "pro_tips": ["You can request a regrade within 7 days of grade release"]
}
```
