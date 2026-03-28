"use client";
import { useState } from "react";
import { api } from "@/lib/api";

type HelpCard = { what_it_is?: string; page_to_open?: string; what_captures?: string; success_looks_like?: string; troubleshoot_tip?: string };

export default function ResourcesPage({ params }: { params: { id: string } }) {
  const [helpPlatform, setHelpPlatform] = useState<string | null>(null);
  const [helpCard, setHelpCard] = useState<HelpCard | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  async function openHelp(platform: string) {
    setHelpPlatform(platform);
    setLoadingHelp(true);
    const card = await api.getPlatformHelp(platform);
    setHelpCard(card);
    setLoadingHelp(false);
  }

  const detectedTools = [
    { tool_name: "Gradescope", purpose: "Homework submission and grading", integration_type: "extension_scrape" },
    { tool_name: "Canvas", purpose: "LMS — announcements, assignments", integration_type: "extension_scrape" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resources & Tools</h1>

      <section>
        <h2 className="font-semibold text-sm text-gray-500 uppercase mb-3">Detected Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detectedTools.map((tool) => (
            <div key={tool.tool_name} className="border rounded-xl p-4 bg-white flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{tool.tool_name}</p>
                <p className="text-sm text-gray-500">{tool.purpose}</p>
              </div>
              <button
                onClick={() => openHelp(tool.tool_name.toLowerCase())}
                className="shrink-0 text-xs px-3 py-1.5 border border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Help Bar */}
      {helpPlatform && (
        <div className="border rounded-xl p-5 bg-blue-50 border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-900">How to connect {helpPlatform}</h3>
            <button onClick={() => setHelpPlatform(null)} className="text-blue-400 hover:text-blue-600 text-xs">Dismiss</button>
          </div>
          {loadingHelp ? (
            <p className="text-sm text-blue-600">Loading instructions...</p>
          ) : helpCard ? (
            <div className="space-y-2 text-sm text-blue-900">
              {helpCard.what_it_is && <p><strong>What it is:</strong> {helpCard.what_it_is}</p>}
              {helpCard.page_to_open && <p><strong>Page to open:</strong> {helpCard.page_to_open}</p>}
              {helpCard.what_captures && <p><strong>Extension captures:</strong> {helpCard.what_captures}</p>}
              {helpCard.troubleshoot_tip && <p className="text-blue-700 text-xs">Tip: {helpCard.troubleshoot_tip}</p>}
            </div>
          ) : null}
        </div>
      )}

      <section>
        <h2 className="font-semibold text-sm text-gray-500 uppercase mb-3">Public Resources</h2>
        <p className="text-sm text-gray-400">Run course bootstrap to discover public materials.</p>
      </section>
    </div>
  );
}
