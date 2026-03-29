# CourseIntel — Agent System

## Pipeline Coordinator

`POST /courses/bootstrap` in `backend/api/routes/courses.py` is the **pipeline coordinator**.
It is not an agent itself — it sequences agents, manages the shared `CourseContext`, and
handles database persistence. Agents are called as async functions that receive inputs and
return typed dicts.

### Orchestration Sequence

```
bootstrap_course()  ← FastAPI route handler
    │
    ├─ [1] Input validation + PDF extraction / SyllabusAcquisition
    ├─ [2] SyllabusIntelligenceAgent          (sequential: needs syllabus text)
    ├─ [3] asyncio.gather(                    (parallel: independent queries)
    │       DiscoveryAgent,
    │       PublicResourcesAgent,
    │       ReputationAgent,
    │       ToolDiscoveryAgent
    │   )
    ├─ [4] ObligationDeadlineAgent            (sequential: normalizes raw key_deadlines
    │                                          from SyllabusIntelligence into urgency-
    │                                          ranked obligations with conflict notes)
    └─ [5] DB persist → return bootstrap_data

get_action_plan()  ← GET /courses/{id}/action-plan
    │
    ├─ Assembles: course_profile + grade_entries + obligations + study_materials
    └─ [5] JudgmentAgent                      (on-demand, not part of bootstrap)

POST /study/{id}/analyze
    └─ [6] StudyContextAgent                  (on-demand, after material upload)

GET /extension/orchestrate/{platform}
    └─ [7] ExtensionOrchestrationAgent        (generates scraping instructions)

POST /extension/scrape
    └─ [8] ExtensionValidationAgent           (validates scraped grade payload)

GET /extension/help/{platform}
    └─ [9] DocumentationHelpAgent             (generates help cards)
```

---

## LLM Gateway

**File:** `backend/agents/base.py`

All agents use the same gateway function — `call_llm()` (also aliased as `call_claude()`
for backwards compatibility). The gateway:

- Uses a **lazy-init singleton** OpenAI client (created on first call, reused thereafter)
- Accepts `thinking=True` for future reasoning-model compatibility (ignored on OpenAI)
- Sets `temperature=0.2` for consistent, structured output
- Raises on API failure (agents catch and return safe empty responses)

```python
OPUS   = "gpt-4o"       # deep reasoning agents
SONNET = "gpt-4o"       # synthesis agents
HAIKU  = "gpt-4o-mini"  # classification + fast agents
```

**Model tier rationale:**
- `OPUS` (gpt-4o): Used for JudgmentAgent and SyllabusIntelligenceAgent where output
  quality directly determines product value. Higher cost justified by critical path impact.
- `HAIKU` (gpt-4o-mini): Used for ToolDiscoveryAgent and PublicResourcesAgent where
  the task is classification/ranking rather than synthesis. 10x cheaper with adequate quality.

---

## Agent Registry

