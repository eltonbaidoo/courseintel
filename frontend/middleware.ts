import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-server";

const clerkPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/verify",
  "/demo",
  "/early-access",
]);

function devAuthEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "false") return false;
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") return true;
  return process.env.NODE_ENV === "development";
}

function isDevAuthed(request: NextRequest): boolean {
  if (!devAuthEnabled()) return false;
  return request.cookies.get("courseintel_dev")?.value === "1";
}

const isClerkPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/verify(.*)",
  "/demo(.*)",
  "/early-access(.*)",
]);

async function supabaseOnlyMiddleware(request: NextRequest) {
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

  if (authed && pathname === "/demo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (authed && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

const clerkMw = clerkMiddleware(async (auth, request) => {
  if (isDevAuthed(request)) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  const path = request.nextUrl.pathname;

  if (
    userId &&
    (path === "/demo" || path === "/login" || path === "/signup")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isClerkPublic(request)) {
    await auth.protect();
  }
});

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (clerkPub) {
    return clerkMw(request, event);
  }
  return supabaseOnlyMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
