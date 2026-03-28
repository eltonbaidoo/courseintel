"use client";
import { useEffect, useState } from "react";

type Status = { active_provider: "anthropic" | "gemini" | "none"; anthropic: boolean; gemini: boolean; fallback_enabled: boolean } | null;

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Claude",
  gemini: "Gemini (fallback)",
  none: "No LLM",
};

const PROVIDER_COLOR: Record<string, string> = {
  anthropic: "bg-violet-100 text-violet-700",
  gemini: "bg-blue-100 text-blue-700",
  none: "bg-red-100 text-red-600",
};

export default function LLMProviderBadge() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/health/llm`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const provider = status.active_provider;

  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${PROVIDER_COLOR[provider] ?? ""}`}
      title={
        provider === "gemini"
          ? "Anthropic is unavailable — falling back to Gemini automatically."
          : "Claude is active."
      }
    >
      {PROVIDER_LABEL[provider]}
    </span>
  );
}
