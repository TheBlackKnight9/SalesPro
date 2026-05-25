"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Download, 
  Building, 
  Users, 
  Calendar, 
  AlertCircle, 
  FileSpreadsheet, 
  Layers, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  ShieldAlert
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useUser, useUserRole } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";

// ---------------------------------------------------------------------------
// 1. Data Type Specifications
// ---------------------------------------------------------------------------
interface Office {
  id: string;
  name: string;
}

interface UserAgent {
  id: string;
  name: string;
  officeId: string | null;
}

interface OfficeLedgerRow {
  officeName: string;
  activeLeads: number;
  revenue: number;
  target: number;
  progressPercent: number;
}

interface AgentPerformanceRow {
  agentName: string;
  officeName: string;
  assignedLeads: number;
  conversionRate: number;
  closedVolume: number;
}

interface FunnelStageRow {
  stage: string;
  count: number;
  value: number;
}

interface SourceAnalysisRow {
  source: string;
  acquired: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  efficiencyRate: number;
}

interface AnalyticsData {
  officeLedger: OfficeLedgerRow[];
  agentMatrix: AgentPerformanceRow[];
  funnelAnalysis: FunnelStageRow[];
  sourceAnalysis: SourceAnalysisRow[];
  taskMetrics: TaskMetrics;
}

// Helper to format currency in Indian Rupees format (₹)
const formatINR = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
};

