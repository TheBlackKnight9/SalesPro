"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, useIsAuthenticated, useIsHydrated } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useIsAuthenticated();
  const isHydrated = useIsHydrated();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, router]);

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

      const { user, token } = response.data.data;
      login(user, token, rememberMe);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid email/mobile and password combination.");
    } finally {
      setIsLoading(false);
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(38,99,235,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_28%),linear-gradient(135deg,#07111f_0%,#0b1630_48%,#08101b_100%)]" />
      <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl lg:flex"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">SalesPro CRM</p>
                <h1 className="text-2xl font-semibold text-white">Secure access for your sales team</h1>
              </div>
            </div>

            <div className="max-w-lg space-y-6">
              <h2 className="text-5xl font-semibold leading-tight tracking-tight text-white">
                Ultra-modern login for a faster CRM workflow.
              </h2>
              <p className="text-base leading-7 text-slate-300">
                Sign in with your email or mobile number, keep the session remembered when you need it,
                and jump straight into the dashboard with role-based access.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["JWT sessions", "Token-based auth with auto-login"],
                ["Role aware", "Super Admin, Manager, Agent"],
                ["Secure UI", "Glassmorphism with validation"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-lg rounded-[2rem] border border-white/12 bg-white/8 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Welcome back</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Sign in to SalesPro</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.05 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-200">Email or Mobile number</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@company.com or +91 98765 43210"
                    className="w-full rounded-2xl border border-white/10 bg-white/90 px-12 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                    style={{ WebkitTextFillColor: "#0f172a" }}
                    autoComplete="username"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.12 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-200">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-white/10 bg-white/90 px-12 py-3.5 pr-12 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                    style={{ WebkitTextFillColor: "#0f172a" }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((state) => !state)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.18 }}
                className="flex items-center justify-between gap-4"
              >
                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-400/40"
                  />
                  Remember Me
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot Password?
                </a>
              </motion.div>

              <motion.button
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.24 }}
                type="submit"
                disabled={isLoading}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>

              <motion.p
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="text-center text-sm text-slate-400"
              >
                New here?{' '}
                <a href="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
                  Create an account
                </a>
              </motion.p>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
