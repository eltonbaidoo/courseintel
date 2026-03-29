"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import { clearDevSessionClient, hasDevSessionCookie } from "@/lib/dev-auth";
import { isClerkAuthEnabled } from "@/lib/auth-config";

type SetUser = (user: { id: string; email: string } | null) => void;

export function SignOutControl() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  if (isClerkAuthEnabled()) {
    return <ClerkSignOut router={router} setUser={setUser} />;
  }
  return <SupabaseSignOut router={router} setUser={setUser} />;
}

function ClerkSignOut({
  router,
  setUser,
}: {
  router: ReturnType<typeof useRouter>;
  setUser: SetUser;
}) {
  const { signOut } = useClerk();

  async function handleSignOut() {
    if (hasDevSessionCookie()) {
      clearDevSessionClient();
      setUser(null);
    } else {
      await signOut();
      setUser(null);
    }
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-xs text-espresso-800 hover:text-almond-cream-300 transition-colors"
    >
      Sign out
    </button>
  );
}

function SupabaseSignOut({
  router,
  setUser,
}: {
  router: ReturnType<typeof useRouter>;
  setUser: SetUser;
}) {
  async function handleSignOut() {
    if (hasDevSessionCookie()) {
      clearDevSessionClient();
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-xs text-espresso-800 hover:text-almond-cream-300 transition-colors"
    >
      Sign out
    </button>
  );
}
