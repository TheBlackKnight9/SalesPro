/**
 * src/lib/api.ts
 * =============================================================================
 * SalesPro CRM — Type-Safe Axios API Client
 * =============================================================================
 *
 * Architecture:
 *  • One shared Axios instance pre-configured for our Express backend.
 *  • Request interceptor  → injects JWT as "Authorization: Bearer <token>".
 *  • Response interceptor → normalises errors; evicts session on 401.
 *
 * Why this pattern?
 *  • Centralised base URL — change NEXT_PUBLIC_API_URL once, everywhere updates.
 *  • No need to import `localStorage` or the Zustand store in every component.
 *  • Token refresh, retry logic, or header changes live in ONE place.
 * =============================================================================
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ---------------------------------------------------------------------------
// 1. Typed API response envelope
//    Our Express backend wraps every response in:
//      { success: boolean; data?: T; message?: string; errors?: unknown }
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

// ---------------------------------------------------------------------------
// 2. Typed API error shape (what we re-throw after normalising)
// ---------------------------------------------------------------------------
export interface ApiError {
  /** HTTP status code (0 = network/timeout) */
  status: number;
  /** Human-readable message from the server, or a fallback */
  message: string;
  /** Raw validation errors or extra details from the server */
  errors?: unknown;
}

// ---------------------------------------------------------------------------
// 3. Token helpers
//    Read/write in localStorage so the token survives a hard refresh.
//    Both functions are safe to call server-side (SSR) — they check for
//    `typeof window` before touching browser APIs.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "salespro_token" as const;
const SESSION_TOKEN_KEY = "salespro_session_token" as const;

export const tokenStorage = {
  /** Retrieve the JWT (null when unauthenticated or on the server). */
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(SESSION_TOKEN_KEY);
  },

  /** Persist the JWT (no-op on the server). */
  set(token: string, rememberMe = true): void {
    if (typeof window === "undefined") return;
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
      return;
    }

    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },

  /** Remove the JWT (no-op on the server). */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

// ---------------------------------------------------------------------------
// 4. Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  /**
   * Base URL: read from the env var injected at build time by Next.js.
   * Must be prefixed with NEXT_PUBLIC_ to be available in the browser.
   * Fallback: the Express dev server.
   */
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",

  /** 15-second hard timeout — avoids silent hangs in slow networks. */
  timeout: 15_000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// 5. Request Interceptor — attach JWT
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    /**
     * Token priority order:
     *  1. Zustand store (in-memory, fastest, already validated)
     *  2. localStorage   (survives hard refresh / new tab)
     *
     * We import the store lazily (inside the function) to break the circular
     * dependency: api.ts → useAuthStore.ts → api.ts.
     * Dynamic `require()` is fine inside an interceptor — it runs at
     * call-time, not at module load time.
     */
    let token: string | null = null;

    try {
      // Lazy import to avoid circular dependency at module initialisation
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require("@/store/useAuthStore");
      token = useAuthStore.getState().token;
    } catch {
      // Store not yet initialised (e.g. during SSR) — fall back to storage
    }

    if (!token) {
      token = tokenStorage.get();
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// 6. Response Interceptor — normalise errors & handle 401
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  /**
   * Success path: pass the response straight through unchanged.
   * Callers destructure `response.data` themselves.
   */
  (response: AxiosResponse) => response,

  /**
   * Error path: transform Axios errors into a consistent `ApiError` shape
   * so every caller gets the same error interface regardless of whether
   * the problem was a network issue, a 4xx, or a 5xx.
   */
  async (error: AxiosError<ApiResponse>) => {
    const status  = error.response?.status  ?? 0;
    const payload = error.response?.data;

    // ── 401 Unauthorised ────────────────────────────────────────────────
    // The token is missing, expired, or tampered.
    // Evict the session and hard-navigate to /login so the user is forced
    // to re-authenticate.  We do NOT attempt a silent refresh here because
    // the SRS does not include a refresh-token flow; add it here if needed.
    if (status === 401) {
      // Clear persisted state (Zustand + localStorage)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require("@/store/useAuthStore");
        useAuthStore.getState().logout();
      } catch {
        // Store not available (SSR / unit test context)
        tokenStorage.clear();
      }

      // Only redirect in a browser context
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        // Avoid redirect loop if already on /login
        if (currentPath !== "/login") {
          window.location.href = `/login?reason=session_expired&redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    // ── 403 Forbidden ────────────────────────────────────────────────────
    // The user is authenticated but lacks the required role.
    // We surface the error to the caller; the ProtectedRoute HOC handles UI.

    // ── 5xx Server errors ─────────────────────────────────────────────────
    // Log to the console in development; swap for Sentry/Datadog in prod.
    if (status >= 500) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SalesPro API] Server error:", {
          url:    error.config?.url,
          status,
          data:   payload,
        });
      }
    }

    // ── Normalised error object ────────────────────────────────────────────
    const normalisedError: ApiError = {
      status,
      message:
        payload?.message ??
        error.message ??
        "An unexpected error occurred. Please try again.",
      errors: payload?.errors,
    };

    return Promise.reject(normalisedError);
  }
);

// ---------------------------------------------------------------------------
// 7. Typed convenience wrappers
//    Thin wrappers that return `data` directly (not `response.data`),
//    which cuts boilerplate in every feature module.
// ---------------------------------------------------------------------------

export const apiClient = {
  /** GET /endpoint → T */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await api.get<ApiResponse<T>>(url, { params });
    return response.data.data as T;
  },

  /** POST /endpoint → T */
  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await api.post<ApiResponse<T>>(url, body);
    return response.data.data as T;
  },

  /** PUT /endpoint → T */
  async put<T>(url: string, body?: unknown): Promise<T> {
    const response = await api.put<ApiResponse<T>>(url, body);
    return response.data.data as T;
  },

  /** PATCH /endpoint → T */
  async patch<T>(url: string, body?: unknown): Promise<T> {
    const response = await api.patch<ApiResponse<T>>(url, body);
    return response.data.data as T;
  },

  /** DELETE /endpoint → T */
  async delete<T>(url: string): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data.data as T;
  },
};

// Export the raw instance for edge cases that need full AxiosResponse access
export default api;
