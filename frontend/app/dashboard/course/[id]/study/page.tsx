"use client";

import { use, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudyBuddyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

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

  function handleUpload() {
    if (!file) return;
    setUploaded(true);
  }

  return (
    <div className="space-y-6 stagger">
      <div>
        <p className="section-label mb-1">Study Context</p>
        <h1 className="font-display text-3xl font-bold text-honeydew-950">
          Study Buddy
        </h1>
        <p className="text-honeydew-500 text-sm mt-1">
          Upload notes and study materials to identify weak areas and priorities.
        </p>
      </div>

      {/* Upload */}
      <div className="card p-5 space-y-3">
        <p className="section-label">Upload Study Material</p>
        <p className="text-sm text-honeydew-500">
          PDF notes, NotebookLM exports, Goodnotes exports, lecture slides.
        </p>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setUploaded(false);
          }}
          className="text-sm text-honeydew-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-honeydew-100 file:text-honeydew-700 hover:file:bg-honeydew-200 transition-all"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploaded}
          className="btn-primary disabled:opacity-50"
        >
          {uploaded ? "Uploaded" : "Summarize Material"}
        </button>
      </div>

      {/* Coming soon notice */}
      {uploaded && (
        <div className="card border-banana-200 bg-banana-50 p-5 animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🚧</span>
            <div>
              <p className="font-semibold text-banana-900 text-sm font-display">
                Study analysis coming soon
              </p>
              <p className="text-banana-800 text-sm mt-0.5">
                The Study Context agent is being connected. Once live, it will
                analyze your materials, extract key topics, and identify weak
                coverage areas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Course topic map from bootstrap data */}
      {categories.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-3">Course Topics</p>
          <p className="text-xs text-honeydew-400 mb-3">
            Grading categories from your course profile — study focus areas.
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

      {/* Upcoming deadlines as study context */}
      {deadlines.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-3">Upcoming Deadlines</p>
          <div className="space-y-2">
            {deadlines.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-honeydew-800">{d.title}</span>
                <span className="font-mono text-xs text-honeydew-500">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
