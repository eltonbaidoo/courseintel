"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CourseSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("Running discovery agents...");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const result = await api.bootstrapCourse(data);
      setStatus("Course bootstrapped! Loading profile...");
      // TODO: save result to Supabase and redirect to course profile
      console.log(result);
      router.push("/dashboard");
    } catch (err) {
      setStatus("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Add a Course</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter your course details. CourseIntel will search for the syllabus and course ecosystem automatically.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">University *</label>
          <input name="university" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Georgia Tech" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Course Name or Code *</label>
          <input name="course" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. CS 4400 or Intro to Databases" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Professor (optional)</label>
          <input name="professor" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Dr. Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Upload Syllabus (optional)</label>
          <input name="syllabus" type="file" accept=".pdf" className="w-full text-sm" />
          <p className="text-xs text-gray-400 mt-1">PDF only. If not uploaded, CourseIntel will try to find one.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition"
        >
          {loading ? "Running agents..." : "Bootstrap Course"}
        </button>
        {status && <p className="text-sm text-gray-600 text-center">{status}</p>}
      </form>
    </div>
  );
}
