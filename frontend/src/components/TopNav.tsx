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
      <div className="flex items-center gap-2.5">
        <div className={`relative flex h-[34.2px] w-[34.2px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 shadow-sm ${user?.organizationLogo ? "bg-white" : "bg-white/10"}`}>
          {user?.organizationLogo ? (
            <img src={user.organizationLogo} alt="Organization Logo" className="h-full w-full object-contain p-0.5" />
          ) : (
            <span className="text-sm font-extrabold tracking-wide text-white">
              {(user?.organizationName || "SalesPro").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden sm:block">
          <p className="text-[12px] font-extrabold leading-tight text-white uppercase tracking-wider">
            {user?.organizationName || "SalesPro CRM"}
          </p>
          <p className="text-[9px] text-white/70 tracking-widest uppercase mt-0.5">
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
