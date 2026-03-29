import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-server";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/verify", "/demo"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify";

  // Logged-in users skip the demo wizard
  if (session && pathname === "/demo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Authenticated user on auth pages → redirect to dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on protected pages → redirect to login
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
