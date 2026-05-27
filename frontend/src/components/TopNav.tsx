"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, User, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TopNav() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isSettings = pathname === "/dashboard/settings";

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
          <p className="text-xs font-bold leading-tight text-white uppercase tracking-wider">
            {user?.organizationName || "SalesPro CRM"}
          </p>
          <p className="text-[10px] text-white/70 tracking-widest uppercase">
            Unified Workspace
          </p>
        </div>
      </div>

      <div className="flex-grow" />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 border border-white/15 bg-white/10 px-2.5 text-sm text-white hover:bg-white/15 hover:text-white"
          onClick={() => router.push(isSettings ? "/dashboard" : "/dashboard/settings")}
          leftIcon={<User className="h-4 w-4" />}
          rightIcon={isSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
