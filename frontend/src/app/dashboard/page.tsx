"use client";

import { useEffect, useState } from "react";
import { Plus, CheckSquare } from "lucide-react";
import AddCustomerSlideOver from "@/components/customers/AddCustomerSlideOver";
import AddLeadModal from "@/components/leads/AddLeadModal";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/Button";
import { useUser, useIsHydrated } from "@/store/useAuthStore";
import { tokenStorage } from "@/lib/api";
import IntegratedMetricsDashboard from "@/components/dashboard/IntegratedMetricsDashboard";

export default function DashboardPage() {
  const user = useUser();
  const isHydrated = useIsHydrated();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    let mounted = true;
    
    const fetchFreshMetrics = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const token = tokenStorage.get();
        
        if (!token) {
          console.warn("Dashboard: No auth token available after hydration");
          if (mounted) {
            setIsLoading(false);
            setFetchError("No authentication token");
          }
          return;
        }

        const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
        const timestamp = new Date().getTime();

        const res = await fetch(`${baseURL}/dashboard/metrics?cb=${timestamp}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${errBody || res.statusText}`);
        }
        
        const responseJson = await res.json();
        const cleanData = responseJson?.data || responseJson || {};
        console.log("Dashboard Raw API Response:", cleanData);

        if (mounted) {
          setDashboardData(cleanData);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        if (mounted) {
          setFetchError(err?.message || "Failed to load dashboard");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchFreshMetrics();
    return () => { mounted = false; };
  }, [isHydrated]);

  const isManager = user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6 pb-8 bg-[#f8f9fa] dark:bg-slate-950 -m-6 p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="mt-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
            {isManager 
              ? "Team performance analytics and management overview." 
              : "Here's your personal lead & activity performance tracker."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsAddLeadOpen(true)}>
            Add Lead
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<CheckSquare className="h-4 w-4" />} onClick={() => setIsTaskModalOpen(true)}>
            New Task
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm h-56" />
            ))}
          </div>
        </div>
      ) : fetchError ? (
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Failed to load dashboard data</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <IntegratedMetricsDashboard apiData={dashboardData} />
      )}

      <AddCustomerSlideOver 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        onSuccess={() => window.location.reload()}
      />
      
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <CreateTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSuccess={() => {
          setIsTaskModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
