/**
 * Clerk is optional. When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set, the app uses Clerk
 * for sign-in/up and session JWTs; otherwise Supabase Auth + dev bypass apply.
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export function isClerkAuthEnabled(): boolean {
  return Boolean(CLERK_PUBLISHABLE_KEY);
}