export default function ReportsPage() {
  const currentUser = useUser();
  const role = useUserRole();
  const { showToast } = useToast();

  // Filter States
  const [dateRange, setDateRange] = useState("this_month");
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // Selectors Data
  const [offices, setOffices] = useState<Office[]>([]);
  const [agents, setAgents] = useState<UserAgent[]>([]);

  // Main Analytics Data
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  // ── A. Fetch Offices and Agents for Selectors ─────────────────────────────
  useEffect(() => {
    const loadSelectorFilters = async () => {
      try {
        setIsFiltersLoading(true);
        
        // 1. Fetch Offices (SUPER_ADMIN exclusive)
        if (role === "SUPER_ADMIN") {
          const officeData = await apiClient.get<Office[]>("/offices", { page: 1, limit: 100 });
          setOffices(officeData || []);
        }

        // 2. Fetch Agents
        const agentParams: any = { role: "AGENT", limit: 200 };
        if (role === "MANAGER" && currentUser?.officeId) {
          agentParams.officeId = currentUser.officeId;
        } else if (role === "SUPER_ADMIN" && selectedOfficeId) {
          agentParams.officeId = selectedOfficeId;
        }

        const agentData = await apiClient.get<any[]>("/users", agentParams);
        setAgents(agentData || []);
      } catch (error) {
        console.error("Failed to load selectors context:", error);
      } finally {
        setIsFiltersLoading(false);
      }
    };

    if (role) {
      loadSelectorFilters();
    }
  }, [role, currentUser, selectedOfficeId]);

  // Reset agent selection if office selector changes to prevent stale office filters
  const handleOfficeChange = (val: string) => {
    setSelectedOfficeId(val);
    setSelectedAgentId("");
  };

  // ── B. Fetch Dynamic Analytics Report ──────────────────────────────────
  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        dateRange,
        officeId: selectedOfficeId || undefined,
        agentId: selectedAgentId || undefined
      };

      const response = await apiClient.get<AnalyticsData>("/reports/analytics", params);
      setData(response);
    } catch (error: any) {
      console.error("Failed to fetch analytics report data:", error);
      showToast(error?.message || "Failed to fetch analytics report.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      fetchReport();
    }
  }, [dateRange, selectedOfficeId, selectedAgentId, role]);

  // ── C. Client-side CSV Exporter for Office Ledger ─────────────────────────
  const handleExportCSV = () => {
    if (!data || !data.officeLedger || data.officeLedger.length === 0) {
      showToast("No office ROI data available to export.", "error");
      return;
    }

    const escapeCSV = (val: any) => {
      const str = String(val === null || val === undefined ? "" : val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ["Office Location", "Active Leads Count", "Total Revenue (₹)", "Monthly Target (₹)", "Target Progress %"];
    const rows = data.officeLedger.map((row) => [
      row.officeName,
      row.activeLeads,
      row.revenue,
      row.target,
      `${row.progressPercent}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(escapeCSV).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Office_ROI_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported successfully!", "success");
  };

  // ── D. Max Value Calculators for horizontal stacked chart fills ───────────
  const maxFunnelValue = useMemo(() => {
    if (!data?.funnelAnalysis) return 1;
    const maxVal = Math.max(...data.funnelAnalysis.map(s => s.value), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [data]);

  const maxSourceRevenue = useMemo(() => {
    if (!data?.sourceAnalysis) return 1;
    const maxRev = Math.max(...data.sourceAnalysis.map(s => s.revenue), 0);
    return maxRev > 0 ? maxRev : 1;
  }, [data]);

  // Guard: Restrict role access to reports page
  if (role === "AGENT") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto mt-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          The Reporting and Analytics dashboard is exclusively accessible to authorized Administrators and Managers. Please contact support if you require privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 space-y-6 text-[13px] text-slate-800 dark:text-slate-200 pb-12 transition-colors duration-300">
      
      {/* ────────────────────────────────────────────────────────────────────────
          1. GLOBAL REPORT STICKY HEADER LAYOUT BAR
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#f8f9fa]/90 dark:bg-slate-950/90 backdrop-blur-md pb-4 pt-2 border-b border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-955 dark:text-white">Analytics Ledger</h1>
            {isLoading && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-density administrative reports and real-time operational insights.</p>
        </div>

        {/* Dynamic Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* A. Date-Range Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-0 outline-none text-[13px] pr-4 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_quarter">This Quarter</option>
              <option value="all">All-Time</option>
            </select>
          </div>

          {/* B. Branch Office Selector (SUPER_ADMIN Exclusive) */}
          {role === "SUPER_ADMIN" ? (
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
              <Building className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
              <select
                value={selectedOfficeId}
                onChange={(e) => handleOfficeChange(e.target.value)}
                className="bg-transparent border-0 outline-none text-[13px] pr-4 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="">All Offices</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Show lock placeholder for Manager
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-800 px-2 py-1 text-slate-500 dark:text-slate-400 text-[13px]">
              <Building className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
              <span className="font-medium mr-1">Office:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Locked to Branch</span>
            </div>
          )}

          {/* C. Assigned Agent Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
            <Users className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-transparent border-0 outline-none text-[13px] pr-4 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              disabled={isFiltersLoading}
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          2. REGIONAL OFFICE ROI LEDGER (SUPER_ADMIN Exclusive)
          ──────────────────────────────────────────────────────────────────────── */}
      {role === "SUPER_ADMIN" && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-md">
                <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Regional Office ROI Ledger</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Commercial revenue metrics, active leads pipeline, and quarterly target attainment percentages.</p>
              </div>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium border border-slate-200 dark:border-slate-800 transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {isLoading ? (
            <div className="h-28 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Aggregating office metrics...</span>
            </div>
          ) : !data || data.officeLedger.length === 0 ? (
            <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/40">
              <div className="text-center text-slate-400 dark:text-slate-500">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                <p className="text-[12px]">No office activity data exists for the selected date range.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Office Location</th>
                    <th className="py-2.5 px-3 text-center">Active Leads</th>
                    <th className="py-2.5 px-3 text-right">Revenue (Accepted)</th>
                    <th className="py-2.5 px-3 text-right">Monthly Target</th>
                    <th className="py-2.5 px-3 text-right w-52">Target Attainment %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.officeLedger.map((row, idx) => {
                    // Attainment progress bar color mappings
                    let barColor = "bg-rose-500";
                    let badgeStyle = "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900/30";
                    if (row.progressPercent >= 100) {
                      barColor = "bg-emerald-500";
                      badgeStyle = "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/30";
                    } else if (row.progressPercent >= 75) {
                      barColor = "bg-indigo-500";
                      badgeStyle = "text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-900/30";
                    } else if (row.progressPercent >= 40) {
                      barColor = "bg-amber-500";
                      badgeStyle = "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/30";
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.officeName}</td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-600 dark:text-slate-300">{row.activeLeads}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(row.revenue)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">{formatINR(row.target)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${badgeStyle}`}>
                              {row.progressPercent}%
                            </span>
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 hidden sm:block">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${Math.min(row.progressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grid containing Insertions 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ────────────────────────────────────────────────────────────────────────
            3. AGENT PERFORMANCE & EFFICIENCY MATRIX (Visible to Admin & Manager)
            ──────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700">
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-md">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Agent Performance & Efficiency Matrix</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active agent performance rankings including conversion ratios and total closed volume (₹).</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Loading representative indexes...</span>
            </div>
          ) : !data || data.agentMatrix.length === 0 ? (
            <div className="h-44 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/40">
              <div className="text-center text-slate-400 dark:text-slate-500">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                <p className="text-[12px]">No active agents recorded in this database filter.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2 px-2 text-center w-8">Rank</th>
                    <th className="py-2 px-3">Agent Name</th>
                    <th className="py-2 px-3">Office Location</th>
                    <th className="py-2 px-3 text-center">Assigned Leads</th>
                    <th className="py-2 px-3 text-center">Conversion</th>
                    <th className="py-2 px-3 text-right">Closed Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.agentMatrix.map((row, idx) => {
                    const rank = idx + 1;
                    let rankBadge = "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800";
                    if (rank === 1) rankBadge = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 font-extrabold";
                    else if (rank === 2) rankBadge = "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold";
                    else if (rank === 3) rankBadge = "text-amber-900 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 font-bold";

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${rankBadge}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.agentName}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{row.officeName}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">{row.assignedLeads}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            row.conversionRate >= 30 ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" : 
                            row.conversionRate >= 15 ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30" :
                            "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-850"
                          }`}>
                            {row.conversionRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(row.closedVolume)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            4. PIPELINE BOTTLENECK & FUNNEL STAGE ANALYSIS
            ──────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-md">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Funnel Stage Analysis</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Asset volumes and budget amounts sitting inside each active CRM stage.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="h-44 flex items-center justify-center text-slate-400">
                <span className="animate-pulse">Re-profiling lead stages...</span>
              </div>
            ) : !data || data.funnelAnalysis.length === 0 ? (
              <div className="h-44 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/40">
                <div className="text-center text-slate-400 dark:text-slate-500">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                  <p className="text-[12px]">No pipeline stages available.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {data.funnelAnalysis.map((row, idx) => {
                  const percentWidth = Math.min((row.value / maxFunnelValue) * 100, 100);

                  // Unique Stage Badges
                  let stageLabel = row.stage;
                  let colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                  if (row.stage === "NEW") colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                  else if (row.stage === "CONTACTED") colorClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
                  else if (row.stage === "QUALIFIED") colorClass = "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30";
                  else if (row.stage === "PROPOSAL_SENT") colorClass = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30";
                  else if (row.stage === "NEGOTIATION") colorClass = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30";

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold border uppercase text-[10px] tracking-wider ${colorClass}`}>
                          {stageLabel.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{row.count} Leads</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatINR(row.value)}</span>
                        </div>
                      </div>
                      
                      {/* Horizontal progress bar representing relative budget allocation */}
                      <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800/60">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500 opacity-80"
                          style={{ width: `${percentWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>High counts with large budgets in NEGOTIATION represent deals stalling.</span>
          </div>
        </div>
      </div>

      {/* Grid containing Insertions 4 & 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ────────────────────────────────────────────────────────────────────────
            5. LEAD SOURCE ACQUISITION ROI AUDIT
            ──────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700">
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">
              <PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Lead Source Acquisition ROI Audit</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Comparative performance parameters showing acquisition volumes and revenue ratios by capture source.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Auditing acquisition sources...</span>
            </div>
          ) : !data || data.sourceAnalysis.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/40">
              <div className="text-center text-slate-400 dark:text-slate-500">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                <p className="text-[12px]">No lead sources identified.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 mt-2">
              {data.sourceAnalysis.map((row, idx) => {
                const percentRevenue = Math.min((row.revenue / maxSourceRevenue) * 100, 100);

                // Source Colors mapping
                let tagColor = "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-850 dark:border-slate-750";
                if (row.source === "WEBSITE") tagColor = "text-indigo-700 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-900/30";
                else if (row.source === "SOCIAL_MEDIA") tagColor = "text-pink-700 bg-pink-50 border-pink-100 dark:text-pink-400 dark:bg-pink-950/30 dark:border-pink-900/30";
                else if (row.source === "REFERRAL") tagColor = "text-teal-700 bg-teal-50 border-teal-100 dark:text-teal-400 dark:bg-teal-950/30 dark:border-teal-900/30";
                else if (row.source === "WHATSAPP") tagColor = "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/30";
                else if (row.source === "MANUAL") tagColor = "text-violet-700 bg-violet-50 border-violet-100 dark:text-violet-400 dark:bg-violet-950/30 dark:border-violet-900/30";

                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className={`w-28 text-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${tagColor}`}>
                      {row.source.replace("_", " ")}
                    </span>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span>{row.acquired} Acquired</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 font-bold">Conv: {row.conversionRate}%</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatINR(row.revenue)}</span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500 opacity-80"
                          style={{ width: `${percentRevenue}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            6. TASK VELOCITY & OPERATIONAL DISCIPLINE LOG
            ──────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 gap-2">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-md">
                <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Task Velocity & Operational Discipline Log</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time team execution indexes tracking overdue actions and resolution timelines.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <span className="animate-pulse">Analyzing task velocities...</span>
              </div>
            ) : !data ? (
              <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/40">
                <div className="text-center text-slate-400 dark:text-slate-500">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                  <p className="text-[12px]">Operational tasks metrics are missing.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                
                {/* Stats list */}
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Total Tasks</p>
                      <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mt-0.5">{data.taskMetrics.totalTasks}</h4>
                    </div>
                    <ClipboardList className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Completed</p>
                      <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mt-0.5">{data.taskMetrics.completedTasks}</h4>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 dark:text-emerald-500" />
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Overdue</p>
                      <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mt-0.5">{data.taskMetrics.overdueTasks}</h4>
                    </div>
                    <Clock className={`h-5 w-5 ${data.taskMetrics.overdueTasks > 0 ? "text-rose-500 animate-pulse" : "text-slate-300 dark:text-slate-700"}`} />
                  </div>
                </div>

                {/* Performance Radial Widget */}
                <div className="flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-800 rounded-md bg-slate-50/50 dark:bg-slate-950/40">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Efficiency Score</span>
                  
                  <div className="relative flex items-center justify-center h-24 w-24 mt-2">
                    {/* SVG Radial Progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="7"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        className="text-indigo-500 dark:text-indigo-400 transition-all duration-1000 ease-out"
                        strokeWidth="7"
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * data.taskMetrics.efficiencyRate) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    
                    <div className="absolute text-center">
                      <span className="text-[18px] font-extrabold text-slate-900 dark:text-white">{data.taskMetrics.efficiencyRate}%</span>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5">Resolved</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Velocity scores indicate the proportion of assigned actions completed within time constraints.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
