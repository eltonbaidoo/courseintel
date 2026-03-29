"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";

type Props = { mode: "login" | "signup" };

export function ClerkAuthPanels({ mode }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-shadow-grey-950 px-4 py-12">
      <Link
        href="/"
        className="mb-10 flex flex-col items-center gap-2 text-center transition-opacity hover:opacity-90"
      >
        <CourseIntelLogo className="h-10 w-auto md:h-12" priority />
        <p className="font-condensed text-sm font-medium tracking-wide text-almond-cream-400">
          Know your course. Before it knows you.
        </p>
      </Link>

      <div className="w-full max-w-[420px] [&_.cl-card]:border-espresso-800 [&_.cl-card]:bg-espresso-950 [&_.cl-footerAction]:text-almond-cream-500">
        {mode === "login" ? (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            forceRedirectUrl="/dashboard"
          />
        ) : (
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl="/dashboard"
          />
        )}
      </div>
    </div>
  );
}
