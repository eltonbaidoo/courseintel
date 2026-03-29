"use client";
import { useEffect, useState } from "react";

type Status = { active_provider: "anthropic" | "openai" | "none"; anthropic: boolean; openai: boolean } | null;

const CONFIG: Record<string, { label: string; cls: string }> = {
  anthropic: { label: "Claude",  cls: "bg-honeydew-900 text-honeydew-400 border border-honeydew-800" },
  openai:    { label: "GPT-4o",  cls: "bg-honeydew-900 text-neon-ice-400 border border-honeydew-800" },
  none:      { label: "No LLM",  cls: "bg-coral-900 text-coral-400 border border-coral-800" },
};

export default function LLMProviderBadge() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${url}/health/llm`, {
      headers: { "X-Internal-Token": process.env.NEXT_PUBLIC_HEALTH_TOKEN ?? "" },
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status) return null;

  const cfg = CONFIG[status.active_provider] ?? CONFIG.none;

  return (
    <span className={`badge text-xs ${cfg.cls}`} title={`Active LLM: ${status.active_provider}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}
