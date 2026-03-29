"use client";

import { use, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { usePlatformHelp } from "@/hooks/use-extension";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const [helpPlatform, setHelpPlatform] = useState<string | null>(null);
  const { data: helpCard, isLoading: loadingHelp } = usePlatformHelp(helpPlatform);

  if (!course) {
    return (
      <EmptyState
        icon="🔍"
        title="Course not found"
        description="This course doesn't exist."
        action={{ label: "Back to courses", href: "/dashboard" }}
      />
    );
  }

  const tools = course.bootstrap.detected_tools ?? [];
  const resources = course.bootstrap.resources ?? [];

  return (
    <div className="space-y-6 stagger">
      <div>
        <p className="section-label mb-1">Discovery</p>
        <h1 className="font-display text-3xl font-bold text-honeydew-950">
          Resources & Tools
        </h1>
        <p className="text-honeydew-500 text-sm mt-1 max-w-2xl">
          Agents match your syllabus to LMS platforms and public materials. Use{" "}
          <strong className="text-honeydew-700 font-medium">Connect</strong> for
          per-platform tips; pair with the Chrome extension to validate scrapes.
        </p>
      </div>

      <div className="rounded-2xl border border-honeydew-100 bg-honeydew-50/60 p-4 text-sm text-honeydew-700">
        <p className="font-semibold text-honeydew-900 text-xs section-label mb-2">
          Tip
        </p>
        If a tool is missing, re-run bootstrap with a clearer syllabus PDF or add the
        professor name — Tool Discovery uses both text and course context.
      </div>

      {/* Detected Platforms */}
      <section>
        <p className="section-label mb-3">Detected Platforms</p>
        {tools.length === 0 ? (
          <p className="text-sm text-honeydew-400">
            No platforms detected. Run course bootstrap to discover tools.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <div
                key={tool.tool_name}
                className="card p-4 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-honeydew-900">{tool.tool_name}</p>
                  <p className="text-sm text-honeydew-500">{tool.purpose}</p>
                  {tool.confidence > 0 && (
                    <span className="badge-ice text-xs mt-1 inline-block">
                      {(tool.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setHelpPlatform(
                      helpPlatform === tool.tool_name.toLowerCase()
                        ? null
                        : tool.tool_name.toLowerCase(),
                    )
                  }
                  className="btn-secondary shrink-0 text-xs"
                >
                  {helpPlatform === tool.tool_name.toLowerCase()
                    ? "Dismiss"
                    : "Connect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Help Bar */}
      {helpPlatform && (
        <div className="card border-neon-ice-200 bg-neon-ice-50 p-5 space-y-2 animate-fade-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neon-ice-900 font-display">
              How to connect {helpPlatform}
            </h3>
            <button
              onClick={() => setHelpPlatform(null)}
              className="text-neon-ice-400 hover:text-neon-ice-600 text-xs"
            >
              Dismiss
            </button>
          </div>
          {loadingHelp ? (
            <p className="text-sm text-neon-ice-600">Loading instructions...</p>
          ) : helpCard ? (
            <div className="space-y-2 text-sm text-neon-ice-900">
              {helpCard.what_it_is && (
                <p>
                  <strong>What it is:</strong> {helpCard.what_it_is}
                </p>
              )}
              {helpCard.page_to_open && (
                <p>
                  <strong>Page to open:</strong> {helpCard.page_to_open}
                </p>
              )}
              {helpCard.what_captures && (
                <p>
                  <strong>Extension captures:</strong> {helpCard.what_captures}
                </p>
              )}
              {helpCard.troubleshoot_tip && (
                <p className="text-neon-ice-700 text-xs">
                  Tip: {helpCard.troubleshoot_tip}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-neon-ice-600">
              No help available for this platform yet.
            </p>
          )}
        </div>
      )}

      {/* Public Resources */}
      <section>
        <p className="section-label mb-3">Public Resources</p>
        {resources.length === 0 ? (
          <p className="text-sm text-honeydew-400">
            No public resources discovered yet.
          </p>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover p-4 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-honeydew-900 text-sm">
                    {r.title}
                  </p>
                  <p className="text-xs text-honeydew-500 mt-0.5">{r.reason}</p>
                </div>
                <span className="badge bg-honeydew-100 text-honeydew-600 shrink-0">
                  {r.type.replace("_", " ")}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
