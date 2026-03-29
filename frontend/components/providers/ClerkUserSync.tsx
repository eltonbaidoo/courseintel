"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import {
  DEV_USER_ID,
  devSessionEmail,
  hasDevSessionCookie,
} from "@/lib/dev-auth";

/** Mirrors Clerk user into the app store (sidebar email, etc.). */
export function ClerkUserSync() {
  const { user, isLoaded } = useUser();
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? user.username ?? "",
      });
    } else if (hasDevSessionCookie()) {
      setUser({ id: DEV_USER_ID, email: devSessionEmail() });
    } else {
      setUser(null);
    }
  }, [user, isLoaded, setUser]);

  return null;
}
