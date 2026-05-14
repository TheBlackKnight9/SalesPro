"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  CheckSquare,
  FileText, 
  MessageCircle, 
  BarChart,
  Settings
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Leads", href: "/dashboard/leads", icon: Users, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Customers", href: "/dashboard/customers", icon: Briefcase, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Quotations", href: "/dashboard/quotations", icon: FileText, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Messages", href: "/dashboard/whatsapp", icon: MessageCircle, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Offices", href: "/dashboard/offices", icon: Building2, roles: ["SUPER_ADMIN"] },
    { name: "Team", href: "/dashboard/users", icon: Users, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart, roles: ["SUPER_ADMIN", "MANAGER"] },
  ];

  const canViewAdminModules = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  // Filter links based on user role
  const filteredNav = navigation.filter(item => 
    !user || item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-screen w-[156px] flex-col border-r border-sidebar-border bg-white text-sm text-gray-600">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">SalesPro</p>
          <p className="text-base font-semibold leading-tight text-gray-900">CRM</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-base px-3 py-2 text-sm font-medium leading-tight transition-colors ${
                  isActive
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-2.5 h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-brand-blue" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {canViewAdminModules && (
        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/dashboard/settings"
            className={`group flex w-full items-center rounded-base px-3 py-2 text-sm font-medium leading-tight transition-colors ${
              pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")
                ? "bg-brand-blue/10 text-brand-blue"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Settings className={`mr-2.5 h-4 w-4 ${
              pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")
                ? "text-brand-blue"
                : "text-gray-400 group-hover:text-gray-600"
            }`} />
            Settings
          </Link>
        </div>
      )}
    </aside>
  );
}
