"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Signup is now handled in the unified /login page (Sign Up tab).
export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?mode=signup");
  }, [router]);
  return null;
}
