import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-server";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/verify", "/demo"]);

function devAuthEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "false") return false;
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") return true;
  return process.env.NODE_ENV === "development";
}

function isDevAuthed(request: NextRequest): boolean {
  if (!devAuthEnabled()) return false;
  return request.cookies.get("courseintel_dev")?.value === "1";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authed = Boolean(session) || isDevAuthed(request);

  const isPublic = PUBLIC_PATHS.has(pathname);
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify";

  // Logged-in users skip the demo wizard
  if (authed && pathname === "/demo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Authenticated user on auth pages → redirect to dashboard
  if (authed && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on protected pages → redirect to login
  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
