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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-raised)] px-5 text-[var(--color-text-primary)] transition-colors duration-300">
      <div className="flex items-center gap-2.5">
        <div className={`relative flex h-[34.2px] w-[34.2px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border-strong)] shadow-sm ${user?.organizationLogo ? "bg-[var(--color-bg-raised)]" : "bg-[var(--color-bg-subtle)]"}`}>
          {user?.organizationLogo ? (
            <img src={user.organizationLogo} alt="Organization Logo" className="h-full w-full object-contain p-0.5" />
          ) : (
            <span className="text-sm font-extrabold tracking-wide text-[var(--color-text-primary)]">
              {(user?.organizationName || "SalesPro").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden sm:block">
          <p className="text-[12px] font-extrabold leading-tight text-[var(--color-text-primary)] uppercase tracking-wider">
            {user?.organizationName || "SalesPro CRM"}
          </p>
          <p className="text-[9px] text-[var(--color-text-secondary)] tracking-widest uppercase mt-0.5">
            Unified Workspace
          </p>
        </div>
      </div>

      <div className="flex-grow" />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          variant="secondary"
          size="sm"
          className="h-8 border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--color-border)]"
          onClick={() => router.push(isSettings ? "/dashboard" : "/dashboard/settings")}
          leftIcon={<User className="h-4 w-4 text-[var(--color-text-secondary)]" />}
          rightIcon={isSettings ? <ChevronUp className="h-4 w-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />}
        >
          <span className="hidden sm:inline text-[var(--color-text-primary)]">{user?.name || "Profile"}</span>
        </Button>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
