"use client";

import { isClerkAuthEnabled } from "@/lib/auth-config";
import { ClerkUserSync } from "@/components/providers/ClerkUserSync";
import { SupabaseAuthSync } from "@/components/providers/SupabaseAuthSync";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isClerkAuthEnabled() ? <ClerkUserSync /> : <SupabaseAuthSync />}
      {children}
    </>
  );
}
