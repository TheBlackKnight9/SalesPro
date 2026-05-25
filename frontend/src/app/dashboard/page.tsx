"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckSquare, BarChart3, AlertTriangle, Users, Zap } from "lucide-react";
import AddCustomerSlideOver from "@/components/customers/AddCustomerSlideOver";
import AddLeadModal from "@/components/leads/AddLeadModal";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend
} from "recharts";
import { Button } from "@/components/ui/Button";
import { useUser, useIsHydrated } from "@/store/useAuthStore";
import { tokenStorage } from "@/lib/api";

function formatINR(value: number) {
  if (!value) return "₹0";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatIndianCurrency(value: number, short = false) {
  if (!value) return "₹0";
  if (short) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value}`;
  }
  return `₹${new Intl.NumberFormat('en-IN').format(value)}`;
}

function formatEnum(val?: string) {
  if (!val) return "";
  if (/[a-z]/.test(val) && !val.includes("_")) {
    return val;
  }
  return val
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusBadgeStyles(status?: string) {
  const s = status?.toUpperCase() || "";
  switch (s) {
    case "NEW":
      return "bg-blue-100 text-blue-700";
    case "CONTACTED":
      return "bg-indigo-100 text-indigo-700";
    case "QUALIFIED":
      return "bg-purple-100 text-purple-700";
    case "PROPOSAL_SENT":
      return "bg-amber-100 text-amber-700";
    case "NEGOTIATION":
      return "bg-orange-100 text-orange-700";
    case "WON":
      return "bg-emerald-100 text-emerald-700";
    case "LOST":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStageColor(val?: string) {
  if (!val) return "bg-slate-400";
  const s = val.toLowerCase();
  if (s === "bg-blue-500" || s.includes("new")) return "bg-blue-500";
  if (s === "bg-indigo-500" || s.includes("contact")) return "bg-indigo-500";
  if (s === "bg-purple-500" || s.includes("interest") || s.includes("qualified")) return "bg-purple-500";
  if (s === "bg-amber-500" || s.includes("quote") || s.includes("proposal") || s.includes("sent")) return "bg-amber-500";
  if (s === "bg-orange-500" || s.includes("negotiat")) return "bg-orange-500";
  if (s === "bg-emerald-500" || s.includes("convert") || s.includes("won")) return "bg-emerald-500";
  if (s === "bg-rose-500" || s.includes("lost")) return "bg-rose-500";
  if (s === "bg-slate-500") return "bg-slate-500";
  return "bg-slate-400";
}

const STAGE_BAR_COLORS = ["#3B82F6", "#6366F1", "#8B5CF6", "#F59E0B", "#F97316", "#10B981"];

export default function DashboardPage() {
  const user = useUser();
  const isHydrated = useIsHydrated();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isManager = user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";

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

  const kpis = dashboardData?.kpis || { newLeads: 0, hotLeads: 0, converted: 0, pipelineValue: 0 };
  const stageBreakdown = dashboardData?.stageBreakdown || [];
  const weeklyTrend = dashboardData?.weeklyTrend || [];
  const hotLeadsList = dashboardData?.hotLeadsList || [];
  const leadSources = dashboardData?.leadSources || [];
  const recentActivities = dashboardData?.recentActivities || [];
  const todaysTasks = dashboardData?.todaysTasks || [];

  // Manager-only data
  const managerData = dashboardData?.managerData || null;
  const agentLeaderboard = managerData?.agentLeaderboard || [];
  const managementAlerts = managerData?.managementAlerts || [];
  const pipelineByStage = managerData?.pipelineByStage || [];
  const sourcePipeline = managerData?.sourcePipeline || [];
  const agentTaskMatrix = managerData?.agentTaskMatrix || [];

  // Calculate total pipeline value dynamically using stage results
  const totalPipelineValue = isManager && pipelineByStage.length > 0
    ? pipelineByStage.reduce((sum: number, s: any) => sum + (s.value || 0), 0)
    : (kpis.pipelineValue ?? 0);

  if (user?.role === "SUPER_ADMIN" && dashboardData?.isSuperAdmin) {
    const adminKpis = dashboardData.kpis || { totalRevenue: 0, totalLeadsGlobal: 0, activeOffices: 0, totalAccountsActive: 0 };
    const regionalPerformance = dashboardData.regionalPerformance || [];
    const trendData = dashboardData.trendData || [];
    const topAgents = dashboardData.topAgents || [];
    const leadSources = dashboardData.leadSources || [];
    const companyQuota = dashboardData.companyQuota || 20000000;
    const quotaProgressPercent = dashboardData.quotaProgressPercent || 0;
    const deficitText = dashboardData.deficitText || "";

    return (
      <div className="space-y-6 pb-8 bg-[#f8f9fa] dark:bg-slate-950 -m-6 p-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Enterprise Super Admin Panel
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Multi-office corporate architecture metrics and organizational goals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setIsAddLeadOpen(true)}>
              Add Lead
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
              New Task
            </Button>
          </div>
        </div>

        {/* 1. Global KPI Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
              {formatIndianCurrency(adminKpis.totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Cumulative Accepted volume ({formatIndianCurrency(adminKpis.totalRevenue, true)})
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Leads Global</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
              {adminKpis.totalLeadsGlobal}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Active operational leads globally</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Offices</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
              {adminKpis.activeOffices}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Unique active location segments</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Accounts Active</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
              {adminKpis.totalAccountsActive}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Registered active workspace users</p>
          </div>
        </div>

        {/* 2. Regional Office Performance Row */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Regional Performance Grid</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {regionalPerformance.map((office: any) => (
              <div key={office.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{office.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      office.status === "On Target" 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    }`}>
                      {office.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Revenue</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatIndianCurrency(office.revenue, true)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Leads</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{office.leads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Conv. Rate</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{office.conversionRate}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                    <span>Target: {formatIndianCurrency(office.target, true)}</span>
                    <span>{office.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      office.status === "On Target" ? "bg-emerald-500" : "bg-rose-500"
                    }`} style={{ width: `${office.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Charts Row: Cross-Office Revenue Trend & Conversion Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend LineChart (2/3 width) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm lg:col-span-2">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Cross-Office Revenue Trend</h3>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatIndianCurrency(v, true)} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#ffffff' }} formatter={(v: any) => [formatIndianCurrency(Number(v)), "Revenue"]} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {regionalPerformance.map((office: any, idx: number) => {
                    const key = office.name.replace(" Office", "");
                    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#25D366"];
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Branch Conversion Efficiency BarChart (1/3 width) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Branch Conversion Efficiency</h3>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart layout="vertical" data={regionalPerformance} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.replace(" Office", "")} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#ffffff' }} formatter={(v: any) => [`${v}%`, "Conversion Rate"]} />
                  <Bar dataKey="conversionRate" radius={[0, 4, 4, 0]} barSize={16}>
                    {regionalPerformance.map((entry: any, index: number) => {
                      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#25D366"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. Bottom Grid: Top Agents Leaderboard & Goal Progress Organization Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Agents Cross-Office Leaderboard Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Top Agents Leaderboard</h3>
            {topAgents.length > 0 ? (
              <div className="space-y-3">
                {topAgents.map((agent: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 w-4">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold flex items-center justify-center text-xs text-slate-700 dark:text-slate-300">
                        {agent.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">{agent.name}</span>
                          <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 text-[9px] font-medium px-1.5 py-0.2 rounded">
                            {agent.officeName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {agent.conversionRate}% conv
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatIndianCurrency(agent.revenue, true)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6">No active agents found</div>
            )}
          </div>

          {/* Goal Progress & Organization Totals Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Goal Progress & Global Totals</h3>
              <div className="space-y-3">
                {regionalPerformance.map((office: any) => (
                  <div key={office.id} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      <span>{office.name}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(office.revenue, true)} / {formatIndianCurrency(office.target, true)}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        office.status === "On Target" ? "bg-emerald-500" : "bg-rose-500"
                      }`} style={{ width: `${office.progressPercent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Organization Summary Block */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white mb-1">
                <span>Organisation total</span>
                <span>
                  {formatIndianCurrency(adminKpis.totalRevenue, true)} / {formatIndianCurrency(companyQuota, true)} • {quotaProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${quotaProgressPercent}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic mt-2">
                9 working days left • {deficitText}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Consolidated Global Lead Source Distribution Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Global Lead Source Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[120px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                  >
                    {leadSources.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '10px', padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#ffffff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {leadSources.map((source: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: source.color || '#cbd5e1' }} />
                    <span className="capitalize">{source.name.toLowerCase().replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1 px-4 text-slate-200 dark:text-slate-800">
                    <span className="border-b border-dashed border-slate-200 dark:border-slate-800 flex-1 h-3" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{source.percentage || `${source.value}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
        <>
          {/* KPI Cards — shared by all roles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Link href="/dashboard/leads" className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">New Leads</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{kpis.newLeads ?? 0}</span>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/leads?status=CONTACTED,QUALIFIED" className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Hot Leads</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{kpis.hotLeads ?? 0}</span>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/customers" className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Converted</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{kpis.converted ?? 0}</span>
                </div>
              </div>
            </Link>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Pipeline Value</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatINR(totalPipelineValue)}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MANAGER / SUPER_ADMIN VIEW                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {isManager ? (
            <div className="space-y-4">
              {/* ── 1. Agent Leaderboard (Full Span) ──────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Agent Leaderboard</h3>
                </div>
                {agentLeaderboard.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 pr-4">#</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 pr-4">Agent</th>
                          <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 pr-4">Active Leads</th>
                          <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 pr-4">Converted</th>
                          <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 pr-4">Pipeline Value</th>
                          <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentLeaderboard.map((agent: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {agent.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">{agent.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">{agent.activeLeads}</td>
                            <td className="py-2.5 pr-4 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">{agent.convertedLeads}</td>
                            <td className="py-2.5 pr-4 text-right text-xs font-bold text-slate-800 dark:text-slate-200">{formatINR(agent.pipelineValue)}</td>
                            <td className="py-2.5 text-right">
                              {agent.needsReview ? (
                                <span className="text-[11px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">⚠️ Needs Review</span>
                              ) : (
                                <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 font-medium">✓ On Track</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6">No agents found</div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── 2. Stage Breakdown ────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Stage Breakdown</h3>
                    <div className="space-y-2.5">
                      {stageBreakdown.length > 0 ? stageBreakdown.map((item: any, idx: number) => {
                        const label = item.stage || item.name || "Unknown";
                        const count = item.count ?? 0;
                        const percentage = item.percentage ?? 0;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 w-20 shrink-0 truncate">
                              {formatEnum(label)}
                            </span>
                            <div className="flex-grow h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full ${getStageColor(item.color || label)}`} style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0 w-6 text-right">{count}</span>
                          </div>
                        );
                      }) : (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">No stage data available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 3. Pipeline Value vs Stage (BarChart) ──────────── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Pipeline Value by Stage</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pipelineByStage} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value: any) => [formatINR(Number(value)), "Pipeline"]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                        {pipelineByStage.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={STAGE_BAR_COLORS[index % STAGE_BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ── 4. Strategic Lead Source Pipeline ────────────────── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Lead Source Pipeline</h3>
                  {sourcePipeline.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2">Source</th>
                            <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2">Leads</th>
                            <th className="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourcePipeline.map((src: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                              <td className="py-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">{src.source}</td>
                              <td className="py-2 text-right text-[11px] font-semibold text-slate-600 dark:text-slate-400">{src.count}</td>
                              <td className="py-2 text-right text-[11px] font-bold text-slate-800 dark:text-slate-200">{formatINR(src.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6">No source data available</div>
                  )}
                </div>

                {/* ── 5. Agent Task Completion Matrix ──────────────────── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm lg:col-span-2">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Agent Task Completion</h3>
                  {agentTaskMatrix.length > 0 ? (
                    <div className="space-y-3">
                      {agentTaskMatrix.map((agent: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {agent.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-24 shrink-0 truncate">{agent.name}</span>
                          <div className="flex-grow h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${agent.percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 w-16 text-right">
                            {agent.completed}/{agent.total} <span className="text-slate-400 dark:text-slate-500">({agent.percentage}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6">No task data available</div>
                  )}
                </div>
              </div>

              {/* ── Quick Actions Footer Bar ──────────────────────────── */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-center gap-3">
                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
                  📊 Generate Pipeline Report
                </button>
                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
                  🧠 Review Overdue Tasks
                </button>
                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
                  🔄 Reassign Stagnant Leads
                </button>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════ */
            /* AGENT VIEW (existing panels, unchanged)                   */
            /* ═══════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Stage Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Stage Breakdown</h3>
                  <div className="space-y-2.5">
                    {stageBreakdown.length > 0 ? stageBreakdown.map((item: any, idx: number) => {
                      const label = item.stage || item.name || "Unknown";
                      const count = item.count ?? 0;
                      const percentage = item.percentage ?? 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 w-20 shrink-0 truncate">
                            {formatEnum(label)}
                          </span>
                          <div className="flex-grow h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-full rounded-full ${getStageColor(item.color || label)}`} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0 w-6 text-right">{count}</span>
                        </div>
                      );
                    }) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">No stage data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Weekly Funnel Trend */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Weekly Funnel Trend</h3>
                  <div className="flex gap-2 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> New</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Contacted</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Quotes</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Converted</span>
                  </div>
                </div>
                <div className="w-full flex-grow">
                  {weeklyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#ffffff' }} />
                        <Line type="monotone" dataKey="New" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Contacted" stroke="#6366F1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Quotes" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Converted" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-[11px] text-slate-400 dark:text-slate-500">No trend data available</div>
                  )}
                </div>
              </div>

              {/* 3. Hot Leads to Action */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Hot Leads to Action</h3>
                <div className="space-y-2.5">
                  {hotLeadsList.length > 0 ? hotLeadsList.map((lead: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 text-[11px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold shrink-0">
                          {lead.initials || lead.name?.substring(0, 2).toUpperCase() || 'NA'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-white truncate">{lead.name}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">{lead.subtext}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] px-1.5 rounded-full font-medium tracking-tight ${getStatusBadgeStyles(lead.status)}`}>
                          {formatEnum(lead.status)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{lead.value}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">No hot leads available</div>
                  )}
                </div>
              </div>

              {/* 4. Today's Tasks */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Today's Tasks</h3>
                <div className="space-y-2">
                  {todaysTasks.length > 0 ? todaysTasks.map((task: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded border border-slate-100 dark:border-slate-800">
                      <div className="mt-0.5 w-3.5 h-3.5 rounded-sm border border-slate-300 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 flex items-center justify-center">
                        {task.status?.toUpperCase() === "COMPLETED" && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-semibold leading-tight truncate ${
                            task.status?.toUpperCase() === "COMPLETED" ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"
                          }`}>
                            {task.title}
                          </span>
                          <span className={`text-[9px] px-1 rounded shrink-0 font-medium ${
                            task.status?.toUpperCase() === "COMPLETED" 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {formatEnum(task.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{task.time}</span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 rounded">{formatEnum(task.type) || 'Task'}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">No tasks for today</div>
                  )}
                </div>
              </div>

              {/* 5. Lead Sources */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Lead Sources</h3>
                <div className="flex flex-col justify-between h-[calc(100%-1.5rem)]">
                  {leadSources.length > 0 ? (
                    <>
                      <div className="h-[90px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={leadSources}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={30}
                              outerRadius={45}
                              paddingAngle={2}
                            >
                              {leadSources.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '10px', padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#ffffff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full mt-2 space-y-1">
                        {leadSources.map((source: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: source.color || '#cbd5e1' }} />
                              <span>{formatEnum(source.name)}</span>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">{source.percentage || `${source.value}%`}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[11px] text-slate-400 dark:text-slate-500">No source data available</div>
                  )}
                </div>
              </div>

              {/* 6. Activity Feed */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-4 uppercase">Recent Activities</h3>
                <div className="border-l border-slate-200 dark:border-slate-800 ml-1 pl-3.5 space-y-4 py-1 relative">
                  {recentActivities.length > 0 ? recentActivities.map((activity: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className={`absolute top-1.5 left-[-18px] w-2 h-2 rounded-full ${activity.color || 'bg-slate-400'} ring-4 ring-white dark:ring-slate-900 z-10`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight">{activity.text}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{activity.time}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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
