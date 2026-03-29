"use client";

export function ExtensionPromo() {
  return (
    <div className="card relative overflow-hidden border-burnt-peach-200 bg-burnt-peach-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-11 h-11 rounded-xl bg-burnt-peach-500/15 border border-burnt-peach-300/40 flex items-center justify-center text-xl shrink-0">
          🧩
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="section-label text-burnt-peach-800">Chrome extension</p>
          <h2 className="font-display font-bold text-shadow-grey-950 text-lg">
            Capture grades and LMS pages from Canvas, Gradescope, and more
          </h2>
          <p className="text-sm text-espresso-800 leading-relaxed">
            Install the CourseIntel extension from the <code className="text-xs bg-almond-cream-100 px-1.5 py-0.5 rounded">extension/</code>{" "}
            folder in this repo (Chrome → Extensions → Developer mode → Load unpacked).
            When you open your LMS, the extension can scrape structured data for validation
            against your course model.
          </p>
          <ul className="text-xs text-burnt-peach-500 space-y-1 list-disc list-inside">
            <li>Stay on your real course pages; no manual copy-paste</li>
            <li>Works alongside Tools &amp; Resources → Connect for per-platform tips</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
