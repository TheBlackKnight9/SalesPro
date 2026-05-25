"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2, ChevronRight, Loader2 } from "lucide-react";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111f] p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/15 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-300/20 blur-[120px] rounded-full" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-base p-8 shadow-2xl z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Create <span className="text-blue-500">SalesPro</span> Organization
          </h2>
          <p className="text-gray-400">Register your company to launch your isolated team panel</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Company Name */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300 ml-1">Company / Organization Name</label>
            <div className="relative group">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Owner Name */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Owner Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="owner@acme.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-11 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="no-hover absolute right-3 top-0 bottom-0 my-auto h-fit text-gray-500 hover:text-white transition-colors flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Register Organization
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="text-center mt-8 text-gray-500 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 hover:text-blue-400 font-semibold"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
