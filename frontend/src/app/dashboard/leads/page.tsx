"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Plus, Search, Filter, LayoutList, LayoutGrid, Check, ChevronDown, User, Calendar, ExternalLink, X, Phone, Mail, Building, Globe, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { apiClient } from "@/lib/api";
import { useUser, useUserRole } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import StatusDropdown from "@/components/leads/StatusDropdown";
import ConvertLeadModal from "@/components/leads/ConvertLeadModal";

interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email: string | null;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

const SOURCE_OPTIONS = ["WEBSITE", "WHATSAPP", "REFERRAL", "MANUAL", "SOCIAL_MEDIA"];

export default function LeadsPage() {
  const user = useUser();
  const role = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL States
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";
  const sourceFilter = searchParams.get("source") || "";
  const dateFilter = searchParams.get("date") || "";
  const view = (searchParams.get("view") as "list" | "kanban") || "list";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Modal & Sidebar states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({ firstName: "", phone: "", email: "", source: "WEBSITE", company: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update URL params helper
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams.toString();
    },
    [searchParams]
  );

  const updateFilters = (params: Record<string, string | null>) => {
    router.push(`${pathname}?${createQueryString(params)}`);
  };

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Sync search input if URL changes (e.g. back button)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        dateRange: dateFilter || undefined,
        limit: 1000,
      };
      const data = await apiClient.get<Lead[]>("/leads", params);
      setLeads(data || []); 
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter, dateFilter]);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    if (newStatus === "WON") {
      fetchLeads(); // Refresh list to remove the converted lead
      return;
    }
    // Optimistic Update for other statuses
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/leads", { 
        ...newLead, 
        officeId: user?.officeId 
      });
      // Close modal immediately for better UX
      setIsModalOpen(false);
      setNewLead({ firstName: "", phone: "", email: "", source: "WEBSITE", company: "" });
      fetchLeads();
    } catch (error: any) {
      console.error("Failed to create lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 px-4 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Leads Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage your sales prospects through the funnel.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button 
              title="List View"
              onClick={() => updateFilters({ view: "list" })}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button 
              title="Kanban View"
              onClick={() => updateFilters({ view: "kanban" })}
              className={`p-2 rounded-lg transition-all ${view === "kanban" ? "bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-gray-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex h-9 items-center justify-center px-3.5 rounded-lg text-xs font-semibold border transition-all w-full sm:w-auto ${statusFilter || sourceFilter || dateFilter ? "bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue border-brand-blue/30 dark:border-brand-blue/40" : "bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"}`}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Advanced Filters {(statusFilter || sourceFilter || dateFilter) && "•"}
          </button>
          {(statusFilter || sourceFilter || dateFilter || search) && (
            <button 
              onClick={() => {
                setSearchInput("");
                router.push(pathname);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {view === "list" ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/30 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="w-[25%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Lead Information</th>
                  <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  {(role === "SUPER_ADMIN" || role === "MANAGER") && (
                    <th className="w-[20%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Assigned Agent</th>
                  )}
                  <th className="w-[12%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Source</th>
                  <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Created On</th>
                  <th className="w-[13%] px-4 py-[8.5px] text-right text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-blue border-t-transparent" />
                        <span className="text-sm font-medium text-gray-500 animate-pulse">Syncing lead database...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                          <Search className="h-6 w-6 text-gray-300" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">No leads found</h3>
                        <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-4 py-[7px]">
                        <span className="text-[14.5px] font-medium text-gray-900 dark:text-white">{lead.firstName} {lead.lastName || ''}</span>
                      </td>
                      <td className="px-4 py-[7px]">
                        <StatusDropdown 
                          leadId={lead.id} 
                          currentStatus={lead.status} 
                          onStatusChange={(newStatus) => handleStatusChange(lead.id, newStatus)} 
                        />
                      </td>
                      {(role === "SUPER_ADMIN" || role === "MANAGER") && (
                        <td className="px-4 py-[7px]">
                          {lead.agent ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20 overflow-hidden shadow-sm flex-shrink-0">
                                {lead.agent.avatarUrl ? (
                                  <img src={lead.agent.avatarUrl} alt={lead.agent.name} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                              </div>
                              <span className="text-[12px] font-medium text-gray-700 dark:text-slate-300 truncate max-w-[120px]">{lead.agent.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <div className="h-6 w-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3" />
                              </div>
                              <span className="text-[11px] font-medium italic">Waiting for assignment</span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-[7px]">
                        <span className="inline-flex px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-[7px]">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
                          <Calendar className="h-3 w-3 opacity-60" />
                          <span>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-[7px] text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setSelectedLeadForConversion(lead);
                              setIsConvertModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-100 dark:border-emerald-900/30 transition-all"
                          >
                            Convert
                            <Check className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-gray-500 hover:text-brand-blue hover:bg-brand-blue/5 border border-transparent hover:border-brand-blue/20 transition-all"
                          >
                            Details
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <LayoutGrid className="h-10 w-10 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Kanban Board Mode</h3>
          <p className="text-gray-400 text-sm">Drag and drop leads to update status (Feature in Development)</p>
          <button 
            onClick={() => updateFilters({ view: "list" })}
            className="mt-4 text-brand-blue font-semibold hover:underline"
          >
            Back to List View
          </button>
        </div>
      )}

      {/* Filter Sidebar (Slide-over) */}
      <Transition.Root show={isFilterOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsFilterOpen}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-xs">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-900 shadow-2xl border-l border-gray-100 dark:border-slate-800">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                        <Dialog.Title className="text-lg font-bold text-slate-800 dark:text-white">Advanced Filters</Dialog.Title>
                        <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">✕</button>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lead Status</label>
                          <div className="flex flex-wrap gap-2">
                            {["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST"].map(val => (
                              <button
                                key={val}
                                onClick={() => updateFilters({ status: statusFilter === val ? null : val })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  statusFilter === val 
                                    ? "bg-brand-blue border-brand-blue text-white shadow-md" 
                                    : "bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-blue/30 dark:hover:border-brand-blue/30"
                                }`}
                              >
                                {val.charAt(0) + val.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lead Source</label>
                          <select 
                            value={sourceFilter}
                            onChange={(e) => updateFilters({ source: e.target.value })}
                            className="w-full rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                          >
                            <option value="" className="dark:bg-slate-900">All Sources</option>
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Date Added</label>
                          <div className="flex flex-col gap-2">
                            {["Today", "Last 7 Days", "This Month"].map(d => (
                              <button
                                key={d}
                                onClick={() => updateFilters({ date: dateFilter === d ? null : d })}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                  dateFilter === d 
                                    ? "bg-brand-blue/5 dark:bg-brand-blue/10 border-brand-blue text-brand-blue" 
                                    : "bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                                }`}
                              >
                                {d}
                                {dateFilter === d && <Check className="h-4 w-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                        <button 
                          onClick={() => router.push(pathname)}
                          className="flex-1 px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg transition-all"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 btn btn-primary px-4 py-2 text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Create Lead Modal (Keeping existing modal but with improved styling) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/30 dark:bg-slate-800/20">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Add New Prospect</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 bg-white dark:bg-slate-900">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full h-10 px-3.5 bg-gray-50/50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="e.g. John"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full h-10 px-3.5 bg-gray-50/50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="+91 98765 43210"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full h-10 px-3.5 bg-gray-50/50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="john@example.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="h-3 w-3" />
                  Company Name
                </label>
                <input 
                  type="text" 
                  className="w-full h-10 px-3.5 bg-gray-50/50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="e.g. Google"
                  value={newLead.company}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  Lead Source
                </label>
                <select 
                  className="w-full h-10 px-3 bg-gray-50/50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-slate-800 dark:text-white cursor-pointer"
                  value={newLead.source}
                  onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                >
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg transition-all" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-xs font-bold text-white px-5 py-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 min-w-[120px] shadow-sm" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  ) : "Save Prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConvertLeadModal 
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        leadId={selectedLeadForConversion?.id || ""}
        leadName={selectedLeadForConversion ? `${selectedLeadForConversion.firstName} ${selectedLeadForConversion.lastName || ""}` : ""}
        onSuccess={() => {
          setIsConvertModalOpen(false);
          fetchLeads();
        }}
      />
    </div>
  );
}
