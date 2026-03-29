/**
 * Background service worker.
 * Receives scrape trigger from popup, runs content script, POSTs to CourseIntel backend.
 * LLM calls are handled server-side (OpenAI) — transparent here.
 *
 * API_URL is injected at build time via __API_URL__ replacement.
 * Default falls back to localhost for development.
 */

declare const __API_URL__: string;
const API_URL: string = (typeof __API_URL__ !== "undefined" ? __API_URL__ : "http://localhost:8000").replace(/\/$/, "");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "TRIGGER_SCRAPE") {
    handleScrape(message.courseId, message.authToken)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
});

async function handleScrape(courseId: string, authToken: string): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["dist/content/scraper.js"],
    });
  } catch {
    // Already injected — safe to ignore
  }

  const scrapeResult = await chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_PAGE" }).catch(() => null);
  if (!scrapeResult?.items?.length) {
    throw new Error("No assignment data found on this page. Navigate to the assignments list and try again.");
  }

  const payload = {
    course_id: courseId,
    platform: scrapeResult.platform,
    url: scrapeResult.url,
    raw_text: scrapeResult.rawText,
    items: scrapeResult.items,
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/extension/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Cannot reach CourseIntel backend. Is it running?");
  }

  if (!res.ok) {
    // Never surface raw server error text to the user
    throw new Error(`Capture failed (${res.status}). Please try again.`);
  }

  return res.json();
}
