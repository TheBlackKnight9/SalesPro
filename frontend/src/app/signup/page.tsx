"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2, ChevronRight, Loader2, Sparkles, ShieldCheck, Bell, FileText, Activity } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface SignupResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "MANAGER" | "AGENT";
    officeId: string | null;
    organizationId: string | null;
    avatarUrl: string | null;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.companyName.trim() || !formData.ownerName.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      const res = await apiClient.post<SignupResponse>("/auth/register", payload);
      
      // Save session inside Zustand store
      login(res.user, res.token);
      
      // Dynamic Universal Redirection Pipeline
      let redirectTarget = "/dashboard";
      if (res.user.role === "SUPER_ADMIN") {
        redirectTarget = "/dashboard/offices";
      } else if (res.user.role === "MANAGER") {
        redirectTarget = "/dashboard/reports";
      } else if (res.user.role === "AGENT") {
        redirectTarget = "/dashboard/tasks";
      }
      
      router.push(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Something went wrong during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
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
              Launch your secure corporate workspace.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Spin up regional branch offices, onboard team members with strict multitenant boundary separation, and run real-time pipeline management.
            </p>
          </div>

          {/* 2x2 Feature Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-start">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 mb-3 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Multi-Tenancy</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-450 dark:text-slate-500 font-medium">
                100% data boundaries and scoping separation.
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
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          


          {/* Form Header */}
          <div className="mb-6">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
              Global Workspace
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create your CRM Account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
            </div>

            {/* Owner Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Owner Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="owner@acme.com"
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Phone & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-2.5 pr-11 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 transition-all font-semibold"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="no-hover absolute right-2 top-0 bottom-0 my-auto h-fit text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-75 disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register Organization
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Redirection link */}
          <p className="text-center mt-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-bold text-[#4f46e5] dark:text-[#6366f1] hover:underline"
            >
              Sign In
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}
