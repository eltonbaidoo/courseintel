/**
 * Temporary local-only auth bypass.
 * On by default in NODE_ENV=development unless NEXT_PUBLIC_DEV_AUTH_BYPASS=false.
 * In production builds, only NEXT_PUBLIC_DEV_AUTH_BYPASS=true enables it (not recommended).
 */

export const DEV_AUTH_BYPASS = (() => {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "false") return false;
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") return true;
  return process.env.NODE_ENV === "development";
})();

/** Must match backend DEV_BEARER_TOKEN when DEV_AUTH_BYPASS is enabled there. */
export const DEV_BEARER_TOKEN =
  process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN ?? "courseintel-local-dev-bearer";

const DEV_EMAIL = "Course@intel.edu";
const DEV_PASSWORD = "testpass2@CFCN";

export const DEV_USER_ID = "courseintel-dev-local";

export function devCredentialsMatch(email: string, password: string): boolean {
  if (!DEV_AUTH_BYPASS) return false;
  return (
    email.trim().toLowerCase() === DEV_EMAIL.toLowerCase() &&
    password === DEV_PASSWORD
  );
}

export function devSessionEmail(): string {
  return DEV_EMAIL;
}

const COOKIE_NAME = "courseintel_dev";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setDevSessionClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearDevSessionClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function hasDevSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === `${COOKIE_NAME}=1`);
}
