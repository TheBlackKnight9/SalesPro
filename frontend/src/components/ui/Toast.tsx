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
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border min-w-[300px] max-w-md ${
                toast.type === "success" 
                  ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-400" 
                  : toast.type === "error"
                  ? "bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-400"
                  : "bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-400"
              }`}
            >
              <div className={`p-1.5 rounded-lg ${
                toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20" : 
                toast.type === "error" ? "bg-rose-50 dark:bg-rose-900/20" : 
                "bg-blue-50 dark:bg-blue-900/20"
              }`}>
                {toast.type === "success" && <CheckCircle className="h-4 w-4" />}
                {toast.type === "error" && <AlertCircle className="h-4 w-4" />}
                {toast.type === "info" && <Info className="h-4 w-4" />}
              </div>
              <p className="flex-1 text-sm font-bold tracking-tight">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 opacity-40" />
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
