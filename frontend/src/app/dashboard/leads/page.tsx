"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Plus, Search, Filter, LayoutList, LayoutGrid, Check, ChevronDown, User, Calendar, ExternalLink, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { apiClient } from "@/lib/api";
import { useUser, useUserRole } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import StatusDropdown from "@/components/leads/StatusDropdown";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage your sales prospects through the funnel.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button 
              title="List View"
              onClick={() => updateFilters({ view: "list" })}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-brand-blue/10 text-brand-blue" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button 
              title="Kanban View"
              onClick={() => updateFilters({ view: "kanban" })}
              className={`p-2 rounded-lg transition-all ${view === "kanban" ? "bg-brand-blue/10 text-brand-blue" : "text-gray-400 hover:text-gray-600"}`}
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-blue focus:border-brand-blue transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={`btn w-full sm:w-auto rounded-xl ${statusFilter || sourceFilter || dateFilter ? "bg-brand-blue/10 text-brand-blue border-brand-blue/30" : "btn-secondary"}`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters {(statusFilter || sourceFilter || dateFilter) && "•"}
          </button>
          {(statusFilter || sourceFilter || dateFilter || search) && (
            <button 
              onClick={() => {
                setSearchInput("");
                router.push(pathname);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {view === "list" ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Information</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  {(role === "SUPER_ADMIN" || role === "MANAGER") && (
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Agent</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Created On</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{lead.firstName} {lead.lastName || ''}</span>
                          <div className="flex flex-col mt-0.5 text-xs text-gray-500">
                            <span>{lead.phone}</span>
                            {lead.email && <span className="truncate max-w-[180px]">{lead.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown 
                          leadId={lead.id} 
                          currentStatus={lead.status} 
                          onStatusChange={(newStatus) => handleStatusChange(lead.id, newStatus)} 
                        />
                      </td>
                      {(role === "SUPER_ADMIN" || role === "MANAGER") && (
                        <td className="px-6 py-4">
                          {lead.agent ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20 overflow-hidden shadow-sm">
                                {lead.agent.avatarUrl ? (
                                  <img src={lead.agent.avatarUrl} alt={lead.agent.name} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{lead.agent.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-300">
                              <div className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-medium italic">Waiting for assignment</span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <Calendar className="h-3.5 w-3.5 opacity-50" />
                          <span>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-brand-blue hover:bg-brand-blue/5 border border-transparent hover:border-brand-blue/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Details
                          <ExternalLink className="h-3 w-3" />
                        </button>
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
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-l border-gray-100">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <Dialog.Title className="text-lg font-bold text-gray-900">Advanced Filters</Dialog.Title>
                        <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Lead Status</label>
                          <div className="flex flex-wrap gap-2">
                            {["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"].map(val => (
                              <button
                                key={val}
                                onClick={() => updateFilters({ status: statusFilter === val ? null : val })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  statusFilter === val 
                                    ? "bg-brand-blue border-brand-blue text-white shadow-md" 
                                    : "bg-white border-gray-200 text-gray-600 hover:border-brand-blue/30"
                                }`}
                              >
                                {val.charAt(0) + val.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Lead Source</label>
                          <select 
                            value={sourceFilter}
                            onChange={(e) => updateFilters({ source: e.target.value })}
                            className="w-full rounded-lg border-gray-200 text-sm"
                          >
                            <option value="">All Sources</option>
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date Added</label>
                          <div className="flex flex-col gap-2">
                            {["Today", "Last 7 Days", "This Month"].map(d => (
                              <button
                                key={d}
                                onClick={() => updateFilters({ date: dateFilter === d ? null : d })}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                  dateFilter === d 
                                    ? "bg-brand-blue/5 border-brand-blue text-brand-blue" 
                                    : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {d}
                                {dateFilter === d && <Check className="h-4 w-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto p-6 border-t border-gray-100 flex gap-3">
                        <button 
                          onClick={() => router.push(pathname)}
                          className="flex-1 btn btn-secondary"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 btn btn-primary"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Add New Prospect</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">First Name *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border-gray-200 focus:ring-brand-blue focus:border-brand-blue transition-all" 
                  placeholder="e.g. John"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phone Number *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border-gray-200 focus:ring-brand-blue focus:border-brand-blue transition-all" 
                  placeholder="+91 98765 43210"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  className="w-full rounded-xl border-gray-200 focus:ring-brand-blue focus:border-brand-blue transition-all" 
                  placeholder="john@example.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Company Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 focus:ring-brand-blue focus:border-brand-blue transition-all" 
                  placeholder="e.g. Google"
                  value={newLead.company}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lead Source</label>
                <select 
                  className="w-full rounded-xl border-gray-200 focus:ring-brand-blue focus:border-brand-blue transition-all"
                  value={newLead.source}
                  onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                >
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary min-w-[120px]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </div>
                  ) : "Save Prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
