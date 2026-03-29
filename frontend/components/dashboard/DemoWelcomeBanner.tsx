"use client";

import { useEffect, useState } from "react";
import { DEMO_DISPLAY_NAME_KEY, DEMO_FLOW_KEY } from "@/lib/demo-onboarding";

export default function DemoWelcomeBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const name = sessionStorage.getItem(DEMO_DISPLAY_NAME_KEY);
      const demo = sessionStorage.getItem(DEMO_FLOW_KEY);
      if (name?.trim() && demo === "1") {
        setMessage(
          `Welcome, ${name.trim()}! You're set up — add a course to see CourseIntel in action.`,
        );
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  if (!message) return null;

  function dismiss() {
    try {
      sessionStorage.removeItem(DEMO_DISPLAY_NAME_KEY);
      sessionStorage.removeItem(DEMO_FLOW_KEY);
    } catch {
      /* ignore */
    }
    setMessage(null);
  }

  return (
    <div
      role="status"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-almond-cream-200 bg-almond-cream-50 px-4 py-3 shadow-sm"
    >
      <p className="text-sm leading-relaxed text-shadow-grey-900">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs font-medium text-espresso-800 hover:text-shadow-grey-900"
      >
        Dismiss
      </button>
    </div>
  );
}
