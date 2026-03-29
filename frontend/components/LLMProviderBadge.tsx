"use client";
import { useEffect, useState } from "react";

type LLMStatus = {
  active_provider: "openai" | "gemini" | "groq" | "none";
  openai: boolean;
  gemini: boolean;
  groq: boolean;
} | null;

type AgentStatus = {
  agents_online: boolean;
  provider: string;
  error?: string;
} | null;

const PROVIDER_CONFIG: Record<string, { label: string; cls: string }> = {
  openai: {
    label: "OpenAI",
    cls: "bg-shadow-grey-900 text-burnt-peach-400 border border-espresso-950",
  },
  gemini: {
    label: "Gemini",
    cls: "bg-shadow-grey-900 text-burnt-peach-400 border border-espresso-950",
  },
  groq: {
    label: "Groq",
    cls: "bg-shadow-grey-900 text-burnt-peach-400 border border-espresso-950",
  },
  none: {
    label: "No LLM",
    cls: "bg-espresso-950 text-burnt-peach-600 border border-espresso-900",
  },
};

export default function LLMProviderBadge() {
  const [llm, setLLM] = useState<LLMStatus>(null);
  const [agents, setAgents] = useState<AgentStatus>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const token = process.env.NEXT_PUBLIC_HEALTH_TOKEN ?? "";
    if (!token) return;

    const headers = { "X-Internal-Token": token };

    fetch(`${url}/health/llm`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setLLM)
      .catch(() => setLLM(null));

    fetch(`${url}/health/agents`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAgents)
      .catch(() => setAgents(null));
  }, []);

  if (!llm) return null;

  const cfg = PROVIDER_CONFIG[llm.active_provider] ?? PROVIDER_CONFIG.none;
  const agentsOnline = agents?.agents_online ?? false;

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`badge text-xs ${cfg.cls}`}
        title={`LLM provider: ${llm.active_provider}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {cfg.label}
      </span>
      {agents !== null && (
        <span
          className={`badge text-xs ${
            agentsOnline
              ? "bg-shadow-grey-900 text-burnt-peach-400 border border-espresso-950"
              : "bg-espresso-950 text-espresso-700 border border-espresso-900"
          }`}
          title={agentsOnline ? "Agents responding" : (agents.error ?? "Agents offline")}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${agentsOnline ? "bg-burnt-peach-400" : "bg-espresso-700"}`}
          />
          {agentsOnline ? "Agents online" : "Agents offline"}
        </span>
      )}
    </span>
  );
}
