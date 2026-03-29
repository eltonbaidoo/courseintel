"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBootstrap } from "@/hooks/use-course";
import { useToast } from "@/components/ui/ToastProvider";
import type { BootstrapResponse } from "@/types/course";

type StepStatus = "waiting" | "running" | "done" | "error";
type AgentStep = {
  label: string;
  description: string;
  status: StepStatus;
  detail?: string;
  parallel?: boolean;
};

const INITIAL_STEPS: AgentStep[] = [
  {
    label: "Syllabus Acquisition",
    description: "Searching the web for your course syllabus",
    status: "waiting",
  },
  {
    label: "Syllabus Intelligence",
    description: "Extracting grading schema, deadlines & policies",
    status: "waiting",
  },
  {
    label: "Course Discovery",
    description: "Normalizing course identity and official links",
    status: "waiting",
    parallel: true,
  },
  {
    label: "Resource Discovery",
    description: "Finding GitHub repos, open courseware, Reddit",
    status: "waiting",
    parallel: true,
  },
  {
    label: "Reputation Analysis",
    description: "Synthesizing professor reviews and workload data",
    status: "waiting",
    parallel: true,
  },
  {
    label: "Tool Detection",
    description: "Identifying required platforms from syllabus",
    status: "waiting",
    parallel: true,
  },
  {
    label: "Obligation Normalization",
    description: "Deduplicating and urgency-ranking all deadlines",
    status: "waiting",
  },
];

// Populate step detail strings from the bootstrap response
function buildDetails(course: BootstrapResponse): Record<number, string> {
  const syllabusStatus = course.syllabus_status as unknown as Record<string, unknown>;
  const courseProfile = course.course_profile as unknown as Record<string, unknown>;
  const courseIdentity = course.course_identity as unknown as Record<string, unknown>;
  const studentSignal = course.student_signal as unknown as Record<string, unknown>;

  const categories = (courseProfile?.grading_categories as unknown[]) ?? [];
  const deadlines = (courseProfile?.key_deadlines as unknown[]) ?? [];
  const resources = course.resources ?? [];
  const tools = course.detected_tools ?? [];
  const obligations = course.obligations ?? [];

  const syllabusDetail =
    syllabusStatus?.source === "upload"
      ? "Uploaded PDF · confidence 100%"
      : syllabusStatus?.found
        ? `Found via web · ${Math.round(((syllabusStatus.confidence as number) ?? 0) * 100)}% confidence`
        : "Not found — using partial data";

  const profileDetail =
    categories.length > 0
      ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"} · ${deadlines.length} deadline${deadlines.length === 1 ? "" : "s"}`
      : "No grading schema extracted";

  const identityDetail =
    (courseIdentity?.canonical_name as string) ||
    (courseIdentity?.course_code as string) ||
    "Identity resolved";

  const resourceDetail =
    resources.length > 0
      ? `${resources.length} resource${resources.length === 1 ? "" : "s"} found`
      : "No public resources found";

  const workload = studentSignal?.workload_hours
    ? `~${studentSignal.workload_hours}h/week`
    : null;
  const difficulty = studentSignal?.difficulty as string | null;
  const reputationDetail =
    workload || difficulty
      ? [workload, difficulty].filter(Boolean).join(" · ")
      : "Signal acquired";

  const toolDetail =
    tools.length > 0
      ? tools
          .slice(0, 3)
          .map((t) => t.tool_name)
          .join(", ")
      : "No platforms detected";

  const obligationDetail =
    obligations.length > 0
      ? `${obligations.length} obligation${obligations.length === 1 ? "" : "s"} ranked`
      : deadlines.length > 0
        ? `${deadlines.length} deadline${deadlines.length === 1 ? "" : "s"} from syllabus`
        : "No obligations found";

  return {
    0: syllabusDetail,
    1: profileDetail,
    2: identityDetail,
    3: resourceDetail,
    4: reputationDetail,
    5: toolDetail,
    6: obligationDetail,
  };
}

const statusIcon = (s: StepStatus) => {
  if (s === "done") return <span className="text-burnt-peach-500 text-base">✓</span>;
  if (s === "running") return <span className="agent-dot inline-block" />;
  if (s === "error") return <span className="text-espresso-800">✗</span>;
  return <span className="w-2 h-2 rounded-full bg-almond-cream-200 inline-block" />;
};

