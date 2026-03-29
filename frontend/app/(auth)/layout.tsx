import Link from "next/link";

import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-shadow-grey-950 px-4 py-12">
      <Link
        href="/"
        className="mb-10 flex flex-col items-center gap-3 text-center transition-opacity hover:opacity-90"
      >
        <CourseIntelLogo className="h-10 w-auto md:h-12" priority />
        <p className="font-condensed text-sm font-medium tracking-wide text-almond-cream-400">
          Know your course. Before it knows you.
        </p>
      </Link>

      <div className="w-full max-w-[420px] animate-slide-up">{children}</div>

      <div className="mt-12 flex items-center gap-4 text-xs text-espresso-700">
        <span>Academic intelligence</span>
        <span className="h-1 w-1 rounded-full bg-espresso-700" />
        <span>Built for students</span>
      </div>
    </div>
  );
}
