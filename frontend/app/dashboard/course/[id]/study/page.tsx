"use client";
import { useState } from "react";

export default function StudyBuddyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<{ summary?: string; key_topics?: string[]; study_priorities?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    // TODO: send to backend study context agent
    await new Promise((r) => setTimeout(r, 1500));
    setSummary({
      summary: "Your notes cover core data structures and algorithm analysis. Strong coverage on sorting algorithms; weak on dynamic programming.",
      key_topics: ["Binary trees", "Hash maps", "Big-O analysis", "Sorting algorithms", "Recursion"],
      study_priorities: ["Dynamic programming — barely covered", "Graph algorithms — exam topic", "Review hash collision resolution"],
    });
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Study Buddy</h1>

      <div className="border rounded-xl p-5 bg-white space-y-3">
        <h2 className="font-semibold">Upload Study Material</h2>
        <p className="text-sm text-gray-500">PDF notes, NotebookLM exports, Goodnotes exports, lecture slides.</p>
        <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Summarize Material"}
        </button>
      </div>

      {summary && (
        <div className="space-y-4">
          <div className="border rounded-xl p-5 bg-white">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm text-gray-700">{summary.summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-5 bg-white">
              <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">Key Topics</h3>
              <ul className="space-y-1 text-sm">
                {summary.key_topics?.map((t) => <li key={t} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500" />{t}</li>)}
              </ul>
            </div>
            <div className="border rounded-xl p-5 bg-white">
              <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">Study Priorities</h3>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                {summary.study_priorities?.map((p) => <li key={p} className="text-red-700">{p}</li>)}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
