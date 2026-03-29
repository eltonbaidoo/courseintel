"use client";

export function ExtensionPromo() {
  return (
    <div className="card p-5 border-neon-ice-200 bg-gradient-to-br from-neon-ice-50/90 to-honeydew-50/80 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-ice-400/15 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-neon-ice-500/15 border border-neon-ice-300/40 flex items-center justify-center text-xl shrink-0">
          🧩
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="section-label text-neon-ice-800">Chrome extension</p>
          <h2 className="font-display font-bold text-honeydew-950 text-lg">
            Capture grades and LMS pages from Canvas, Gradescope, and more
          </h2>
          <p className="text-sm text-honeydew-600 leading-relaxed">
            Install the CourseIntel extension from the <code className="text-xs bg-honeydew-100 px-1.5 py-0.5 rounded">extension/</code>{" "}
            folder in this repo (Chrome → Extensions → Developer mode → Load unpacked).
            When you open your LMS, the extension can scrape structured data for validation
            against your course model.
          </p>
          <ul className="text-xs text-honeydew-500 space-y-1 list-disc list-inside">
            <li>Stay on your real course pages — no manual copy-paste</li>
            <li>Works alongside Tools &amp; Resources → Connect for per-platform tips</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
