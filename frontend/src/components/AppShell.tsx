"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const authRoutes = ["/login", "/signup", "/forgot-password"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={[
      "SUPER_ADMIN",
      "MANAGER",
      "AGENT",
    ]}>
      <div className="flex min-h-screen w-full bg-app-bg text-gray-900">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto bg-app-bg p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
