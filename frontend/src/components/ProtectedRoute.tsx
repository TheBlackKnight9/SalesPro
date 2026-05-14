/**
 * src/components/auth/ProtectedRoute.tsx
 * =============================================================================
 * SalesPro CRM — Client-Side ProtectedRoute HOC / Wrapper
 * =============================================================================
 *
 * Use this alongside (or instead of) middleware.ts for:
 *  • Conditional rendering inside a page (e.g. "show Delete button only to
 *    SUPER_ADMIN") without a full redirect.
 *  • Pages that are pre-rendered / statically exported where middleware
 *    cannot run (edge-middleware requires a Next.js server).
 *  • Fine-grained UI elements that need role awareness.
 *
 * Usage — wrap a page or section:
 * ─────────────────────────────────────────────────────────────────────────────
 *  // Protect the whole page (redirect on failure):
 *  export default function AdminPage() {
 *    return (
 *      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
 *        <AdminDashboard />
 *      </ProtectedRoute>
 *    );
 *  }
 *
 *  // Protect a UI section (hide instead of redirect):
 *  <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]} silent>
 *    <DeleteButton />
 *  </ProtectedRoute>
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props:
 *  children       — The content to render when authorised.
 *  allowedRoles   — Roles that may see the content.  Omit to allow any role.
 *  silent         — If true, render `null` instead of redirecting/showing
 *                   the fallback.  Great for hiding a button without routing.
 *  fallback       — Custom JSX shown when authorised but not allowed.
 *                   Defaults to the built-in AccessDenied card.
 *  redirectTo     — Override the redirect target for unauthenticated users.
 *                   Defaults to "/login".
 *  deniedRedirectTo — Override the redirect for authenticated-but-wrong-role.
 *                     Defaults to "/dashboard/access-denied".
 * =============================================================================
 */

"use client";

import React, { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  useAuthStore,
  useIsAuthenticated,
  useIsHydrated,
  useUserRole,
  type UserRole,
} from "@/store/useAuthStore";

// ---------------------------------------------------------------------------
// 1. Props
// ---------------------------------------------------------------------------

export interface ProtectedRouteProps {
  children: ReactNode;

  /** Roles that are permitted to see `children`.  Omit for "any role". */
  allowedRoles?: UserRole[];

  /**
   * If true: render `null` when access is denied instead of redirecting
   * or showing a fallback.  Use for conditional UI elements (not whole pages).
   */
  silent?: boolean;

  /** Custom component shown when the user has the wrong role (non-silent mode). */
  fallback?: ReactNode;

  /** Where to redirect an unauthenticated user.  Default: "/login" */
  redirectTo?: string;

  /** Where to redirect an authenticated user with insufficient role. */
  deniedRedirectTo?: string;
}

// ---------------------------------------------------------------------------
// 2. Built-in Access Denied card
// ---------------------------------------------------------------------------

function DefaultAccessDenied() {
  const router  = useRouter();
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="card max-w-md w-full text-center space-y-5">
        {/* Icon */}
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-danger-subtle)" }}
        >
          <svg
            className="h-8 w-8"
            style={{ color: "var(--color-danger)" }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874
                 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Copy */}
        <div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Access Denied
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Your account{user?.name ? ` (${user.name})` : ""} does not have
            permission to view this page.
          </p>
          {user?.role && (
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Current role:{" "}
              <span className="role-chip role-chip-agent">{user.role}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="btn btn-secondary"
            onClick={() => router.back()}
          >
            Go back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Loading skeleton shown while hydration completes
// ---------------------------------------------------------------------------

function HydrationSkeleton() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      aria-label="Loading…"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <svg
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--color-accent)" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Verifying session…
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. ProtectedRoute component
// ---------------------------------------------------------------------------

export function ProtectedRoute({
  children,
  allowedRoles,
  silent          = false,
  fallback,
  redirectTo      = "/login",
  deniedRedirectTo = "/dashboard/access-denied",
}: ProtectedRouteProps): ReactNode {
  const router          = useRouter();
  const pathname        = usePathname();
  const isHydrated      = useIsHydrated();
  const isAuthenticated = useIsAuthenticated();
  const userRole        = useUserRole();

  // ── Derive access state ─────────────────────────────────────────────────
  const isRoleAllowed =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    (!!userRole && allowedRoles.includes(userRole));

  // ── Side effects: redirect when needed ─────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return; // Wait for localStorage to be read

    if (!isAuthenticated) {
      const target = new URL(redirectTo, window.location.origin);
      target.searchParams.set("reason",   "unauthenticated");
      target.searchParams.set("redirect", pathname);
      router.replace(target.pathname + target.search);
      return;
    }

    if (!isRoleAllowed && !silent) {
      router.replace(`${deniedRedirectTo}?from=${encodeURIComponent(pathname)}`);
    }
  }, [
    isHydrated,
    isAuthenticated,
    isRoleAllowed,
    silent,
    pathname,
    redirectTo,
    deniedRedirectTo,
    router,
  ]);

  // ── Render logic ────────────────────────────────────────────────────────

  // 1. While Zustand reads localStorage — show skeleton (non-silent) or null
  if (!isHydrated) {
    return silent ? null : <HydrationSkeleton />;
  }

  // 2. Not logged in — redirect is already in-flight; render nothing
  if (!isAuthenticated) {
    return null;
  }

  // 3. Logged in but wrong role
  if (!isRoleAllowed) {
    if (silent) return null;
    return fallback !== undefined ? <>{fallback}</> : <DefaultAccessDenied />;
  }

  // 4. All checks passed — render protected content
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// 5. withRoleGuard HOC
//    Higher-order component variant for wrapping page-level components.
//
//    Usage:
//      const AdminPage = withRoleGuard(AdminPageContent, ["SUPER_ADMIN"]);
//      export default AdminPage;
// ---------------------------------------------------------------------------

export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[],
  options?: Pick<ProtectedRouteProps, "redirectTo" | "deniedRedirectTo" | "fallback">
): React.FC<P> {
  const GuardedComponent: React.FC<P> = (props) => (
    <ProtectedRoute allowedRoles={allowedRoles} {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  GuardedComponent.displayName = `withRoleGuard(${
    Component.displayName ?? Component.name ?? "Component"
  })`;

  return GuardedComponent;
}

// ---------------------------------------------------------------------------
// 6. RoleGate — declarative inline gate (no redirect, just hides/shows)
//
//    Usage:
//      <RoleGate allowedRoles={["SUPER_ADMIN"]}>
//        <DeleteButton />
//      </RoleGate>
// ---------------------------------------------------------------------------

export interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  /** What to render when the user lacks the role.  Default: nothing. */
  fallback?: ReactNode;
}

export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps): ReactNode {
  const isAuthenticated = useIsAuthenticated();
  const userRole        = useUserRole();
  const isHydrated      = useIsHydrated();

  if (!isHydrated || !isAuthenticated) return fallback;

  const allowed = !!userRole && allowedRoles.includes(userRole);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
