/**
 * Content script: runs on academic LMS pages.
 *
 * Supported platforms with dedicated DOM selectors:
 *   - Gradescope  (.js-assignmentRow, .table--assignments)
 *   - Canvas      (.assignment, .ig-row — LTI and hosted instances)
 *   - Brightspace (.d2l-table, .d2l-datalist-item)
 *   - Generic fallback — date-pattern scan for any other LMS
 *
 * Platform detection is purely hostname-based (no permissions required beyond
 * the host_permissions listed in manifest.json).
 *
 * Message API:
 *   send  { type: "SCRAPE_PAGE" }
 *   recv  { platform, url, items: ScrapedItem[], rawText }
 */

export interface ScrapedItem {
  title: string;
  due_date: string | null;
  link: string | null;
  type: "assignment" | "exam" | "reading" | "other";
}

export function detectPlatform(hostname: string = window.location.hostname): string {
  if (hostname.includes("gradescope")) return "gradescope";
  if (hostname.includes("instructure") || hostname.includes("canvas")) return "canvas";
  if (hostname.includes("brightspace") || hostname.includes("d2l")) return "brightspace";
  if (hostname.includes("edfinity")) return "edfinity";
  return "unknown";
}

export function scrapeGradescope(): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  document.querySelectorAll(".js-assignmentRow, .table--assignments tbody tr").forEach((row) => {
    const title = row.querySelector(".assignmentTitle, td:first-child")?.textContent?.trim() ?? "";
    const due = row.querySelector(".submissionTimeChart--dueDate, .js-due-date")?.textContent?.trim() ?? null;
    const link = row.querySelector("a")?.href ?? null;
    if (title) items.push({ title, due_date: due, link, type: "assignment" });
  });
  return items;
}

export function scrapeCanvas(): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  document.querySelectorAll(".assignment, .ig-row").forEach((el) => {
    const title = el.querySelector(".ig-title, .title")?.textContent?.trim() ?? "";
    const due = el.querySelector(".assignment-date-due, .due_date_display")?.textContent?.trim() ?? null;
    const link = el.querySelector("a")?.href ?? null;
    if (title) items.push({ title, due_date: due, link, type: "assignment" });
  });
  return items;
}

export function scrapeBrightspace(): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  // D2L Brightspace: assignments table rows and datalist items
  document.querySelectorAll(".d2l-table tr, .d2l-datalist-item").forEach((el) => {
    const title = el.querySelector(".dco_title, .d2l-link, td:first-child")?.textContent?.trim() ?? "";
    const due = el.querySelector(".d2l-dates-text, .ds-date")?.textContent?.trim() ?? null;
    const link = el.querySelector("a")?.href ?? null;
    if (title) {
      const isExam = /quiz|exam|midterm|final/i.test(title);
      items.push({ title, due_date: due, link, type: isExam ? "exam" : "assignment" });
    }
  });
  return items;
}

export function scrapeGeneric(): ScrapedItem[] {
  // Fallback: look for date-adjacent text patterns
  const items: ScrapedItem[] = [];
  // No `g` flag — avoids stateful lastIndex when reusing the same regex object
  // across multiple forEach iterations, which would cause every other match to fail.
  const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i;
  document.querySelectorAll("tr, li, .card, .item").forEach((el) => {
    const text = el.textContent ?? "";
    if (datePattern.test(text) && text.length < 300) {
      items.push({ title: text.trim().slice(0, 120), due_date: null, link: null, type: "other" });
    }
  });
  return items.slice(0, 20);
}

function scrape(): { items: ScrapedItem[]; rawText: string; platform: string; url: string } {
  const platform = detectPlatform();
  let items: ScrapedItem[] = [];

  if (platform === "gradescope") items = scrapeGradescope();
  else if (platform === "canvas") items = scrapeCanvas();
  else if (platform === "brightspace") items = scrapeBrightspace();
  else items = scrapeGeneric();

  return {
    platform,
    url: window.location.href,
    items,
    rawText: document.body.innerText.slice(0, 10000),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_PAGE") {
    sendResponse(scrape());
  }
});
