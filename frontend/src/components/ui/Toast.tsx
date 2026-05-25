"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-xl shadow-2xl border min-w-[200px] max-w-[280px] bg-slate-900/95 backdrop-blur border-white/10 text-white`}
            >
              <div className={`p-1 rounded-lg ${
                toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" : 
                toast.type === "error" ? "bg-rose-500/10 text-rose-400" : 
                "bg-blue-500/10 text-blue-400"
              }`}>
                {toast.type === "success" && <CheckCircle className="h-3.5 w-3.5" />}
                {toast.type === "error" && <AlertCircle className="h-3.5 w-3.5" />}
                {toast.type === "info" && <Info className="h-3.5 w-3.5" />}
              </div>
              <p className={`flex-1 text-[12.5px] font-bold tracking-tight ${
                toast.type === "success" ? "text-emerald-100" :
                toast.type === "error" ? "text-rose-100" :
                "text-blue-100"
              }`}>{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="h-3.5 w-3.5 text-white/40 hover:text-white transition-colors" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
