"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { useActionPlan } from "@/hooks/use-action-plan";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ActionPlanResponse } from "@/lib/api";
import { parseIcs, type CalendarEvent } from "@/lib/ics";

const riskStyles: Record<string, { card: string; badge: string; label: string }> = {
  critical: { card: "border-l-espresso-800 bg-espresso-50", badge: "bg-espresso-100 text-espresso-900", label: "Critical Risk" },
  high:     { card: "border-l-burnt-peach-500 bg-espresso-50/50", badge: "bg-espresso-100 text-espresso-800", label: "High Risk" },
  medium:   { card: "border-l-almond-cream-400 bg-almond-cream-50", badge: "bg-almond-cream-100 text-almond-cream-800", label: "Medium Risk" },
  low:      { card: "border-l-almond-cream-400 bg-almond-cream-50", badge: "bg-almond-cream-100 text-espresso-900", label: "Low Risk" },
  unknown:  { card: "border-l-almond-cream-200 bg-almond-cream-50/30", badge: "bg-almond-cream-100 text-burnt-peach-500", label: "Analyzing…" },
};

const priorityDot: Record<number, string> = {
  1: "bg-espresso-800",
  2: "bg-burnt-peach-600",
  3: "bg-almond-cream-500",
  4: "bg-burnt-peach-500",
  5: "bg-almond-cream-300",
};

