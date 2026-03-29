declare const __APP_URL__: string;
const APP_URL: string = (typeof __APP_URL__ !== "undefined" ? __APP_URL__ : "http://localhost:3000").replace(/\/$/, "");

const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const courseSelect = document.getElementById("course-select") as HTMLSelectElement;
const resultDiv = document.getElementById("result") as HTMLDivElement;
const platformBadge = document.getElementById("platform-badge") as HTMLSpanElement;
const appLink = document.getElementById("app-link") as HTMLAnchorElement;
appLink.href = APP_URL;

const PLATFORM_NAMES: Record<string, string> = {
  gradescope: "Gradescope",
  canvas: "Canvas",
  brightspace: "Brightspace",
  edfinity: "Edfinity",
  unknown: "Unknown site",
};

async function detectCurrentPlatform() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = new URL(tab?.url ?? "").hostname;
  if (host.includes("gradescope")) return "gradescope";
  if (host.includes("instructure") || host.includes("canvas")) return "canvas";
  if (host.includes("brightspace")) return "brightspace";
  if (host.includes("edfinity")) return "edfinity";
  return null;
}

async function init() {
  const platform = await detectCurrentPlatform();
  if (platform) {
    platformBadge.textContent = PLATFORM_NAMES[platform];
    captureBtn.disabled = false;
  } else {
    platformBadge.textContent = "Not on a known platform";
    platformBadge.style.background = "#fef9c3";
    platformBadge.style.color = "#a16207";
  }

  // TODO: load courses from Supabase and populate courseSelect
  const option = document.createElement("option");
  option.value = "demo-course-id";
  option.textContent = "CS 4400, Georgia Tech";
  courseSelect.appendChild(option);
  courseSelect.value = "demo-course-id";
}

captureBtn.addEventListener("click", async () => {
  const courseId = courseSelect.value;
  if (!courseId) { showResult("Please select a course first.", true); return; }

  // Retrieve stored auth token; set when user logs in via the web app
  const { authToken } = await chrome.storage.local.get("authToken");
  if (!authToken) {
    showResult("Not signed in. Open CourseIntel and log in first.", true);
    return;
  }

  captureBtn.disabled = true;
  captureBtn.textContent = "Capturing...";
  resultDiv.className = "result hidden";

  try {
    const response = await chrome.runtime.sendMessage({ type: "TRIGGER_SCRAPE", courseId, authToken });
    if (response?.error) {
      showResult(response.error, true);
    } else {
      const count = response?.accepted_items ?? 0;
      showResult(
        `Captured ${count} item${count !== 1 ? "s" : ""}. ${response?.message ?? ""}`,
        false,
      );
    }
  } catch {
    showResult("Could not reach CourseIntel. Make sure the backend is running.", true);
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = "Capture This Page";
  }
});

function showResult(message: string, isError: boolean) {
  resultDiv.textContent = message;
  resultDiv.className = `result${isError ? " error" : ""}`;
}

init();
