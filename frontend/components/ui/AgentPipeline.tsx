"use client";

export interface AgentStep {
  label: string;
  status: "waiting" | "running" | "done" | "error";
}

interface AgentPipelineProps {
  steps: AgentStep[];
}

function statusIcon(status: AgentStep["status"]) {
  switch (status) {
    case "done":
      return <span className="text-honeydew-500">✓</span>;
    case "running":
      return <span className="agent-dot" />;
    case "error":
      return <span className="text-coral-500">✗</span>;
    default:
      return <span className="text-honeydew-300">○</span>;
  }
}

export function AgentPipeline({ steps }: AgentPipelineProps) {
  return (
    <div className="card p-5">
      <p className="section-label mb-4">Agent Pipeline</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-center flex-shrink-0">
              {statusIcon(step.status)}
            </span>
            <span
              className={
                step.status === "done"
                  ? "text-honeydew-700"
                  : step.status === "running"
                    ? "text-honeydew-900 font-medium"
                    : step.status === "error"
                      ? "text-coral-700"
                      : "text-honeydew-400"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
