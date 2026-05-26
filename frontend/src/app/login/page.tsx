"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Bell, FileText, Activity } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, useIsAuthenticated, useIsHydrated } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useIsAuthenticated();
  const isHydrated = useIsHydrated();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectTarget = (role?: string) => {
    if (role === "SUPER_ADMIN") return "/dashboard/offices";
    if (role === "MANAGER") return "/dashboard/reports";
    if (role === "AGENT") return "/dashboard/tasks";
    return "/dashboard";
  };

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      router.replace(getRedirectTarget(user.role));
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const validate = () => {
    if (!identifier.trim()) return "Email or mobile number is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      const { user: loggedInUser, token } = response.data.data;
      login(loggedInUser, token, rememberMe);
      router.replace(getRedirectTarget(loggedInUser.role));
    } catch (err: any) {
      setError(err?.message || "Invalid email/mobile and password combination.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      
      {/* ── LEFT SIDE: Brand Showcase & Feature Grids ── */}
      <div className="relative z-10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 h-full min-h-screen">
        
        {/* Top Header */}
        <div>
          <h1 className="text-xl font-extrabold text-[#4f46e5] dark:text-[#6366f1] leading-none tracking-tight">
            SalesPro CRM
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Global Workspace
          </p>
        </div>

        {/* Core Value Proposition */}
        <div className="max-w-xl space-y-8 my-auto pt-12 pb-12">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              Secure access for your sales team.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Manage complex workflows with high-density data visualization and enterprise-grade security protocols.
            </p>
          </div>

          {/* 2x2 Feature Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-start">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 mb-3 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Role Aware</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-450 dark:text-slate-500 font-medium">
                Hierarchical access for admins and agents.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-start">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 mb-3 shrink-0">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Live Metrics</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-450 dark:text-slate-500 font-medium">
                Real-time pipeline synchronization.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-start">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 mb-3 shrink-0">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Tasks & Follow-up</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-450 dark:text-slate-500 font-medium">
                Never miss a lead with automated reminders.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-start">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 mb-3 shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Quotations</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-450 dark:text-slate-500 font-medium">
                Generate and track professional sales proposals.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 dark:text-slate-600 font-semibold tracking-wide uppercase">
          SalesPro CRM • Isolated Multi-Tenant Workspace
        </p>
      </div>

      {/* ── RIGHT SIDE: Form Canvas with Tilted Padlock Card ── */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50 dark:bg-slate-900/30 border-l border-slate-200/50 dark:border-slate-800/80 min-h-screen">
        
        {/* main Form Card */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          


          {/* Form Header */}
          <div className="mb-6">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
              Global Workspace
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to SalesPro CRM
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email or Mobile number
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 pr-11 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((state) => !state)}
                  className="no-hover absolute right-2 top-0 bottom-0 my-auto h-fit rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[#4f46e5] focus:ring-[#4f46e5]/30 cursor-pointer"
                />
                Remember Me
              </label>
              <a
                href="/forgot-password"
                className="text-xs font-bold text-[#4f46e5] dark:text-[#6366f1] hover:underline transition"
              >
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-75 disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* New to Kinetic / SalesPro redirect */}
          <p className="text-center mt-8 text-xs font-medium text-slate-500 dark:text-slate-400">
            New to SalesPro?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="font-bold text-[#4f46e5] dark:text-[#6366f1] hover:underline"
            >
              Create an account
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}
