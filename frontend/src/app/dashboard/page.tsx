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
  Cell
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="mt-1 text-sm leading-snug text-slate-500">
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
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-56" />
            ))}
          </div>
        </div>
      ) : fetchError ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-red-600 mb-2">Failed to load dashboard data</p>
          <p className="text-xs text-slate-500 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards — shared by all roles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Link href="/dashboard/leads" className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">New Leads</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800">{kpis.newLeads ?? 0}</span>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/leads?status=CONTACTED,QUALIFIED" className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Hot Leads</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800">{kpis.hotLeads ?? 0}</span>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/customers" className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Converted</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-800">{kpis.converted ?? 0}</span>
                </div>
              </div>
            </Link>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Pipeline Value</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{formatINR(totalPipelineValue)}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MANAGER / SUPER_ADMIN VIEW                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {isManager ? (
            <div className="space-y-4">
              {/* ── 1. Agent Leaderboard (Full Span) ──────────────────── */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Agent Leaderboard</h3>
                </div>
                {agentLeaderboard.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">#</th>
                          <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Agent</th>
                          <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Active Leads</th>
                          <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Converted</th>
                          <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Pipeline Value</th>
                          <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentLeaderboard.map((agent: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {agent.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-slate-800 truncate">{agent.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 text-right text-xs font-semibold text-slate-700">{agent.activeLeads}</td>
                            <td className="py-2.5 pr-4 text-right text-xs font-semibold text-emerald-600">{agent.convertedLeads}</td>
                            <td className="py-2.5 pr-4 text-right text-xs font-bold text-slate-800">{formatINR(agent.pipelineValue)}</td>
                            <td className="py-2.5 text-right">
                              {agent.needsReview ? (
                                <span className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">⚠️ Needs Review</span>
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 font-medium">✓ On Track</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 text-center py-6">No agents found</div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── 2. Management Action Alerts ─────────────────────── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Action Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {managementAlerts.length > 0 ? managementAlerts.map((alert: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-[11px] font-medium leading-snug ${
                          alert.severity === "danger"
                            ? "bg-rose-50 border-rose-100 text-rose-700"
                            : "bg-amber-50 border-amber-100 text-amber-700"
                        }`}
                      >
                        {alert.text}
                      </div>
                    )) : (
                      <div className="text-[11px] text-slate-400 text-center py-6">
                        <span className="text-emerald-500 font-semibold">✓</span> No urgent alerts
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3. Pipeline Value vs Stage (BarChart) ──────────── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                    <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Pipeline Value by Stage</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pipelineByStage} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Lead Source Pipeline</h3>
                  {sourcePipeline.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Source</th>
                            <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Leads</th>
                            <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourcePipeline.map((src: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-50 last:border-0">
                              <td className="py-2 text-[11px] font-medium text-slate-700">{src.source}</td>
                              <td className="py-2 text-right text-[11px] font-semibold text-slate-600">{src.count}</td>
                              <td className="py-2 text-right text-[11px] font-bold text-slate-800">{formatINR(src.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 text-center py-6">No source data available</div>
                  )}
                </div>

                {/* ── 5. Agent Task Completion Matrix ──────────────────── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:col-span-2">
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Agent Task Completion</h3>
                  {agentTaskMatrix.length > 0 ? (
                    <div className="space-y-3">
                      {agentTaskMatrix.map((agent: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {agent.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 w-24 shrink-0 truncate">{agent.name}</span>
                          <div className="flex-grow h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${agent.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0 w-16 text-right">
                            {agent.completed}/{agent.total} <span className="text-slate-400">({agent.percentage}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 text-center py-6">No task data available</div>
                  )}
                </div>
              </div>

              {/* ── Quick Actions Footer Bar ──────────────────────────── */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-center gap-3">
                <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
                  📊 Generate Pipeline Report
                </button>
                <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
                  🧠 Review Overdue Tasks
                </button>
                <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5">
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
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Stage Breakdown</h3>
                  <div className="space-y-2.5">
                    {stageBreakdown.length > 0 ? stageBreakdown.map((item: any, idx: number) => {
                      const label = item.stage || item.name || "Unknown";
                      const count = item.count ?? 0;
                      const percentage = item.percentage ?? 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-600 w-20 shrink-0 truncate">
                            {formatEnum(label)}
                          </span>
                          <div className="flex-grow h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color || 'bg-slate-400'}`} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 shrink-0 w-6 text-right">{count}</span>
                        </div>
                      );
                    }) : (
                      <div className="text-[11px] text-slate-400">No stage data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Weekly Funnel Trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Weekly Funnel Trend</h3>
                  <div className="flex gap-2 text-[9px] font-semibold text-slate-400">
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
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="New" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Contacted" stroke="#6366F1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Quotes" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Converted" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-[11px] text-slate-400">No trend data available</div>
                  )}
                </div>
              </div>

              {/* 3. Hot Leads to Action */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Hot Leads to Action</h3>
                <div className="space-y-2.5">
                  {hotLeadsList.length > 0 ? hotLeadsList.map((lead: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 text-[10px] bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold shrink-0">
                          {lead.initials || lead.name?.substring(0, 2).toUpperCase() || 'NA'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-semibold text-slate-800 truncate">{lead.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate">{lead.subtext}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] px-1.5 rounded-full font-medium tracking-tight ${getStatusBadgeStyles(lead.status)}`}>
                          {formatEnum(lead.status)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">{lead.value}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400">No hot leads available</div>
                  )}
                </div>
              </div>

              {/* 4. Today's Tasks */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Today's Tasks</h3>
                <div className="space-y-2">
                  {todaysTasks.length > 0 ? todaysTasks.map((task: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded border border-slate-100">
                      <div className="mt-0.5 w-3.5 h-3.5 rounded-sm border border-slate-300 flex-shrink-0 bg-white flex items-center justify-center">
                        {task.status?.toUpperCase() === "COMPLETED" && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-semibold leading-tight truncate ${
                            task.status?.toUpperCase() === "COMPLETED" ? "line-through text-slate-400" : "text-slate-700"
                          }`}>
                            {task.title}
                          </span>
                          <span className={`text-[9px] px-1 rounded shrink-0 font-medium ${
                            task.status?.toUpperCase() === "COMPLETED" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {formatEnum(task.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-400 font-medium">{task.time}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded">{formatEnum(task.type) || 'Task'}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400">No tasks for today</div>
                  )}
                </div>
              </div>

              {/* 5. Lead Sources */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Lead Sources</h3>
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
                            <Tooltip contentStyle={{ fontSize: '10px', padding: '4px 8px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full mt-2 space-y-1">
                        {leadSources.map((source: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: source.color || '#cbd5e1' }} />
                              <span>{formatEnum(source.name)}</span>
                            </div>
                            <span className="font-bold text-slate-700 shrink-0">{source.percentage || `${source.value}%`}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[11px] text-slate-400">No source data available</div>
                  )}
                </div>
              </div>

              {/* 6. Activity Feed */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 tracking-wider mb-4 uppercase">Recent Activities</h3>
                <div className="border-l border-slate-200 ml-1 pl-3.5 space-y-4 py-1 relative">
                  {recentActivities.length > 0 ? recentActivities.map((activity: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className={`absolute top-1.5 left-[-18px] w-2 h-2 rounded-full ${activity.color || 'bg-slate-400'} ring-4 ring-white z-10`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-slate-700 font-medium leading-tight">{activity.text}</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{activity.time}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-slate-400">No recent activity</div>
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
