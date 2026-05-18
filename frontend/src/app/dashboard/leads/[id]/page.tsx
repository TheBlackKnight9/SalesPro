"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Phone, Mail, Globe, Calendar, User, 
  MessageSquare, StickyNote, CheckSquare, Clock, 
  ExternalLink, Send, MoreVertical, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import StatusDropdown from "@/components/leads/StatusDropdown";
import CreateQuotationModal from "@/components/quotations/CreateQuotationModal";
import { useToast } from "@/components/ui/Toast";
import { useUser, useUserRole } from "@/store/useAuthStore";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  performedBy: { name: string; avatarUrl?: string | null };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
}

interface LeadDetail {
  id: string;
  firstName: string;
  lastName?: string;
  email: string | null;
  phone: string;
  alternatePhone?: string | null;
  company?: string | null;
  designation?: string | null;
  source: string;
  status: string;
  priority: string;
  budget?: number | null;
  notes?: string | null;
  createdAt: string;
  agent?: { id: string; name: string; avatarUrl?: string | null };
  manager?: { id: string; name: string };
  activities: Activity[];
  tasks: Task[];
  statusHistory: any[];
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const currentUser = useUser();
  const role = useUserRole();

  interface Agent {
    id: string;
    name: string;
    role: string;
  }

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "tasks">("timeline");
  const [noteContent, setNoteContent] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "" });
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
 
  // Quotation Modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
 
  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<LeadDetail>(`/leads/${id}`);
      setLead(data);
      setNoteContent(data.notes || "");
    } catch (error) {
      console.error("Failed to fetch lead details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await apiClient.get<Agent[]>("/users?role=AGENT&limit=100");
      setAgents(data || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };
 
  useEffect(() => {
    if (id) fetchLeadDetails();
  }, [id]);

  useEffect(() => {
    if (role === "SUPER_ADMIN" || role === "MANAGER") {
      fetchAgents();
    }
  }, [role]);

  const handleAssignAgent = async (selectedAgentId: string) => {
    if (!lead) return;
    
    const oldAgent = lead.agent;
    const chosenAgentObj = selectedAgentId 
      ? agents.find(a => a.id === selectedAgentId) 
      : undefined;

    setLead({
      ...lead,
      agent: chosenAgentObj ? { id: chosenAgentObj.id, name: chosenAgentObj.name } : undefined
    });

    try {
      await apiClient.patch(`/leads/${lead.id}`, { assignedToId: selectedAgentId || null });
      showToast("Agent assigned successfully.", "success");
      fetchLeadDetails(); // Silent timeline refresh
    } catch (error) {
      console.error("Failed to assign agent:", error);
      showToast("Failed to assign agent.", "error");
      setLead({ ...lead, agent: oldAgent });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (lead) {
      if (newStatus === "WON") {
        router.push("/dashboard/leads");
        return;
      }
      setLead({ ...lead, status: newStatus });
      fetchLeadDetails(); // Refresh to get the new activity log
    }
  };

  const saveNotes = async () => {
    try {
      await apiClient.put(`/leads/${id}`, { notes: noteContent });
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    setIsTaskSubmitting(true);
    try {
      await apiClient.post(`/leads/${id}/tasks`, newTask);
      setIsTaskModalOpen(false);
      setNewTask({ title: "", description: "", dueDate: "" });
      fetchLeadDetails(); // Refresh tasks and timeline
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!lead) return;
    
    // Optimistic update
    const oldPriority = lead.priority;
    setLead({ ...lead, priority: newPriority });

    try {
      await apiClient.put(`/leads/${id}`, { priority: newPriority });
      // Silent update - refresh timeline to show the change
      fetchLeadDetails();
    } catch (error) {
      console.error("Failed to update priority:", error);
      // Revert on error
      setLead({ ...lead, priority: oldPriority });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent shadow-sm" />
        <p className="text-gray-500 font-medium animate-pulse">Loading Lead Profile...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Lead not found</h2>
        <button onClick={() => router.back()} className="mt-4 btn btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {lead.firstName} {lead.lastName || ""}
              </h1>
              <StatusDropdown 
                leadId={lead.id} 
                currentStatus={lead.status} 
                size="md"
                onStatusChange={handleStatusChange}
              />
            </div>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" />
              Created on {new Date(lead.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary shadow-sm">Edit Profile</button>
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="btn btn-primary shadow-lg shadow-brand-blue/20"
          >
            Generate Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{lead.phone}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Primary</span>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{lead.email}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Email</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Source</span>
                    <p className="text-sm font-bold text-gray-700">{lead.source}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Priority</span>
                    <div className="relative group">
                      <select
                        value={lead.priority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        className={`block w-full px-2 py-1 rounded text-[10px] font-extrabold border-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer appearance-none transition-all ${
                          lead.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
                          lead.priority === 'URGENT' ? 'bg-rose-600 text-white' :
                          lead.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Company</span>
                    <p className="text-sm font-bold text-gray-700 truncate">{lead.company || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Assigned Agent</span>
                    {role === "SUPER_ADMIN" || role === "MANAGER" ? (
                      <div className="relative group">
                        <select
                          value={lead.agent?.id || ""}
                          onChange={(e) => handleAssignAgent(e.target.value)}
                          className="block w-full px-2 py-1 rounded text-[10px] font-extrabold border-none bg-gray-100 text-gray-700 focus:ring-2 focus:ring-brand-blue/20 cursor-pointer appearance-none transition-all"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                          <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-700">{lead.agent?.name || 'Unassigned'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-sm shadow-md shadow-brand-blue/10 hover:brightness-110 transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
                <a 
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md shadow-green-500/10 hover:brightness-110 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Manager Card (Small) */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Account Manager</h4>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <User className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-bold">{lead.manager?.name || 'Global HQ'}</p>
                <p className="text-[10px] text-gray-400 font-medium">Reporting Office</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex items-center gap-8 px-8 border-b border-gray-100">
              {[
                { id: 'timeline', label: 'Activity Timeline', icon: Clock },
                { id: 'notes', label: 'Lead Notes', icon: StickyNote },
                { id: 'tasks', label: 'Follow-up Tasks', icon: CheckSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-5 text-sm font-bold border-b-2 transition-all ${
                    activeTab === tab.id 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {lead.activities.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                        {lead.activities.map((activity, idx) => (
                          <div key={activity.id} className="relative">
                            <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white ${
                              idx === 0 ? 'bg-brand-blue scale-125' : 'bg-gray-300'
                            }`} />
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-2 w-2 text-gray-500" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">By {activity.performedBy.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <textarea 
                      className="w-full h-64 p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none text-gray-700 leading-relaxed font-medium"
                      placeholder="Type important details about this prospect..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={saveNotes}
                        className="btn btn-primary px-8"
                      >
                        Save Notes
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tasks' && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900">Pending Follow-ups</h3>
                      <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
                      >
                        <Plus className="h-3 w-3" />
                        Add New Task
                      </button>
                    </div>
                    {lead.tasks.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-400">No pending tasks for this lead.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lead.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-brand-blue/20 transition-all shadow-sm group">
                            <button className="h-5 w-5 rounded border border-gray-300 flex items-center justify-center hover:border-brand-blue">
                              <CheckSquare className="h-3 w-3 text-white opacity-0 group-hover:opacity-10" />
                            </button>
                            <div className="flex-1">
                              <h5 className="text-sm font-bold text-gray-800">{task.title}</h5>
                              {task.dueDate && (
                                <p className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1 mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <button className="text-gray-300 hover:text-gray-500 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Add Follow-up Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-lg">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Title *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-2xl border-gray-200 focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium" 
                  placeholder="e.g. Call for requirement update"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  className="w-full rounded-2xl border-gray-200 focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium h-24" 
                  placeholder="Additional details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-2xl border-gray-200 focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button type="button" className="btn btn-ghost px-6" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-8 shadow-lg shadow-brand-blue/20" disabled={isTaskSubmitting}>
                  {isTaskSubmitting ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quotation Modal */}
      {isQuoteModalOpen && (
        <CreateQuotationModal 
          isOpen={isQuoteModalOpen} 
          onClose={() => setIsQuoteModalOpen(false)} 
          onSuccess={() => {
            setIsQuoteModalOpen(false);
            fetchLeadDetails(); // Refresh timeline to show new quotation activity
          }}
          preselectedLeadId={lead.id}
        />
      )}
    </div>
  );
}
