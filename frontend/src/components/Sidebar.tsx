"use client";

import React, { useState } from "react";
import { Sidebar as AceternitySidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  CheckSquare,
  FileText, 
  BarChart,
  Settings,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AppLogoIcon } from "./AppLogo";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Leads", href: "/dashboard/leads", icon: Users, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Customers", href: "/dashboard/customers", icon: Briefcase, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Quotations", href: "/dashboard/quotations", icon: FileText, roles: ["SUPER_ADMIN", "MANAGER", "AGENT"] },
    { name: "Offices", href: "/dashboard/offices", icon: Building2, roles: ["SUPER_ADMIN"] },
    { name: "Team", href: "/dashboard/users", icon: Users, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart, roles: ["SUPER_ADMIN", "MANAGER"] },
  ];

  const canViewAdminModules = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  // Filter links based on user role
  const filteredNav = navigation.filter(item => 
    !user || item.roles.includes(user.role)
  );

  const links = filteredNav.map(item => ({
    label: item.name,
    href: item.href,
    icon: <item.icon className="h-[19px] w-[19px] shrink-0 text-neutral-500 dark:text-neutral-400 group-hover/sidebar:text-neutral-800 dark:group-hover/sidebar:text-neutral-200 transition-colors duration-150" />
  }));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "SP";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <AceternitySidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className="justify-between gap-10 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] transition-colors duration-300">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
            
            {canViewAdminModules && (
              <SidebarLink 
                link={{
                  label: "Settings",
                  href: "/dashboard/settings",
                  icon: <Settings className="h-[19px] w-[19px] shrink-0 text-neutral-500 dark:text-neutral-400 group-hover/sidebar:text-neutral-800 dark:group-hover/sidebar:text-neutral-200 transition-colors duration-150" />
                }}
              />
            )}
          </div>
        </div>
        
        {/* Footer Area with user profile details */}
        <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className={cn("flex items-center gap-2 overflow-hidden", open ? "px-1 justify-start" : "justify-center w-full")}>
            <div className="h-[30.4px] w-[30.4px] shrink-0 flex items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] text-[11.4px] font-semibold select-none">
              {getInitials(user?.name)}
            </div>
            
            {open && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col overflow-hidden text-left"
              >
                <span className="text-[11.4px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">
                  {user?.name || "CRM User"}
                </span>
                <span className="text-[9.5px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {user?.role === "SUPER_ADMIN" ? "Admin" : user?.role === "MANAGER" ? "Manager" : "Agent"}
                </span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2.5 py-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all duration-200 w-full text-left",
              open ? "px-3 justify-start" : "px-0 justify-center"
            )}
          >
            <LogOut className="h-[19px] w-[19px] shrink-0 text-red-500 dark:text-red-400" />
            {open && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13.3px] font-medium"
              >
                Logout
              </motion.span>
            )}
          </button>
        </div>
      </SidebarBody>
    </AceternitySidebar>
  );
}

const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-3 py-1 text-sm font-normal"
    >
      <AppLogoIcon className="h-[34.2px] w-[34.2px]" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col text-left"
      >
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">SalesPro</span>
        <span className="text-[15.2px] font-semibold leading-tight text-[var(--color-text-primary)]">CRM</span>
      </motion.div>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center justify-center py-1 w-full"
    >
      <AppLogoIcon className="h-[34.2px] w-[34.2px]" />
    </a>
  );
};
