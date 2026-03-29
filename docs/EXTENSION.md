# CourseIntel Chrome Extension

Manifest V3 extension that scrapes live grade and assignment data from academic LMS platforms and syncs it to the student's CourseIntel dashboard.

## Supported Platforms

| Platform | Detection | DOM Selectors |
|----------|-----------|---------------|
| **Gradescope** | `gradescope.com` | `.js-assignmentRow`, `.table--assignments tbody tr`, `.assignmentTitle`, `.submissionTimeChart--dueDate` |
| **Canvas** | `instructure.com`, `canvas.*` | `.assignment`, `.ig-row`, `.ig-title`, `.assignment-date-due`, `.due_date_display` |
| **Brightspace (D2L)** | `brightspace.com`, `d2l.*` | `.d2l-table tr`, `.d2l-datalist-item`, `.dco_title`, `.d2l-dates-text` |
| **Generic fallback** | any hostname | Date-pattern regex scan (`Jan|Feb|...` in `tr`, `li`, `.card` elements) |

## Files

```
extension/
  manifest.json              — MV3 manifest, host_permissions, content_scripts
  src/
    content/scraper.ts       — DOM scrapers for each platform + generic fallback
    background/service-worker.ts  — auth handshake, injects scraper, POSTs to backend
    popup/popup.ts           — platform detection UI, course selector, capture trigger
    popup/popup.html         — extension popup markup
    popup/popup.css          — popup styles
  tsconfig.json
  package.json               — esbuild bundler config
```

## How It Works

### 1. Authentication (no separate login)

The extension shares the Supabase session from the CourseIntel web app:

```
User logs in at courseintel.app
  → Supabase stores JWT in localStorage:
     key: "sb-<project-ref>-auth-token"

Extension popup opens
  → popup.ts calls chrome.storage.local.get("authToken")
  → If no stored token, service-worker reads it from the active tab's localStorage
    via chrome.scripting.executeScript()
  → Token is stored in chrome.storage.local for subsequent uses
```

### 2. Platform Detection

`popup.ts` and `scraper.ts` independently check `window.location.hostname`:
- Gradescope, Canvas, Brightspace, Edfinity are all detected by substring match
- Popup shows a badge ("Gradescope", "Canvas", etc.) or "Not on a known platform"
- Capture button is disabled unless a known platform is detected

### 3. Scraping Flow

```
User clicks "Capture This Page"
  → popup sends { type: "TRIGGER_SCRAPE", courseId, authToken } to service worker

Service worker (service-worker.ts)
  → Queries active tab
  → Injects dist/content/scraper.js if not already injected
  → Sends { type: "SCRAPE_PAGE" } to content script
  → Content script returns { platform, url, items[], rawText }

Service worker POSTs to /extension/scrape:
  {
    course_id: string,
    platform: "gradescope" | "canvas" | "brightspace" | ...,
    url: string,
    raw_text: string (first 10,000 chars of page body),
    items: [{ title, due_date, link, type }]
  }
  Authorization: Bearer <supabase_jwt>
```

### 4. Backend Validation

`POST /extension/scrape` runs two agents:
- **`ExtensionOrchestrationAgent`** — validates scraped items against the course's grading schema, normalizes categories
- **`ExtensionValidationAgent`** — cross-checks that scraped grades are plausible (e.g., score ≤ max possible)

Returns `{ accepted_items: N, message: "..." }` — the popup displays this count to the user.

## Building

```bash
cd extension
npm install
npm run build   # esbuild bundles src/ → dist/
```

`__API_URL__` and `__APP_URL__` are injected at build time via esbuild `define`. Set them in `package.json` scripts or pass as environment variables:

```bash
API_URL=https://courseintel-api.onrender.com npm run build
```

## Sideloading (Development)

1. `npm run build`
2. Chrome → `chrome://extensions/` → "Load unpacked" → select `extension/` folder
3. Log in at `http://localhost:3000`
4. Navigate to `gradescope.com/courses/...` or Canvas assignment list
5. Click the CourseIntel extension icon → select course → "Capture This Page"

## Permissions Used

| Permission | Reason |
|-----------|--------|
| `tabs` | Query active tab for URL and tabId |
| `scripting` | Inject content script into LMS pages |
| `storage` | Persist auth token between popup opens |
| `host_permissions: ["*://gradescope.com/*", ...]` | Allow content script injection and fetch |