| # | Agent | File | Model | Purpose |
|---|-------|------|-------|---------|
| 1 | **DiscoveryAgent** | `agents/discovery.py` | HAIKU | Normalizes course identity from web search. Returns canonical name, course code, credit hours, official university links. |
| 2 | **SyllabusAcquisitionAgent** | `agents/syllabus_acquisition.py` | HAIKU | Finds and fetches the course syllabus from public university portals via Tavily. Returns PDF text up to 50KB. |
| 3 | **SyllabusIntelligenceAgent** | `agents/syllabus_intelligence.py` | OPUS | Extracts structured grading schema from syllabus text: category weights, deadlines, late policy, grade scale. Core extraction agent — highest model tier. |
| 4 | **PublicResourcesAgent** | `agents/public_resources.py` | HAIKU | Discovers public learning materials: GitHub repos, open courseware, Reddit threads, YouTube playlists. Returns ranked list with relevance scores. |
| 5 | **ReputationAgent** | `agents/reputation.py` | SONNET | Synthesizes public opinion on the course and professor: workload hours, difficulty, grading style, common pitfalls. Searches Rate My Professor, Reddit, public forums. |
| 6 | **ToolDiscoveryAgent** | `agents/tool_discovery.py` | HAIKU | Identifies platforms and tools required by the course (Gradescope, specific IDEs, datasets, lab systems) from syllabus text and a hardcoded KNOWN_PLATFORMS list. |
| 7 | **JudgmentAgent** | `agents/judgment.py` | OPUS | Core decision layer. Synthesizes all course signals into risk_level (low/medium/high/critical), up to 5 prioritized weekly_actions, missing_data_flags, and a one-sentence focus_note. |
| 8 | **ObligationDeadlineAgent** | `agents/obligation_deadline.py` | SONNET | Deduplicates and urgency-ranks all deadlines from syllabus, grade entries, and scraped data into a normalized timeline. |
| 9 | **StudyContextAgent** | `agents/study_context.py` | SONNET | Analyzes uploaded study materials to identify: key topics covered, weak coverage areas, and prioritized study recommendations. |
| 10 | **ExtensionOrchestrationAgent** | `agents/extension_orchestration.py` | HAIKU | Generates step-by-step scraping instructions for each LMS platform, using a hardcoded PLATFORM_GUIDES dict as the base context. |
| 11 | **ExtensionValidationAgent** | `agents/extension_validation.py` | HAIKU | Validates scraped grade payloads. Applies rejection criteria (weight sum ≠ 100%, duplicate assignments, missing categories). Returns usefulness_score and merged_obligations. |
| 12 | **DocumentationHelpAgent** | `agents/documentation_help.py` | HAIKU | Generates contextual help cards explaining each campus platform to students, using PLATFORM_DOCS as base content. |
| 13 | **GradeIntelligenceAgent** | `agents/grade_intelligence.py` | **None** | Deterministic Python math only. `compute_current_grade()` for weighted averages, `compute_required_scores()` for goal simulation. Zero LLM — no hallucination risk. |

---

## Agent Input/Output Contracts

### DiscoveryAgent
```python
Input:  university: str, course: str, professor: str
Output: {
  canonical_name: str,
  course_code: str,
  credit_hours: int | None,
  official_links: [str],
  confidence: float
}
```

### SyllabusAcquisitionAgent
```python
Input:  course: str, university: str, professor: str
Output: {
  found: bool,
  confidence: float,
  source: str,           # "upload" | "web" | "not_found"
  syllabus_text: str,    # up to 50,000 chars
  best_url: str | None
}
```

### SyllabusIntelligenceAgent
```python
Input:  syllabus_text: str
Output: {
  grading_categories: [{name, weight, assignment_types}],
  key_deadlines: [{title, date, type, weight_pct}],
  late_policy: str,
  grade_scale: {A: 93, "A-": 90, ...},
  course_topics: [str]
}
```

### JudgmentAgent
```python
Input:  course_profile: dict, grade_standing: dict,
        obligations: list, study_context: dict | None,
        student_signal: dict | None, missing_flags: list
Output: {
  risk_level: "low" | "medium" | "high" | "critical",
  risk_explanation: str,
  weekly_actions: [{title, rationale, priority (1-5), due_date}],
  missing_data_flags: [str],
  focus_note: str
}
```

### GradeIntelligenceAgent (deterministic)
```python
# compute_current_grade
Input:  entries: list[GradeEntry], categories: dict[str, float]
Output: {
  current_grade_pct: float,
  letter_grade: str,
  category_breakdown: {category: pct},
  weight_graded: float
}

# compute_required_scores
Input:  current_grade_pct: float, target_pct: float, remaining_weight: float
Output: {
  required_pct: float,
  feasible: bool,
  message: str
}
```

---

## Failure Handling

Every agent wraps its LLM call in a try/except and returns a typed empty response on failure:

```python
try:
    raw = await call_llm(SYSTEM, prompt, model=MODEL)
    return json.loads(raw)
except json.JSONDecodeError:
    logger.warning("Non-JSON response from %s", __name__)
    return {"resources": []}     # safe empty — never crashes the pipeline
except Exception as exc:
    logger.error("Agent failed: %s", exc)
    return {"resources": []}
```

The bootstrap pipeline uses `.get("field", default)` on all agent outputs so a failed
agent produces empty data rather than a 500 error. The course is still saved and
accessible — students can re-bootstrap to retry failed agents.
