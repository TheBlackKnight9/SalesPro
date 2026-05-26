"use client";

import { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  User, 
  Briefcase, 
  CheckCircle2, 
  X,
  AlertCircle,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useUser, useUserRole } from "@/store/useAuthStore";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedToId: string;
  assignedTo?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role?: "SUPER_ADMIN" | "MANAGER" | "AGENT";
  };
  linkedLead?: {
    id: string;
    firstName: string;
    lastName?: string;
  };
  linkedCustomer?: {
    id: string;
    firstName: string;
    lastName?: string;
  };
}

export default function TasksPage() {
  const user = useUser();
  const role = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PEND' | 'PROG' | 'DONE'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'SELF' | 'AGENT' | 'MANAGER'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT'>('ALL');

  // ── Data Fetching ───────────────────────────
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Task[]>("/tasks");
      setTasks(data || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ── Actions ──────────────────────────────────
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      
      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

      // Premium Toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-[265px] w-full bg-slate-900/95 border border-white/10 shadow-2xl rounded-xl pointer-events-auto flex items-center p-2 backdrop-blur`}
        >
          <div className="flex-1 w-0 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-7 w-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-[12px] font-bold text-emerald-100 truncate">Task Updated</p>
              <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400 truncate">
                Status changed to {newStatus.replace('_', ' ')}.
              </p>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0 flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ), { position: "bottom-right" });

    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      
      // Optimistic State Update: remove deleted task immediately from state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  // ── Helpers ──────────────────────────────────
  const isOverdue = (date: string | null, status: string) => {
    if (!date || status === "COMPLETED") return false;
    return new Date(date) < new Date();
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "HIGH":
      case "URGENT":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "MEDIUM":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "LOW":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const filteredTasks = tasks.filter(task => {
    // 1. Status Filter
    let matchesStatus = false;
    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else if (statusFilter === 'PEND' && task.status === 'PENDING') {
      matchesStatus = true;
    } else if (statusFilter === 'PROG' && task.status === 'IN_PROGRESS') {
      matchesStatus = true;
    } else if (statusFilter === 'DONE' && task.status === 'COMPLETED') {
      matchesStatus = true;
    }

    // 2. Priority Filter
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    // 3. Assignment Filter (For Admin/Manager)
    let matchesAssignment = true;
    if (role === 'MANAGER' || role === 'SUPER_ADMIN') {
      if (assignmentFilter === 'SELF') {
        matchesAssignment = task.assignedToId === user?.id;
      } else if (assignmentFilter === 'AGENT') {
        matchesAssignment = task.assignedTo?.role === 'AGENT';
      } else if (assignmentFilter === 'MANAGER') {
        matchesAssignment = task.assignedTo?.role === 'MANAGER';
      }
    }

    return matchesStatus && matchesPriority && matchesAssignment;
  });

  const renderTaskTable = (taskList: Task[]) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-gray-50/30 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
            <tr>
              <th className={`${(role === 'MANAGER' || role === 'SUPER_ADMIN') ? 'w-[25%]' : 'w-[40%]'} px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider`}>Details</th>
              <th className="w-[15%] px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Priority</th>
              <th className="w-[20%] px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Related To</th>
              <th className="w-[10%] px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Due</th>
              {(role === "MANAGER" || role === "SUPER_ADMIN") && (
                <th className="w-[15%] px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Assigned To</th>
              )}
              <th className="w-[15%] px-3 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {taskList.length === 0 ? (
              <tr>
                <td colSpan={(role === "MANAGER" || role === "SUPER_ADMIN") ? 6 : 5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No tasks found matching the criteria.
                </td>
              </tr>
            ) : (
              taskList.map((task) => {
                const isReadOnly = task.status === "COMPLETED";
                return (
                  <tr key={task.id} className={`${isReadOnly ? "bg-gray-50/20 dark:bg-slate-900/10" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/30"} transition-colors group`}>
                    {/* DETAILS */}
                    <td className="px-3 py-[7px] relative group cursor-pointer">
                      <div className="flex flex-col overflow-hidden">
                        <span className={`font-medium text-[13px] truncate ${isReadOnly ? "line-through text-slate-500 dark:text-slate-400" : "text-gray-900 dark:text-white"}`}>
                          {task.title}
                        </span>
                      </div>

                      {/* Smooth White/Dark Floating Window (Tooltip) */}
                      <div className="absolute z-50 left-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 ease-out">
                        <p className="font-semibold text-sm mb-1">{task.title}</p>
                        {task.description ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{task.description}</p>
                        ) : (
                          <span className="italic text-[11px] text-slate-400 dark:text-slate-500">No description provided.</span>
                        )}
                      </div>
                    </td>

                    {/* PRIORITY */}
                    <td className="px-3 py-[7px]">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${isReadOnly ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700" : getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* RELATED TO */}
                    <td className="px-3 py-[7px]">
                      {task.linkedLead ? (
                        <div className="flex flex-col opacity-80 overflow-hidden">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-slate-300 truncate">{task.linkedLead.firstName}</span>
                          <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Lead</span>
                        </div>
                      ) : task.linkedCustomer ? (
                        <div className="flex flex-col opacity-80 overflow-hidden">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-slate-300 truncate">{task.linkedCustomer.firstName}</span>
                          <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Client</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 italic font-medium">None</span>
                      )}
                    </td>

                    {/* DUE */}
                    <td className="px-3 py-[7px]">
                      <span className={`text-[11px] font-medium ${isOverdue(task.dueDate, task.status) ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-slate-400"}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                      </span>
                    </td>

                    {/* ASSIGNED TO */}
                    {(role === "MANAGER" || role === "SUPER_ADMIN") && (
                      <td className="px-3 py-[7px]">
                        {task.assignedToId === user?.id ? (
                          <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Self</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-gray-700 dark:text-slate-200">{task.assignedTo?.name || "Unassigned"}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{task.assignedTo?.role?.toLowerCase() || 'Agent'}</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* STATUS */}
                    <td className="px-3 py-[7px] flex items-center justify-start gap-3">
                      {isReadOnly ? (
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </div>
                      ) : (
                        <select 
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="bg-transparent border-none p-0 text-[10px] font-bold text-gray-700 dark:text-slate-300 focus:ring-0 cursor-pointer hover:text-indigo-500 transition-colors uppercase tracking-wider h-6 flex items-center"
                        >
                          <option value="PENDING" className="dark:bg-slate-900">PEND</option>
                          <option value="IN_PROGRESS" className="dark:bg-slate-900">PROG</option>
                          <option value="COMPLETED" className="dark:bg-slate-900">DONE</option>
                        </select>
                      )}
                      <button
                        onClick={() => setTaskToDelete(task.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded transition-colors flex-shrink-0"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 px-4 py-2 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mission Control</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 font-medium">Coordinate, assign, and execute your sales agenda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary shadow-lg shadow-brand-blue/20 px-6"
        >
          + Assign Task
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-blue border-t-transparent" />
          <span className="text-sm font-medium text-gray-500 animate-pulse font-bold tracking-widest uppercase">Syncing Agenda...</span>
        </div>
      ) : (
        <div className="space-y-6 w-full max-w-7xl">
          {/* Top Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-full">
            {/* Left Side (Status Tabs & Priority Select) */}
            <div className="flex items-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('PEND')}
                  className={`${statusFilter === 'PEND' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('PROG')}
                  className={`${statusFilter === 'PROG' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('DONE')}
                  className={`${statusFilter === 'DONE' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  Completed
                </button>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5 ml-2.5">
                <button
                  onClick={() => setPriorityFilter('ALL')}
                  className={`${priorityFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  All Priorities
                </button>
                <button
                  onClick={() => setPriorityFilter('URGENT')}
                  className={`${priorityFilter === 'URGENT' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  Urgent
                </button>
                <button
                  onClick={() => setPriorityFilter('HIGH')}
                  className={`${priorityFilter === 'HIGH' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  High
                </button>
                <button
                  onClick={() => setPriorityFilter('MEDIUM')}
                  className={`${priorityFilter === 'MEDIUM' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setPriorityFilter('LOW')}
                  className={`${priorityFilter === 'LOW' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'} text-[11px] font-semibold px-2.5 py-1 transition-all`}
                >
                  Low
                </button>
              </div>
            </div>

            {/* Right Side (Conditional Assignment Dropdown) */}
            {(role === 'MANAGER' || role === 'SUPER_ADMIN') && (
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] rounded-lg px-2 py-1 outline-none shadow-sm font-semibold focus:ring-1 focus:ring-brand-blue/20 cursor-pointer h-8"
              >
                <option value="ALL">All Tasks</option>
                <option value="SELF">Assigned to Self</option>
                <option value="AGENT">Assigned to Agents</option>
                {role === 'SUPER_ADMIN' && <option value="MANAGER">Assigned to Managers</option>}
              </select>
            )}
          </div>

          {/* Unified Table */}
          {renderTaskTable(filteredTasks)}
        </div>
      )}

      <CreateTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Task</h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTaskToDelete(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDeleteTask(taskToDelete); // Your existing API call + Optimistic UI update here
                  setTaskToDelete(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
