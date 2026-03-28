import Link from "next/link";

const tabs = [
  { href: "resources", label: "Resources & Tools" },
  { href: "grades", label: "Grades" },
  { href: "goals", label: "Goal Simulator" },
  { href: "study", label: "Study Buddy" },
  { href: "actions", label: "Action Board" },
];

export default function CourseProfilePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Profile</h1>
        <p className="text-gray-500 text-sm">Course ID: {params.id}</p>
      </div>

      {/* Course Profile Card — grading, policies, student signal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-xl p-5 bg-white">
          <h2 className="font-semibold text-sm text-gray-500 uppercase mb-3">Grading Breakdown</h2>
          <p className="text-sm text-gray-400">Connect a syllabus to see grading weights.</p>
        </div>
        <div className="border rounded-xl p-5 bg-white">
          <h2 className="font-semibold text-sm text-gray-500 uppercase mb-3">Student Signal</h2>
          <p className="text-sm text-gray-400">Public sentiment synthesis will appear here.</p>
        </div>
      </div>

      {/* Nav to sub-screens */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/dashboard/course/${params.id}/${tab.href}`}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-brand-50 hover:border-brand-500 transition"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
