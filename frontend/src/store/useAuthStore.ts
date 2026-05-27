/**
 * src/store/useAuthStore.ts
 * =============================================================================
 * SalesPro CRM — Global Authentication State (Zustand)
 * =============================================================================
 *
 * Design decisions:
 *  • `persist` middleware serialises state to localStorage under a versioned
 *    key, so users remain logged in after a hard refresh or new tab.
 *  • Sensitive data (token) is stored ONLY in the persisted store; we do NOT
 *    duplicate it in a cookie unless you later need SSR-aware auth.
 *  • The store is a singleton accessible anywhere — including inside Axios
 *    interceptors — via `useAuthStore.getState()` (no React hook required).
 *  • We intentionally keep business logic out of the store; login/logout
 *    actions are thin so they compose well with API calls in feature modules.
 * =============================================================================
 */

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { tokenStorage } from "@/lib/api";

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------

/** Role enum — mirrors Prisma schema values exactly */
export type UserRole = "SUPER_ADMIN" | "MANAGER" | "AGENT";

/**
 * The subset of the User model stored client-side.
 * Avoid persisting fields that change frequently or are security-sensitive
 * (e.g. hashedPassword, passwordResetToken).
 */
export interface User {
  id:       string;
  name:     string;
  email:    string;
  phone?:   string | null;
  role:     UserRole;
  /** The office this user belongs to (null for SUPER_ADMIN without a fixed office) */
  officeId: string | null;
  organizationName?: string | null;
  organizationLogo?: string | null;
  /** Optional avatar URL returned by the API */
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// 2. Store shape
// ---------------------------------------------------------------------------

interface AuthState {
  // ── State ────────────────────────────────────────────────────────────────
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  rememberMe:      boolean;

  /**
   * Tracks whether the persisted state has been rehydrated.
   * Useful for preventing a flash of "unauthenticated" UI on first render
   * while Zustand reads from localStorage.
   * Usage: don't render protected content until `isHydrated` is true.
   */
  isHydrated: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Called after a successful POST /auth/login or POST /auth/register.
   * Stores user + token in both Zustand state and localStorage.
   *
   * @param user  The user object returned by the API
   * @param token The JWT access token returned by the API
   */
  login(user: User, token: string, rememberMe?: boolean): void;

  /**
   * Clears all authentication state (Zustand + localStorage).
   * Safe to call even when already logged out.
   */
  logout(): void;

  /**
   * Partially update the cached user object.
   * Useful after a profile-update API call — avoids a full re-login.
   *
   * @param updates Partial<User> to merge into current user
   */
  updateUser(updates: Partial<User>): void;

  /**
   * Internal: called by the persist middleware once rehydration is complete.
   * Not intended for direct use in components.
   */
  _setHydrated(): void;
}

// ---------------------------------------------------------------------------
// 3. Store implementation
// ---------------------------------------------------------------------------

const STORE_KEY     = "salespro_auth" as const;
const STORE_VERSION = 1; // Bump when the persisted shape changes to avoid stale reads

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial state ────────────────────────────────────────────────
        user:            null,
        token:           null,
        isAuthenticated: false,
        rememberMe:      true,
        isHydrated:      false,

        // ── Actions ──────────────────────────────────────────────────────

        login(user, token, rememberMe = true) {
          // 1. Persist token to localStorage so the Axios interceptor can
          //    read it even before the Zustand store is available (e.g. in
          //    a freshly-opened tab before the first render).
          tokenStorage.set(token, rememberMe);

          // 2. Update Zustand state (triggers re-render in all subscribers).
          set(
            {
              user,
              token,
              isAuthenticated: true,
              rememberMe,
            },
            false,             // replace=false → merge with existing state
            "auth/login"       // Redux DevTools action label
          );
        },

        logout() {
          // 1. Wipe localStorage
          tokenStorage.clear();

          // 2. Reset Zustand state to unauthenticated baseline.
          //    We do NOT reset `isHydrated` — it stays true after first load.
          set(
            {
              user:            null,
              token:           null,
              isAuthenticated: false,
              rememberMe:      true,
            },
            false,
            "auth/logout"
          );
        },

        updateUser(updates) {
          const current = get().user;
          if (!current) return; // Nothing to update — not logged in

          set(
            { user: { ...current, ...updates } },
            false,
            "auth/updateUser"
          );
        },

        _setHydrated() {
          set({ isHydrated: true }, false, "auth/hydrated");
        },
      }),

      // ── Persist configuration ──────────────────────────────────────────
      {
        name:    STORE_KEY,
        version: STORE_VERSION,

        /**
         * Use localStorage (default).
         * Swap to `createJSONStorage(() => sessionStorage)` if you want
         * auth to expire when the browser tab closes.
         */
        storage: createJSONStorage(() => localStorage),

        /**
         * Whitelist — only these keys are written to localStorage.
         * `isHydrated` is runtime-only; there's no point persisting it.
         */
        partialize: (state) => ({
          user:            state.user,
          token:           state.rememberMe ? state.token : null,
          isAuthenticated: state.isAuthenticated,
          rememberMe:      state.rememberMe,
        }),

        /**
         * Called once after the stored value is loaded and merged.
         * We use it to:
         *  a) Mark hydration complete (prevents auth flicker)
         *  b) Sync the tokenStorage helper so the Axios interceptor
         *     immediately has the token without a separate localStorage call.
         */
        onRehydrateStorage: () => (rehydratedState) => {
          if (rehydratedState) {
            // Sync token helper
            if (rehydratedState.token) {
              tokenStorage.set(rehydratedState.token, rehydratedState.rememberMe);
            }
            // Mark hydration complete
            rehydratedState._setHydrated();
          }
        },

        /**
         * Migration function — called when `version` increments.
         * Return the migrated state so users aren't logged out on upgrades.
         */
        migrate: (persistedState, fromVersion) => {
          // v0 → v1: no structural changes yet; pass through as-is
          if (fromVersion === 0) {
            return persistedState as AuthState;
          }
          return persistedState as AuthState;
        },
      }
    ),

    // ── Devtools options ───────────────────────────────────────────────────
    {
      name:    "SalesPro / Auth",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
);

// ---------------------------------------------------------------------------
// 4. Selector hooks
//    Pre-built selectors prevent unnecessary re-renders by returning
//    primitives / stable references instead of the whole store object.
// ---------------------------------------------------------------------------

/** The authenticated user, or null */
export const useUser            = () => useAuthStore((s) => s.user);

/** Whether the user is logged in */
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);

/** The user's role, or null if not authenticated */
export const useUserRole        = () => useAuthStore((s) => s.user?.role ?? null);

/** The raw JWT token (use sparingly — prefer the Axios client) */
export const useToken           = () => useAuthStore((s) => s.token);

/** True once localStorage has been read on first render */
export const useIsHydrated      = () => useAuthStore((s) => s.isHydrated);

/** login / logout / updateUser bound actions */
export const useAuthActions     = () =>
  useAuthStore((s) => ({
    login:       s.login,
    logout:      s.logout,
    updateUser:  s.updateUser,
  }));
