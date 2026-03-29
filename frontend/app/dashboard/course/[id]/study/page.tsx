"use client";

import { use, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, type StudyAnalysisResponse } from "@/lib/api";

export default function StudyBuddyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [analysis, setAnalysis] = useState<StudyAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const profile = course.bootstrap.course_profile;
  const categories = profile?.grading_categories ?? [];
  const deadlines = profile?.key_deadlines ?? [];

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("material_type", "notes");

      await api.uploadStudyMaterial(id, formData);
      setUploadedCount((n) => n + 1);
      setFile(null);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await api.analyzeStudyContext(id);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Make sure the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6 stagger">
      <div>
        <p className="section-label mb-1">Study Context</p>
        <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
          Study Buddy
        </h1>
        <p className="text-burnt-peach-500 text-sm mt-1">
          Upload notes and study materials — the Study Context Agent identifies weak areas and priorities.
        </p>
      </div>

      {error && (
        <div className="card border-espresso-200 bg-espresso-50 p-4 text-espresso-900 text-sm">
          {error}
        </div>
      )}

      {/* Upload */}
      <div className="card p-5 space-y-3">
        <p className="section-label">Upload Study Material</p>
        <p className="text-sm text-burnt-peach-500">
          PDF notes, NotebookLM exports, Goodnotes exports, lecture slides.
        </p>
        <input
          type="text"
          placeholder="Material title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input w-full"
        />
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
          }}
          className="text-sm text-espresso-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-almond-cream-100 file:text-espresso-900 hover:file:bg-almond-cream-200 transition-all"
        />
        <div className="flex gap-3 items-center">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {uploadedCount > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-secondary disabled:opacity-50"
            >
              {analyzing ? "Analyzing…" : `Analyze ${uploadedCount} material${uploadedCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
        {uploadedCount > 0 && !analysis && !analyzing && (
          <p className="text-xs text-burnt-peach-500">
            {uploadedCount} material{uploadedCount > 1 ? "s" : ""} uploaded. Click &quot;Analyze&quot; to run the Study Context Agent.
          </p>
        )}
      </div>

      {/* Analysis results */}
      {analyzing && (
        <div className="card p-5 animate-pulse space-y-2">
          <div className="h-3 w-1/3 bg-almond-cream-100 rounded" />
          <div className="h-3 w-2/3 bg-almond-cream-100 rounded" />
          <div className="h-3 w-1/2 bg-almond-cream-100 rounded" />
        </div>
      )}

      {analysis && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-5 space-y-2">
            <p className="section-label">Summary</p>
            <p className="text-sm text-espresso-950 leading-relaxed">{analysis.summary}</p>
          </div>

          {analysis.study_priorities.length > 0 && (
            <div className="card p-5">
              <p className="section-label mb-3">Study Priorities</p>
              <ol className="space-y-2">
                {analysis.study_priorities.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono font-bold text-almond-cream-400 w-5 shrink-0">{i + 1}.</span>
                    <span className="text-espresso-950">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {analysis.weak_coverage.length > 0 && (
            <div className="card border-espresso-100 bg-espresso-50 p-5">
              <p className="section-label mb-3">Weak Coverage</p>
              <ul className="space-y-1">
                {analysis.weak_coverage.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-espresso-900">
                    <span>⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.key_topics.length > 0 && (
            <div className="card p-5">
              <p className="section-label mb-3">Key Topics Found</p>
              <div className="flex flex-wrap gap-2">
                {analysis.key_topics.map((t) => (
                  <span key={t} className="badge-ice">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course topic map */}
      {categories.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-3">Course Topics</p>
          <p className="text-xs text-almond-cream-400 mb-3">
            Grading categories from your syllabus — study focus areas.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.name} className="badge-green">
                {c.name} ({(c.weight * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming deadlines */}
      {deadlines.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-3">Upcoming Deadlines</p>
          <div className="space-y-2">
            {deadlines.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-espresso-950">{d.title}</span>
                <span className="font-mono text-xs text-burnt-peach-500">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
