"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import {
  DEV_USER_ID,
  devSessionEmail,
  hasDevSessionCookie,
} from "@/lib/dev-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
      } else if (hasDevSessionCookie()) {
        setUser({ id: DEV_USER_ID, email: devSessionEmail() });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
      } else if (hasDevSessionCookie()) {
        setUser({ id: DEV_USER_ID, email: devSessionEmail() });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
