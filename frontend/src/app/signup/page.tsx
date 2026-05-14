"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2, ChevronRight, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Office {
  id: string;
  name: string;
}

type SignupRole = "SUPER_ADMIN" | "MANAGER" | "AGENT";
const signupRoles: SignupRole[] = ["AGENT", "MANAGER", "SUPER_ADMIN"];

interface SignupResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: SignupRole;
    officeId: string;
    avatarUrl: string | null;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "AGENT" as SignupRole,
    officeId: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [isFetchingOffices, setIsFetchingOffices] = useState(false);

  // Fetch offices when role is MANAGER or AGENT
  useEffect(() => {
    if (formData.role === "MANAGER" || formData.role === "AGENT") {
      const fetchOffices = async () => {
        try {
          setIsFetchingOffices(true);
          const data = await apiClient.get<Office[]>("/offices", { page: 1, limit: 100 });
          setOffices(data || []);
        } catch (err) {
          console.error("Failed to fetch offices:", err);
        } finally {
          setIsFetchingOffices(false);
        }
      };
      fetchOffices();
    } else {
      setFormData((prev) => ({ ...prev, officeId: "" }));
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const requiresOffice = formData.role === "MANAGER" || formData.role === "AGENT";
    if (requiresOffice && !formData.officeId) {
      setError("Please select an office for this role.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        ...(requiresOffice ? { officeId: formData.officeId } : {}),
      };

      const res = await apiClient.post<SignupResponse>("/auth/signup", payload);
      // login helper in useAuthStore handles tokenStorage.set and updating state
      login(res.user, res.token);
      router.push("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-brand-blue p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/15 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-300/20 blur-[120px] rounded-full" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/15 rounded-base p-8 shadow-2xl z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Join <span className="text-blue-500">SalesPro</span>
          </h2>
          <p className="text-gray-400">Create your account to start managing your pipeline</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  placeholder="john@example.com"
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
                  required
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Role Selection */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300 ml-1">Your Role</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              {signupRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.role === role
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {role.replace("_", " ")}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Dynamic Office Selection */}
          <AnimatePresence mode="wait">
            {(formData.role === "MANAGER" || formData.role === "AGENT") && (
              <motion.div
                key="office-select"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-sm font-medium text-gray-300 ml-1">Assigned Office</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    value={formData.officeId}
                    onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                  >
                    <option value="" className="bg-[#1a1f2e]">Select an office...</option>
                    {offices.map((off) => (
                      <option key={off.id} value={off.id} className="bg-[#1a1f2e]">
                        {off.name}
                      </option>
                    ))}
                  </select>
                  {isFetchingOffices && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  Create Account
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
