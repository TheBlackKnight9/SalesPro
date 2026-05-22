"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, Bell, Search, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TopNav() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-brand-blue/20 bg-brand-blue dark:bg-slate-900 dark:border-slate-800 px-5 text-white transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold text-white">
          SP
        </div>
        <div className="hidden sm:block">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">SalesPro CRM</p>
          <p className="text-xs font-semibold leading-tight text-white">Unified workspace</p>
        </div>
      </div>

      <div className="flex flex-1 justify-center px-3">
        <div className="flex w-full max-w-2xl items-center rounded-full border border-white/15 bg-white/12 px-3 py-1.5 backdrop-blur-md focus-within:border-white/30">
          <Search className="mr-2 h-4 w-4 text-white/70" />
          <input
            type="text"
            placeholder="Search leads, customers, tasks, and conversations"
            className="w-full bg-transparent text-sm leading-tight text-white placeholder:text-white/60 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="rounded-full border border-white/15 bg-white/10 p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white" title="Notifications">
          <Bell className="h-4 w-4" />
        </button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 border border-white/15 bg-white/10 px-2.5 text-sm text-white hover:bg-white/15 hover:text-white"
          onClick={() => router.push("/dashboard/settings")}
          leftIcon={<User className="h-4 w-4" />}
          rightIcon={<ChevronDown className="h-4 w-4" />}
        >
          <span className="hidden sm:inline">{user?.name || "Profile"}</span>
        </Button>

        <button
          onClick={handleLogout}
          className="rounded-full border border-white/15 bg-white/10 p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
