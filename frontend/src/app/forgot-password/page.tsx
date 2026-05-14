"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("OTP reset flow is ready for backend wiring.");

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStep("verify");
      setMessage("OTP request step prepared. Connect this to the backend reset endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMessage("OTP verification UI is ready. Backend reset endpoint is not present yet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Password Recovery</p>
              <h1 className="text-3xl font-semibold">OTP Reset</h1>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Email or Mobile number</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-12 py-3.5 text-white placeholder:text-slate-500"
                    placeholder="Enter email or phone"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 font-semibold text-white disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3.5 text-white placeholder:text-slate-500"
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 font-semibold text-white disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                Verify OTP
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-slate-400">
            <a href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Back to sign in
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
