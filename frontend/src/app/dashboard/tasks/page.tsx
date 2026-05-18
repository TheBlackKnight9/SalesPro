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
  MoreHorizontal
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
          } max-w-[350px] w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] pointer-events-auto flex ring-1 ring-black/5 rounded-[20px] p-4`}
        >
          <div className="flex-1 w-0 flex items-center">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 bg-emerald-50 rounded-[14px] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-bold text-gray-900">Task Updated</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                Status successfully changed to {newStatus.replace('_', ' ')}.
              </p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ), { position: "bottom-right" });

    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update status");
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

  const personalTasks = tasks.filter(t => t.assignedToId === user?.id);
  const teamTasks = tasks.filter(t => t.assignedToId !== user?.id);

  const renderTaskTable = (taskList: Task[], isReadOnly: boolean = false, showAssignee: boolean = false) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
            <tr>
              <th className="w-[45%] px-3 py-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Details</th>
              <th className="w-[20%] px-3 py-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Relates</th>
              <th className="w-[15%] px-3 py-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Due</th>
              <th className="w-[20%] px-3 py-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {taskList.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <p className="text-xs text-gray-500 italic font-medium">No records.</p>
                </td>
              </tr>
            ) : (
              taskList.map((task) => (
                <tr key={task.id} className={`${isReadOnly ? "bg-gray-50/30" : "hover:bg-gray-50/50"} transition-colors group`}>
                  <td className="px-3 py-2.5 relative group cursor-pointer">
                    <div className="flex flex-col overflow-hidden">
                      <span className={`font-bold text-sm truncate ${isReadOnly ? "line-through text-slate-500" : "text-gray-900 dark:text-white"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isReadOnly ? "bg-gray-100 text-gray-400 border-gray-200" : getPriorityStyles(task.priority)}`}>
                          {task.priority}
                        </span>
                        {showAssignee && task.assignedTo && (
                          <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded flex items-center gap-1 truncate max-w-[80px]">
                            <User className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{task.assignedTo.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Smooth White Floating Window (Tooltip) */}
                    <div className="absolute z-50 left-0 top-full mt-2 w-52 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 ease-out">
                      <p className="font-semibold text-sm mb-1">{task.title}</p>
                      {task.description ? (
                        <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                      ) : (
                        <span className="italic text-[10px] text-slate-400">No description provided.</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {task.linkedLead ? (
                      <div className="flex flex-col opacity-80 overflow-hidden">
                        <span className="text-[13px] font-bold text-gray-700 truncate">{task.linkedLead.firstName}</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Lead</span>
                      </div>
                    ) : task.linkedCustomer ? (
                      <div className="flex flex-col opacity-80 overflow-hidden">
                        <span className="text-[13px] font-bold text-gray-700 truncate">{task.linkedCustomer.firstName}</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Client</span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[13px] font-bold ${isOverdue(task.dueDate, task.status) ? "text-rose-600" : "text-gray-500"}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isReadOnly ? (
                      <div className="text-emerald-600 font-bold text-[11px] uppercase tracking-tighter flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </div>
                    ) : (
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="bg-transparent border-none p-0 text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer hover:text-brand-blue transition-colors uppercase tracking-tight"
                      >
                        <option value="PENDING">PEND</option>
                        <option value="IN_PROGRESS">PROG</option>
                        <option value="COMPLETED">DONE</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSection = (title: string, taskList: Task[], glowColor: string) => {
    const active = taskList.filter(t => t.status !== "COMPLETED");
    const completed = taskList.filter(t => t.status === "COMPLETED");

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-2 px-2">
          <div className={`h-2 w-2 rounded-full ${glowColor} shadow-[0_0_8px_rgba(37,99,235,0.6)]`} />
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">{title}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-tight px-2">Pending / In-Progress</h3>
            {renderTaskTable(active, false, title.includes("Team"))}
          </div>
          
          <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-tight px-2">Completed</h3>
            {renderTaskTable(completed, true, title.includes("Team"))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mission Control</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Coordinate, assign, and execute your sales agenda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary shadow-lg shadow-brand-blue/20 px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-blue border-t-transparent" />
          <span className="text-sm font-medium text-gray-500 animate-pulse font-bold tracking-widest uppercase">Syncing Agenda...</span>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${role !== "AGENT" ? "lg:grid-cols-2" : ""} gap-10`}>
          {/* Left Column: Personal Tasks */}
          {renderSection("My Personal Tasks", personalTasks, "bg-brand-blue")}

          {/* Right Column: Team Tasks (Managers/Admins only) */}
          {(role === "MANAGER" || role === "SUPER_ADMIN") && (
            renderSection("Team Overview & Pipeline", teamTasks, "bg-indigo-500")
          )}
        </div>
      )}

      <CreateTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
