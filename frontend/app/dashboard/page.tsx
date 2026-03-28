import Link from "next/link";

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link
          href="/dashboard/course/new/setup"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition"
        >
          + Add Course
        </Link>
      </div>
      <div className="text-gray-500 text-sm py-12 text-center border-2 border-dashed rounded-xl">
        No courses yet. Add your first course to get started.
      </div>
    </div>
  );
}
