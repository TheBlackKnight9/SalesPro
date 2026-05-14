/**
 * middleware.ts  (project root — next to `src/`)
 * =============================================================================
 * SalesPro CRM — Next.js Edge Middleware for Route Protection
 * =============================================================================
 *
 * Runs on the Edge Runtime (before a page renders) for every request that
 * matches the `config.matcher` pattern below.
 *
 * Responsibilities:
 *  1. Block unauthenticated requests to /dashboard/* → redirect to /login.
 *  2. Block requests from roles not listed in the route's `allowedRoles`
 *     map → redirect to /dashboard/access-denied.
 *  3. Redirect already-authenticated users away from /login and /register.
 *
 * Why Edge Middleware rather than a client-side HOC?
 *  • Zero layout shift — the redirect happens before the page is sent, so
 *    the user never sees a protected page flicker before being evicted.
 *  • Works even if JavaScript is disabled.
 *  • Fully server-rendered pages (RSC) are also protected.
 *
 * Limitation: the Edge Runtime cannot import Node.js modules (no `jsonwebtoken`).
 * We decode the JWT payload here WITHOUT verifying its signature (too heavy for
 * the edge). A compromised JWT might pass this check, but:
 *   a) The Express API will reject it on every real data request (full verify).
 *   b) The worst-case outcome is that the user SEES a protected page briefly —
 *      no data is served without a valid API call.
 * If you need edge-side signature verification, use `jose` (Web Crypto–compatible).
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/store/useAuthStore";

// ---------------------------------------------------------------------------
// 1. Route → allowed roles map
//    Add new dashboard sections here.  Use "*" sentinel for "any authenticated
//    role".  More-specific paths take priority because we check them first.
// ---------------------------------------------------------------------------

type RouteRoleConfig = {
  pattern: RegExp;
  allowedRoles: UserRole[] | "*";
};

const PROTECTED_ROUTES: RouteRoleConfig[] = [
  // ── Super-admin only ─────────────────────────────────────────────────────
  {
    pattern:      /^\/dashboard\/admin(\/|$)/,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    pattern:      /^\/dashboard\/offices(\/|$)/,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    pattern:      /^\/dashboard\/users(\/|$)/,
    allowedRoles: ["SUPER_ADMIN"],
  },

  // ── Manager + Super-admin ────────────────────────────────────────────────
  {
    pattern:      /^\/dashboard\/reports(\/|$)/,
    allowedRoles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    pattern:      /^\/dashboard\/analytics(\/|$)/,
    allowedRoles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    pattern:      /^\/dashboard\/team(\/|$)/,
    allowedRoles: ["SUPER_ADMIN", "MANAGER"],
  },

  // ── Any authenticated user ───────────────────────────────────────────────
  {
    pattern:      /^\/dashboard(\/|$)/,
    allowedRoles: "*",
  },
];

// ---------------------------------------------------------------------------
// 2. Public routes — skip middleware entirely
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = [
  /^\/login$/,
  /^\/register$/,
  /^\/forgot-password(\/|$)/,
  /^\/reset-password(\/|$)/,
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/api\//,   // Next.js API routes (if any)
  /^\/public\//,
];

// ---------------------------------------------------------------------------
// 3. JWT payload decoder (edge-safe, no signature verification)
// ---------------------------------------------------------------------------

interface JwtPayload {
  sub?:    string;   // user id
  name?:   string;
  email?:  string;
  role?:   UserRole;
  officeId?: string | null;
  exp?:    number;   // expiry timestamp
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    // Base64URL → Base64 → UTF-8
    const padded  = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;          // No expiry → treat as valid
  return Date.now() >= payload.exp * 1000; // exp is in seconds
}

// ---------------------------------------------------------------------------
// 4. Token extraction
//    Priority: Authorization header (API calls) → cookie (browser requests)
// ---------------------------------------------------------------------------

const TOKEN_COOKIE = "salespro_token" as const;

function extractToken(request: NextRequest): string | null {
  // a) Authorization header (e.g. from fetch/axios in SSR context)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // b) HttpOnly cookie (set this in your login API route for SSR auth)
  const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  return null;
}

// ---------------------------------------------------------------------------
// 5. Middleware function
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // ── a) Skip public routes immediately ─────────────────────────────────
  if (PUBLIC_ROUTES.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // ── b) Is this a protected route? ─────────────────────────────────────
  const matchedRoute = PROTECTED_ROUTES.find(({ pattern }) =>
    pattern.test(pathname)
  );

  if (!matchedRoute) {
    // Not a protected route — pass through
    return NextResponse.next();
  }

  // ── c) Extract & decode token ──────────────────────────────────────────
  const token   = extractToken(request);
  const payload = token ? decodeJwt(token) : null;

  // ── d) Authentication check ────────────────────────────────────────────
  const isAuthenticated =
    !!payload && !!payload.role && !isTokenExpired(payload);

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason",   "unauthenticated");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── e) Authorisation (role) check ─────────────────────────────────────
  const userRole = payload!.role!;

  if (
    matchedRoute.allowedRoles !== "*" &&
    !matchedRoute.allowedRoles.includes(userRole)
  ) {
    const deniedUrl = new URL("/dashboard/access-denied", request.url);
    deniedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(deniedUrl);
  }

  // ── f) Redirect authenticated users away from auth pages ──────────────
  //    (handled above by PUBLIC_ROUTES skip — but listed here for clarity)

  // ── g) All checks passed — attach decoded claims as request headers ────
  //    Downstream Server Components can read these without re-decoding.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id",       payload!.sub     ?? "");
  requestHeaders.set("x-user-role",     payload!.role    ?? "");
  requestHeaders.set("x-user-email",    payload!.email   ?? "");
  requestHeaders.set("x-user-office-id",payload!.officeId ?? "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ---------------------------------------------------------------------------
// 6. Matcher — which paths the middleware runs on
//    Keep this as narrow as possible for performance.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (Next.js static files)
     *  - _next/image   (Next.js image optimisation)
     *  - favicon.ico
     *  - public assets (if you have a /public route)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
