"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClerkAuthPanels } from "@/components/auth/ClerkAuthPanels";
import { isClerkAuthEnabled } from "@/lib/auth-config";

export default function SignupPage() {
  const router = useRouter();
  const clerk = isClerkAuthEnabled();

  useEffect(() => {
    if (!clerk) {
      router.replace("/login?mode=signup");
    }
  }, [clerk, router]);

  if (!clerk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shadow-grey-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-burnt-peach-500 border-t-transparent" />
      </div>
    );
  }

  return <ClerkAuthPanels mode="signup" />;
}
