"use client";
import { useEffect, useState } from "react";

type Status = { active_provider: "openai" | "none"; openai: boolean } | null;

const CONFIG: Record<string, { label: string; cls: string }> = {
  openai: {
    label: "OpenAI",
    cls: "bg-shadow-grey-900 text-burnt-peach-400 border border-espresso-950",
  },
  none: {
    label: "No LLM",
    cls: "bg-espresso-950 text-burnt-peach-600 border border-espresso-900",
  },
};

export default function LLMProviderBadge() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const token = process.env.NEXT_PUBLIC_HEALTH_TOKEN ?? "";
    if (!token) {
      setStatus(null);
      return;
    }
    fetch(`${url}/health/llm`, {
      headers: { "X-Internal-Token": token },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("llm health"))))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const cfg = CONFIG[status.active_provider] ?? CONFIG.none;

  return (
    <span
      className={`badge text-xs ${cfg.cls}`}
      title={`LLM: ${status.active_provider}${status.openai ? " (reachable)" : ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}
