import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware to Proxy (same semantics, one file, project root).
// This only does a cheap "is there a session cookie at all" redirect — the
// authoritative check (does this session actually have access to this branch,
// what role, etc.) happens server-side in each surface's layout.tsx via
// getSession() + resolveBranchForUser(), which need the Node runtime (Prisma)
// that this proxy does not run in.

const SESSION_COOKIE = "tenderista_session";

const PUBLIC_PATHS = ["/login", "/admin/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/favicon.ico" ||
    // PWA static assets — browsers/OS fetch these to evaluate installability,
    // often unauthenticated (e.g. from the login page), so they must never
    // redirect. Public static files only, no application data.
    pathname === "/manifest.webmanifest" ||
    pathname === "/apple-touch-icon.png" ||
    pathname.startsWith("/icons/");

  if (isPublic) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