export default function CourseSetupPage() {
  const router = useRouter();
  const { bootstrap } = useBootstrap();
  const { toast } = useToast();

  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [idle, setIdle] = useState(true);

  function updateStep(i: number, patch: Partial<AgentStep>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function updateSteps(indices: number[], patch: Partial<AgentStep>) {
    setSteps((prev) =>
      prev.map((s, idx) => (indices.includes(idx) ? { ...s, ...patch } : s)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRunning(true);
    setIdle(false);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "waiting" as const, detail: undefined })));

    const form = e.currentTarget;
    const data = new FormData(form);

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Kick off the real API call immediately in the background
    const bootstrapPromise = bootstrap(data, {
      university: (data.get("university") as string).trim(),
      course: (data.get("course") as string).trim(),
      professor: (data.get("professor") as string)?.trim() ?? "",
    });

    try {
      // Animate pipeline stages while API runs in parallel
      // Stage 1: Syllabus Acquisition (sequential)
      updateStep(0, { status: "running" });
      await delay(900);

      // Stage 2: Syllabus Intelligence (sequential)
      updateStep(0, { status: "done" });
      updateStep(1, { status: "running" });
      await delay(1100);

      // Stage 3: Parallel batch (Discovery + Resources + Reputation + Tools)
      updateStep(1, { status: "done" });
      updateSteps([2, 3, 4, 5], { status: "running" });
      await delay(1400);

      // Stage 4: Obligation normalization (sequential, after parallel batch)
      updateSteps([2, 3, 4, 5], { status: "done" });
      updateStep(6, { status: "running" });

      // Wait for the actual API response
      const newCourse = await bootstrapPromise;
      await delay(300);

      // Populate result details from response
      const details = buildDetails(newCourse as unknown as BootstrapResponse);
      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: "done" as const,
          detail: details[i],
        })),
      );

      await delay(500);
      toast({ title: "Course bootstrapped!", variant: "success" });
      router.push(`/dashboard/course/${newCourse.id}`);
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" || s.status === "waiting"
            ? { ...s, status: "error" as const }
            : s,
        ),
      );
      toast({
        title: "Bootstrap failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
      setRunning(false);
    }
  }

  const parallelIndices = INITIAL_STEPS.map((s, i) => (s.parallel ? i : -1)).filter((i) => i >= 0);
  const parallelStart = Math.min(...parallelIndices);

  return (
    <div className="max-w-2xl stagger">
      <div className="mb-8">
        <p className="section-label mb-2">New Course</p>
        <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
          Bootstrap a Course
        </h1>
        <p className="text-espresso-800 text-sm mt-1">
          Enter your course details. CourseIntel runs an 8-agent pipeline to
          build your intelligence model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
              University *
            </label>
            <input
              name="university"
              required
              disabled={running}
              className="input"
              placeholder="e.g. Georgia Tech"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
              Course Name or Code *
            </label>
            <input
              name="course"
              required
              disabled={running}
              className="input"
              placeholder="e.g. CS 4400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
              Professor
            </label>
            <input
              name="professor"
              disabled={running}
              className="input"
              placeholder="e.g. Dr. Miller (optional)"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
              Upload Syllabus
            </label>
            <input
              name="syllabus"
              type="file"
              accept=".pdf"
              disabled={running}
              className="text-sm text-espresso-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-almond-cream-100 file:text-espresso-900 hover:file:bg-almond-cream-200 transition-all"
            />
            <p className="text-xs text-almond-cream-400 mt-1">
              PDF only · max 10 MB · optional, we&apos;ll try to find it
            </p>
          </div>

          <button
            type="submit"
            disabled={running}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {running ? "Agents running..." : "Bootstrap Course"}
          </button>
        </form>

        {/* Agent progress panel */}
        <div className="card p-5">
          <p className="section-label mb-4">Agent Pipeline</p>
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isParallelStart = i === parallelStart;
              const isParallelGroup = step.parallel;
              return (
                <div key={i}>
                  {isParallelStart && (
                    <p className="text-[10px] font-semibold text-almond-cream-400 uppercase tracking-widest mb-1.5 mt-0.5 ml-8">
                      parallel
                    </p>
                  )}
                  <div
                    className={`flex items-start gap-3 text-sm transition-all duration-300 ${
                      isParallelGroup ? "ml-3 pl-3 border-l border-almond-cream-200" : ""
                    }`}
                  >
                    <span className="w-5 flex justify-center shrink-0 mt-0.5">
                      {statusIcon(step.status)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            step.status === "done"
                              ? "text-espresso-900 font-medium"
                              : step.status === "running"
                                ? "text-shadow-grey-900 font-semibold"
                                : step.status === "error"
                                  ? "text-espresso-800"
                                  : "text-almond-cream-400"
                          }
                        >
                          {step.label}
                        </span>
                        {step.status === "running" && (
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="w-1 h-1 rounded-full bg-burnt-peach-400 animate-agent-run"
                                style={{ animationDelay: `${d * 200}ms` }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      {step.status === "waiting" || step.status === "running" ? (
                        <p className="text-[11px] text-almond-cream-400 mt-0.5 leading-snug">
                          {step.description}
                        </p>
                      ) : step.detail ? (
                        <p
                          className={`text-[11px] mt-0.5 leading-snug ${
                            step.status === "done"
                              ? "text-burnt-peach-500"
                              : "text-espresso-700"
                          }`}
                        >
                          {step.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {idle && (
            <p className="text-xs text-almond-cream-400 mt-4 text-center">
              Fill the form and click Bootstrap to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
