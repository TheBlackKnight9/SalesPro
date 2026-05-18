"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckSquare,
  DollarSign,
  FileText,
  MessageCircle,
  Plus,
  Target,
  TrendingUp,
  Users,
  UserPlus,
  UserCircle,
} from "lucide-react";
import AddCustomerSlideOver from "@/components/customers/AddCustomerSlideOver";
import AddLeadModal from "@/components/leads/AddLeadModal";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/lib/api";
import { useUser } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";

type UserRole = "SUPER_ADMIN" | "MANAGER" | "AGENT";

interface DashboardStatsResponse {
  totalLeads: number;
  activeCustomers: number;
  pipelineValue: number;
  conversionRate: string;
}

interface LeadRecord {
  id: string;
  firstName: string;
  lastName?: string;
  source?: string;
  status?: string;
  createdAt?: string;
}

interface UserRecord {
  id: string;
  name: string;
  role: UserRole;
  office?: { id: string; name: string };
  _count?: {
    assignedLeads?: number;
    tasks?: number;
  };
}

interface OfficeRecord {
  id: string;
  name: string;
  _count?: {
    leads?: number;
  };
}

interface CustomerRecord {
  id: string;
}

interface QuotationRecord {
  status?: string;
  totalAmount?: string | number;
}

interface StatCardProps {
  title: string;
  value: string;
  delta: number;
  icon: ComponentType<{ className?: string }>;
}

interface DashboardDataState {
  stats: DashboardStatsResponse;
  officePerformanceData: Array<{ office: string; leads: number }>;
  leadSourceData: Array<{ name: string; value: number }>;
  topAgentData: Array<{ name: string; office: string; converted: number; pipeline: string }>;
  systemActivityData: Array<{ id: string; text: string; leadId?: string }>;
  managerLeadStatusData: Array<{ name: string; value: number }>;
  managerAgentPerformance: Array<{ agent: string; leads: number; converted: number; tasks: number }>;
  managerTasks: Array<{ task: string; due: string }>;
  agentTasks: Array<{ task: string; due: string; tag: string }>;
  agentActivity: Array<{ id: string; text: string; leadId?: string }>;
  unreadWhatsAppCount: number;
  // New Manager Widgets Data
  monthlyTarget: { reached: number; goal: number };
  pendingApprovals: Array<{ id: string; agent: string; value: number; discount: number }>;
  recentLeads: Array<{ id: string; name: string; source: string; agent: string; priority: "HOT" | "WARM" | "COLD" }>;
}

const chartPalette = ["#1A56DB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const defaultData: DashboardDataState = {
  stats: {
    totalLeads: 0,
    activeCustomers: 0,
    pipelineValue: 0,
    conversionRate: "0%",
  },
  officePerformanceData: [
    { office: "Mumbai", leads: 0 },
    { office: "Delhi", leads: 0 },
    { office: "Pune", leads: 0 },
  ],
  leadSourceData: [
    { name: "Website", value: 0 },
    { name: "WhatsApp", value: 0 },
    { name: "Referral", value: 0 },
  ],
  topAgentData: [],
  systemActivityData: [{ id: "1", text: "No recent activity available yet." }],
  managerLeadStatusData: [
    { name: "New", value: 0 },
    { name: "Contacted", value: 0 },
    { name: "Qualified", value: 0 },
    { name: "Won", value: 0 },
  ],
  managerAgentPerformance: [],
  managerTasks: [
    { task: "Review office pipeline", due: "10:30 AM" },
    { task: "Agent stand-up", due: "4:00 PM" },
  ],
  agentTasks: [
    { task: "Call pending leads", due: "09:45 AM", tag: "Follow-up" },
    { task: "Update lead notes", due: "05:30 PM", tag: "Task" },
  ],
  agentActivity: [{ id: "1", text: "No recent activity available yet." }],
  unreadWhatsAppCount: 0,
  monthlyTarget: { reached: 750000, goal: 1000000 },
  pendingApprovals: [
    { id: "q1", agent: "Rahul Sharma", value: 12500, discount: 15 },
    { id: "q2", agent: "Priya Patel", value: 8900, discount: 10 },
  ],
  recentLeads: [
    { id: "l1", name: "Amit Kumar", source: "Website", agent: "Suresh Raina", priority: "HOT" },
    { id: "l2", name: "Neha Singh", source: "WhatsApp", agent: "Deepak Chahar", priority: "WARM" },
    { id: "l3", name: "Vikram Seth", source: "Referral", agent: "Rahul Dravid", priority: "COLD" },
  ],
};

function toCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

function StatCard({ title, value, delta, icon: Icon, onClick }: StatCardProps & { onClick?: () => void }) {
  const isPositive = delta >= 0;
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div 
      onClick={onClick}
      className={`rounded-base border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-brand-blue/30 active:scale-[0.98]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-bold leading-tight tracking-tight text-gray-900">{value}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}

function WidgetTitle({ title }: { title: string }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>;
}

import { useRouter } from "next/navigation";

function AdminDashboard({
  data,
}: {
  data: DashboardDataState;
}) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value={String(data.stats.totalLeads)} delta={12} icon={Users} onClick={() => router.push("/dashboard/leads")} />
        <StatCard title="Active Customers" value={String(data.stats.activeCustomers)} delta={8} icon={TrendingUp} onClick={() => router.push("/dashboard/customers")} />
        <StatCard title="Pipeline Value" value={toCurrency(data.stats.pipelineValue)} delta={15} icon={DollarSign} onClick={() => router.push("/dashboard/quotations")} />
        <StatCard title="Conversion Rate" value={data.stats.conversionRate} delta={-2} icon={Target} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm xl:col-span-2">
          <WidgetTitle title="Office Performance" />
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.officePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="office" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#1A56DB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Lead Source Distribution" />
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.leadSourceData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48}>
                  {data.leadSourceData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Top Performing Agents" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-2 text-left">Agent</th>
                  <th className="py-2 text-left">Office</th>
                  <th className="py-2 text-left">Converted</th>
                  <th className="py-2 text-left">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {data.topAgentData.map((agent, idx) => (
                  <tr 
                    key={`${agent.name}-${idx}`} 
                    className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/dashboard/users`)}
                  >
                    <td className="py-2.5 font-medium text-gray-700">{agent.name}</td>
                    <td className="py-2.5">{agent.office}</td>
                    <td className="py-2.5">{agent.converted}</td>
                    <td className="py-2.5">{agent.pipeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="System Recent Activity" />
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {data.systemActivityData.map((item) => (
              <li 
                key={item.id} 
                className="flex items-start gap-2 rounded-base border border-gray-100 px-3 py-2 leading-snug cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => item.leadId && router.push(`/dashboard/leads/${item.leadId}/timeline`)}
              >
                <Activity className="mt-0.5 h-4 w-4 text-brand-blue group-hover:scale-110 transition-transform" />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard({ data }: { data: DashboardDataState }) {
  const router = useRouter();
  const managerConverted = data.managerLeadStatusData.find((x) => x.name === "Won")?.value ?? 0;
  const targetPercent = data.monthlyTarget.goal > 0 
    ? Math.round((data.monthlyTarget.reached / data.monthlyTarget.goal) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Row 1: Stats + Monthly Target */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-3">
          <StatCard title="Total Leads" value={String(data.stats.totalLeads)} delta={9} icon={Users} onClick={() => router.push("/dashboard/leads")} />
          <StatCard title="Converted" value={String(managerConverted)} delta={6} icon={TrendingUp} />
          <StatCard title="Pipeline" value={toCurrency(data.stats.pipelineValue)} delta={11} icon={DollarSign} onClick={() => router.push("/dashboard/quotations")} />
        </div>
        
        {/* Office Monthly Target Widget */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <WidgetTitle title="Monthly Target" />
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-brand-blue">{targetPercent}%</span>
              <span className="text-xs text-gray-400">Reached</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-full bg-brand-blue transition-all duration-1000" 
                style={{ width: `${targetPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-tighter text-gray-400">
              <span>{toCurrency(data.monthlyTarget.reached)}</span>
              <span>Target: {toCurrency(data.monthlyTarget.goal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm xl:col-span-2">
          <WidgetTitle title="Agent-wise Performance" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-2 text-left">Agent</th>
                  <th className="py-2 text-left">Leads</th>
                  <th className="py-2 text-left">Converted</th>
                  <th className="py-2 text-left">Open Tasks</th>
                </tr>
              </thead>
              <tbody>
                {data.managerAgentPerformance.map((row, idx) => (
                  <tr 
                    key={`${row.agent}-${idx}`} 
                    className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/dashboard/users`)}
                  >
                    <td className="py-2.5 font-medium text-gray-700">{row.agent}</td>
                    <td className="py-2.5">{row.leads}</td>
                    <td className="py-2.5">{row.converted}</td>
                    <td className="py-2.5">{row.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Lead Status" />
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.managerLeadStatusData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={56}>
                  {data.managerLeadStatusData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Today's Tasks */}
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Today's Tasks & Follow-ups" />
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {data.managerTasks.map((task, idx) => (
              <li key={`${task.task}-${idx}`} className="flex items-center justify-between rounded-base border border-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-brand-blue" />
                  <span className="leading-snug">{task.task}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{task.due}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pending Quotation Approvals Widget */}
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Pending Quote Approvals" />
          <div className="mt-3 space-y-3">
            {data.pendingApprovals.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-brand-blue/20 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{quote.agent}</p>
                  <p className="text-xs text-gray-400">{toCurrency(quote.value)} • {quote.discount}% Discount</p>
                </div>
                <div className="flex gap-2">
                  <button className="h-8 w-8 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors">
                    <CheckSquare className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 flex items-center justify-center rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors">
                    <Plus className="h-4 w-4 rotate-45" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads Added (Agent Activity) Widget */}
      <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
        <WidgetTitle title="Recent Leads Activity" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-gray-600">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="py-2 text-left">Lead Name</th>
                <th className="py-2 text-left">Source</th>
                <th className="py-2 text-left">Added By</th>
                <th className="py-2 text-left">Priority</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                >
                  <td className="py-3 font-medium text-gray-800">{lead.name}</td>
                  <td className="py-3">{lead.source}</td>
                  <td className="py-3">{lead.agent}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.priority === "HOT" ? "bg-rose-100 text-rose-600" :
                      lead.priority === "WARM" ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {lead.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AgentDashboard({ data }: { data: DashboardDataState }) {
  const router = useRouter();
  const wonCount = data.managerLeadStatusData.find((x) => x.name === "Won")?.value ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="New Leads" value={String(data.managerLeadStatusData.find((x) => x.name === "New")?.value ?? 0)} delta={10} icon={Users} onClick={() => router.push("/dashboard/leads")} />
        <StatCard title="Active Leads" value={String(data.stats.totalLeads)} delta={4} icon={TrendingUp} onClick={() => router.push("/dashboard/leads")} />
        <StatCard title="Unread WhatsApp" value={String(data.unreadWhatsAppCount)} delta={-3} icon={MessageCircle} onClick={() => router.push("/dashboard/whatsapp")} />
        <StatCard title="Converted" value={String(wonCount)} delta={5} icon={Target} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="Today's Follow-ups & Tasks" />
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {data.agentTasks.map((item, idx) => (
              <li key={`${item.task}-${idx}`} className="rounded-base border border-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium leading-snug text-gray-700">{item.task}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.due}</span>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-blue">{item.tag}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-base border border-gray-200 bg-white p-4 shadow-sm">
          <WidgetTitle title="My Recent Activity" />
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {data.agentActivity.map((activity) => (
              <li 
                key={activity.id} 
                className="flex items-start gap-2 rounded-base border border-gray-100 px-3 py-2 leading-snug cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => activity.leadId && router.push(`/dashboard/leads/${activity.leadId}/timeline`)}
              >
                <Activity className="mt-0.5 h-4 w-4 text-brand-blue group-hover:scale-110 transition-transform" />
                <span>{activity.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const role: UserRole = (user?.role as UserRole) ?? "AGENT";
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardDataState>(defaultData);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);

        const leadsUrl = user?.officeId && role !== "SUPER_ADMIN"
          ? `/leads?limit=200&officeId=${encodeURIComponent(user.officeId)}`
          : "/leads?limit=200";

        const customersUrl = user?.officeId && role !== "SUPER_ADMIN"
          ? `/customers?limit=200&officeId=${encodeURIComponent(user.officeId)}`
          : "/customers?limit=200";

        const requests = await Promise.allSettled([
          api.get("/dashboard/stats"),
          api.get(leadsUrl),
          api.get("/users?limit=200"),
          api.get(customersUrl),
          api.get("/offices?limit=100"),
          api.get("/quotations?limit=200"),
        ]);

        const [statsResult, leadsResult, usersResult, customersResult, officesResult, quotationsResult] = requests;

        const statsPayload = statsResult.status === "fulfilled" ? (statsResult.value.data?.data as DashboardStatsResponse | undefined) : undefined;
        const leadsPayload = leadsResult.status === "fulfilled" ? asArray<LeadRecord>(leadsResult.value.data?.data) : [];
        const usersPayload = usersResult.status === "fulfilled" ? asArray<UserRecord>(usersResult.value.data?.data) : [];
        const customersPayload = customersResult.status === "fulfilled" ? asArray<CustomerRecord>(customersResult.value.data?.data) : [];
        const officesPayload = officesResult.status === "fulfilled" ? asArray<OfficeRecord>(officesResult.value.data?.data) : [];
        const quotationsPayload = quotationsResult.status === "fulfilled" ? asArray<QuotationRecord>(quotationsResult.value.data?.data) : [];

        const sourceCounts = leadsPayload.reduce<Record<string, number>>((acc, lead) => {
          const source = lead.source || "OTHER";
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {});

        const statusCounts = leadsPayload.reduce<Record<string, number>>((acc, lead) => {
          const status = lead.status || "NEW";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const officePerformance = officesPayload
          .map((office) => ({ office: office.name, leads: office._count?.leads || 0 }))
          .filter((row) => row.leads >= 0)
          .slice(0, 6);

        const leadSource = Object.entries(sourceCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        const agents = usersPayload
          .filter((u) => u.role === "AGENT" || u.role === "MANAGER")
          .map((u) => {
            const assignedLeads = u._count?.assignedLeads || 0;
            const converted = Math.round(assignedLeads * 0.3);
            return {
              name: u.name,
              office: u.office?.name || "Global",
              converted,
              pipeline: toCurrency(assignedLeads * 4200),
              leads: assignedLeads,
              tasks: u._count?.tasks || 0,
            };
          })
          .sort((a, b) => b.converted - a.converted);

        const derivedPipeline = quotationsPayload
          .filter((q) => ["DRAFT", "SENT", "ACCEPTED"].includes(String(q.status || "")))
          .reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);

        const totalLeads = statsPayload?.totalLeads ?? leadsPayload.length;
        const activeCustomers = statsPayload?.activeCustomers ?? customersPayload.length;
        const pipelineValue = statsPayload?.pipelineValue ?? derivedPipeline;
        const won = statusCounts.WON || 0;
        const conversionRate = totalLeads > 0 ? `${((won / totalLeads) * 100).toFixed(1)}%` : "0%";

        const recentLeadActivity = leadsPayload
          .slice(0, 6)
          .map((lead) => ({
            id: lead.id,
            text: `Lead ${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""} added`,
            leadId: lead.id
          }));

        const recentLeads = leadsPayload
          .slice(0, 5)
          .map((lead) => ({
            id: lead.id,
            name: `${lead.firstName} ${lead.lastName || ""}`,
            source: lead.source || "Website",
            agent: "Assigned Agent", // In a real app, join with user name
            priority: (lead.status === "NEW" ? "HOT" : "WARM") as "HOT" | "WARM" | "COLD"
          }));

        const managerTasks = [
          { task: `Review ${Math.max(totalLeads, 1)} active leads`, due: "10:30 AM" },
          { task: "Approve pending quotations", due: "12:00 PM" },
          { task: "Team stand-up and blockers", due: "4:00 PM" },
          { task: "Escalation follow-up calls", due: "6:15 PM" },
        ];

        const agentTasks = [
          { task: "Call high-priority leads", due: "09:45 AM", tag: "Follow-up" },
          { task: "Update pending quote notes", due: "11:30 AM", tag: "Task" },
          { task: "Send WhatsApp reminders", due: "02:00 PM", tag: "Follow-up" },
          { task: "Prepare EOD activity log", due: "05:30 PM", tag: "Task" },
        ];

        const nextData: DashboardDataState = {
          stats: {
            totalLeads,
            activeCustomers,
            pipelineValue,
            conversionRate: statsPayload?.conversionRate || conversionRate,
          },
          officePerformanceData: officePerformance.length > 0 ? officePerformance : defaultData.officePerformanceData,
          leadSourceData: leadSource.length > 0 ? leadSource : defaultData.leadSourceData,
          topAgentData: agents.slice(0, 6).map((a) => ({ name: a.name, office: a.office, converted: a.converted, pipeline: a.pipeline })),
          systemActivityData: recentLeadActivity.length > 0 ? recentLeadActivity : defaultData.systemActivityData,
          managerLeadStatusData: [
            { name: "New", value: statusCounts.NEW || 0 },
            { name: "Contacted", value: statusCounts.CONTACTED || 0 },
            { name: "Qualified", value: statusCounts.QUALIFIED || 0 },
            { name: "Won", value: statusCounts.WON || 0 },
          ],
          managerAgentPerformance: agents.slice(0, 8).map((a) => ({
            agent: a.name,
            leads: a.leads,
            converted: a.converted,
            tasks: a.tasks,
          })),
          managerTasks,
          agentTasks,
          agentActivity: recentLeadActivity.length > 0 ? recentLeadActivity : defaultData.agentActivity,
          unreadWhatsAppCount: 0,
          monthlyTarget: { reached: Math.round(pipelineValue * 0.7), goal: Math.round(pipelineValue * 1.2) },
          pendingApprovals: quotationsPayload
            .filter(q => q.status === "SENT") // Assume SENT means pending manager approval in this context
            .slice(0, 5)
            .map((q, idx) => ({
              id: String(idx),
              agent: "John Agent",
              value: Number(q.totalAmount || 0),
              discount: 10
            })),
          recentLeads: recentLeads.length > 0 ? recentLeads : defaultData.recentLeads,
        };

        if (mounted) setData(nextData);
      } catch (error) {
        if (mounted) setData(defaultData);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [role, user?.officeId]);

  const headerSubtitle = useMemo(() => {
    if (isLoading) return "Loading role-based dashboard data...";
    return "Role-based dashboard widgets with live API data and safe fallbacks.";
  }, [isLoading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm leading-snug text-gray-600">{headerSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddLeadOpen(true)}
          >
            Add Lead
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<CheckSquare className="h-4 w-4" />}>
            New Task
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<FileText className="h-4 w-4" />}>
            New Quote
          </Button>
        </div>
      </div>

      {role === "SUPER_ADMIN" && <AdminDashboard data={data} />}
      {role === "MANAGER" && <ManagerDashboard data={data} />}
      {role === "AGENT" && <AgentDashboard data={data} />}

      <AddCustomerSlideOver 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        onSuccess={() => {
          window.location.reload();
        }}
      />
      
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
