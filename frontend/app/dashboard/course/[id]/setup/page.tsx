"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBootstrap } from "@/hooks/use-course";
import { useToast } from "@/components/ui/ToastProvider";

type StepStatus = "waiting" | "running" | "done" | "error";
type AgentStep = { label: string; status: StepStatus };

const INITIAL_STEPS: AgentStep[] = [
  { label: "Discovering course identity", status: "waiting" },
  { label: "Searching for syllabus", status: "waiting" },
  { label: "Parsing course structure", status: "waiting" },
  { label: "Finding public resources", status: "waiting" },
  { label: "Detecting required tools", status: "waiting" },
  { label: "Synthesising student signal", status: "waiting" },
  { label: "Generating action plan", status: "waiting" },
];

const statusIcon = (s: StepStatus) => {
  if (s === "done") return <span className="text-honeydew-500">✓</span>;
  if (s === "running") return <span className="agent-dot inline-block" />;
  if (s === "error") return <span className="text-coral-500">✗</span>;
  return <span className="w-2 h-2 rounded-full bg-honeydew-200 inline-block" />;
};

export default function CourseSetupPage() {
  const router = useRouter();
  const { bootstrap } = useBootstrap();
  const { toast } = useToast();

  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  function updateStep(i: number, status: StepStatus) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status } : s)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRunning(true);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "waiting" as const })));

    const form = e.currentTarget;
    const data = new FormData(form);

    // Animate steps for UX feedback while API runs
    const stepDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      updateStep(i, "running");
      setCurrentStep(i);
      await stepDelay(400);
    }

    try {
      const newCourse = await bootstrap(data, {
        university: (data.get("university") as string).trim(),
        course: (data.get("course") as string).trim(),
        professor: (data.get("professor") as string)?.trim() ?? "",
      });

      // Mark all done
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
      await stepDelay(600);

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
      setCurrentStep(-1);
    }
  }

  return (
    <div className="max-w-2xl stagger">
      <div className="mb-8">
        <p className="section-label mb-2">New Course</p>
        <h1 className="font-display text-3xl font-bold text-honeydew-950">
          Bootstrap a Course
        </h1>
        <p className="text-honeydew-600 text-sm mt-1">
          Enter your course details. CourseIntel runs 7 agents in sequence to
          build your intelligence model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-honeydew-600 mb-1.5">
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
            <label className="block text-xs font-semibold text-honeydew-600 mb-1.5">
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
            <label className="block text-xs font-semibold text-honeydew-600 mb-1.5">
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
            <label className="block text-xs font-semibold text-honeydew-600 mb-1.5">
              Upload Syllabus
            </label>
            <input
              name="syllabus"
              type="file"
              accept=".pdf"
              disabled={running}
              className="text-sm text-honeydew-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-honeydew-100 file:text-honeydew-700 hover:file:bg-honeydew-200 transition-all"
            />
            <p className="text-xs text-honeydew-400 mt-1">
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
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300
                  ${step.status === "running" ? "text-honeydew-900 font-semibold" : step.status === "done" ? "text-honeydew-500" : step.status === "error" ? "text-coral-600" : "text-honeydew-300"}`}
              >
                <span className="w-5 flex justify-center shrink-0">
                  {statusIcon(step.status)}
                </span>
                <span>{step.label}</span>
                {step.status === "running" && (
                  <span className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1 h-1 rounded-full bg-neon-ice-400 animate-agent-run"
                        style={{ animationDelay: `${d * 200}ms` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>

          {currentStep === -1 && !running && (
            <p className="text-xs text-honeydew-400 mt-4 text-center">
              Fill the form and click Bootstrap to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