export default function ActionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const { data: plan, error, isLoading, mutate } = useActionPlan(course ? id : null);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [importing, setImporting] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    const key = `courseintel-calendar-${id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CalendarEvent[];
      if (Array.isArray(parsed)) setCalendarEvents(parsed);
    } catch {
      // Ignore malformed local cache
    }
  }, [id]);

  useEffect(() => {
    const key = `courseintel-calendar-${id}`;
    localStorage.setItem(key, JSON.stringify(calendarEvents));
  }, [calendarEvents, id]);

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

  const deadlines = course.bootstrap.course_profile?.key_deadlines ?? [];
  const typedPlan = plan as ActionPlanResponse | undefined;
  const risk = riskStyles[typedPlan?.risk_level ?? "unknown"];
  const formatDateTime = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  );
  const formatDate = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }),
    [],
  );

  async function importIcsText(icsText: string, source: "upload" | "url") {
    const parsed = parseIcs(icsText).map((e) => ({ ...e, source }));
    if (parsed.length === 0) {
      throw new Error("No calendar events found in this ICS.");
    }
    setCalendarEvents(parsed);
    setCalendarError(null);
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      await importIcsText(text, "upload");
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : "Failed to import ICS file");
    } finally {
      setImporting(false);
    }
  }

  async function handleImportUrl() {
    const url = calendarUrl.trim();
    if (!url) {
      setCalendarError("Paste an ICS URL first.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/ics/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: "URL import failed" }))) as { error?: string };
        throw new Error(body.error || `URL import failed (${res.status})`);
      }
      const body = (await res.json()) as { ics: string };
      await importIcsText(body.ics, "url");
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : "Failed to import ICS URL");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 stagger">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Judgment Agent</p>
          <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
            Action Board
          </h1>
          <p className="text-burnt-peach-500 text-sm mt-1">
            Prioritized actions based on your course data and grade standing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="btn-secondary text-xs disabled:opacity-50"
        >
          {isLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="card p-5 space-y-3 animate-pulse">
          <div className="h-4 w-1/4 bg-almond-cream-100 rounded" />
          <div className="h-3 w-3/4 bg-almond-cream-100 rounded" />
          <div className="h-3 w-1/2 bg-almond-cream-100 rounded" />
        </div>
      )}

      {/* API error */}
      {error && (
        <div className="card border-espresso-200 bg-espresso-50 p-4 text-espresso-900 text-sm space-y-1">
          <p className="font-semibold">Could not load action plan</p>
          <p>Make sure the backend is running at <code className="font-mono text-xs">NEXT_PUBLIC_API_URL</code>.</p>
        </div>
      )}

      {/* Risk + focus note */}
      {typedPlan && (
        <div className={`card border-l-4 p-5 space-y-3 ${risk.card}`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${risk.badge}`}>
              {risk.label}
            </span>
            {typedPlan.risk_explanation && (
              <p className="text-sm text-espresso-900">{typedPlan.risk_explanation}</p>
            )}
          </div>
          {typedPlan.focus_note && (
            <div className="flex gap-2 items-start">
              <span className="text-lg">🎯</span>
              <p className="text-sm font-medium text-shadow-grey-900 leading-relaxed">
                {typedPlan.focus_note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weekly actions */}
      {typedPlan && typedPlan.weekly_actions.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">This Week&apos;s Actions</p>
          {typedPlan.weekly_actions.map((action, i) => (
            <div key={i} className="card p-4 flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-3 h-3 rounded-full ${priorityDot[action.priority] ?? "bg-almond-cream-300"}`} />
                <span className="text-xs font-mono text-almond-cream-400">P{action.priority}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-shadow-grey-900 text-sm">{action.title}</p>
                  {action.due_date && (
                    <span className="font-mono text-xs text-burnt-peach-500 shrink-0">{action.due_date}</span>
                  )}
                </div>
                <p className="text-xs text-burnt-peach-500 leading-relaxed">{action.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing data flags */}
      {typedPlan && typedPlan.missing_data_flags.length > 0 && (
        <div className="card border-almond-cream-200 bg-almond-cream-50 p-4">
          <p className="section-label mb-2">Missing Data</p>
          <ul className="space-y-1">
            {typedPlan.missing_data_flags.map((flag, i) => (
              <li key={i} className="flex gap-2 text-sm text-almond-cream-800">
                <span>⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback deadlines from bootstrap */}
      {deadlines.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">Upcoming Deadlines (from Syllabus)</p>
          {deadlines.map((d, i) => {
            const urgency = d.type === "exam" ? "high" : d.type === "assignment" ? "medium" : "low";
            const style = urgency === "high"
              ? "border-l-burnt-peach-600 bg-espresso-50"
              : urgency === "medium"
                ? "border-l-almond-cream-400 bg-almond-cream-50"
                : "border-l-almond-cream-300 bg-almond-cream-50";
            return (
              <div key={i} className={`card border-l-4 p-4 ${style}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-almond-cream-400">#{i + 1}</span>
                    <span className="font-semibold text-shadow-grey-900 text-sm">{d.title}</span>
                    <span className="badge-ice">{d.type}</span>
                  </div>
                  {d.date && (
                    <span className="font-mono font-semibold text-sm text-espresso-900">{d.date}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label mb-1">Calendar Import</p>
            <p className="text-sm text-burnt-peach-500">
              Import an iCalendar feed (URL or .ics) and view events in a calendar table.
            </p>
          </div>
          {calendarEvents.length > 0 && (
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setCalendarEvents([])}
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <input
            value={calendarUrl}
            onChange={(e) => setCalendarUrl(e.target.value)}
            placeholder="Paste ICS URL (https://...)"
            className="input"
            disabled={importing}
          />
          <button
            type="button"
            onClick={handleImportUrl}
            disabled={importing}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import URL"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".ics,text/calendar"
            disabled={importing}
            onChange={(e) => void handleImportFile(e.target.files?.[0] ?? null)}
            className="text-sm text-espresso-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-almond-cream-100 file:text-espresso-900 hover:file:bg-almond-cream-200 transition-all"
          />
          <span className="text-xs text-burnt-peach-500">.ics only</span>
        </div>

        {calendarError && (
          <div className="rounded-lg border border-espresso-200 bg-espresso-50 p-3 text-sm text-espresso-900">
            {calendarError}
          </div>
        )}

        {calendarEvents.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-almond-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-almond-cream-50 text-espresso-900">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Start</th>
                  <th className="text-left px-3 py-2 font-semibold">End</th>
                  <th className="text-left px-3 py-2 font-semibold">Title</th>
                  <th className="text-left px-3 py-2 font-semibold">Location</th>
                  <th className="text-left px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {calendarEvents.map((evt) => (
                  <tr key={`${evt.uid}-${evt.start}`} className="border-t border-almond-cream-100">
                    <td className="px-3 py-2 text-burnt-peach-500">
                      {evt.allDay ? formatDate.format(new Date(evt.start)) : formatDateTime.format(new Date(evt.start))}
                    </td>
                    <td className="px-3 py-2 text-burnt-peach-500">
                      {evt.end
                        ? (evt.allDay ? formatDate.format(new Date(evt.end)) : formatDateTime.format(new Date(evt.end)))
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-shadow-grey-900 font-medium">{evt.title}</td>
                    <td className="px-3 py-2 text-espresso-800">{evt.location || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="badge-ice">{evt.source ?? "import"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-burnt-peach-500">
            No imported events yet.
          </p>
        )}
      </div>

      {!typedPlan && !isLoading && !error && deadlines.length === 0 && (
        <EmptyState
          icon="📋"
          title="No actions yet"
          description="Click Refresh to generate your action plan once the backend is running."
        />
      )}
    </div>
  );
}
