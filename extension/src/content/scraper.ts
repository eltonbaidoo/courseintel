/**
 * Content script — runs on academic platform pages.
 * Extracts structured assignment/deadline data from the DOM.
 */

interface ScrapedItem {
  title: string;
  due_date: string | null;
  link: string | null;
  type: "assignment" | "exam" | "reading" | "other";
}

function detectPlatform(): string {
  const host = window.location.hostname;
  if (host.includes("gradescope")) return "gradescope";
  if (host.includes("instructure") || host.includes("canvas")) return "canvas";
  if (host.includes("brightspace")) return "brightspace";
  if (host.includes("edfinity")) return "edfinity";
  return "unknown";
}

function scrapeGradescope(): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  document.querySelectorAll(".js-assignmentRow, .table--assignments tbody tr").forEach((row) => {
    const title = row.querySelector(".assignmentTitle, td:first-child")?.textContent?.trim() ?? "";
    const due = row.querySelector(".submissionTimeChart--dueDate, .js-due-date")?.textContent?.trim() ?? null;
    const link = row.querySelector("a")?.href ?? null;
    if (title) items.push({ title, due_date: due, link, type: "assignment" });
  });
  return items;
}

function scrapeCanvas(): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  document.querySelectorAll(".assignment, .ig-row").forEach((el) => {
    const title = el.querySelector(".ig-title, .title")?.textContent?.trim() ?? "";
    const due = el.querySelector(".assignment-date-due, .due_date_display")?.textContent?.trim() ?? null;
    const link = el.querySelector("a")?.href ?? null;
    if (title) items.push({ title, due_date: due, link, type: "assignment" });
  });
  return items;
}

function scrapeGeneric(): ScrapedItem[] {
  // Fallback: look for date-adjacent text patterns
  const items: ScrapedItem[] = [];
  const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/gi;
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
