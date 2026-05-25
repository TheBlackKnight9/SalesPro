"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Phone, Mail, Globe, Calendar, User, 
  MessageSquare, StickyNote, CheckSquare, Clock, 
  ExternalLink, Send, MoreVertical, Plus, Paperclip, File as FileIcon, X, Loader2, Mic, Square
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
  priority?: string | null;
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

interface Attachment {
  url: string;
  name: string;
  type: string;
  key?: string;
}

function AttachmentCard({ att }: { att: Attachment }) {
  const [viewUrl, setViewUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSignedUrl = async () => {
      try {
        let key = att.key;
        if (!key) {
          const notesIdx = att.url.indexOf("/notes/");
          if (notesIdx !== -1) {
            key = att.url.substring(notesIdx + 1);
          } else {
            const parsed = new URL(att.url);
            key = parsed.pathname.substring(1);
          }
        }

        const res = await fetch(`/api/upload/s3?key=${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) {
          setViewUrl(data.viewUrl);
        }
      } catch {
        if (active) {
          setViewUrl(att.url); // fallback
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSignedUrl();
    return () => {
      active = false;
    };
  }, [att]);

  if (loading) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl h-24 w-full flex items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Loading Attachment...</span>
      </div>
    );
  }

  const name = att.name?.toLowerCase() || '';
  const isImage = att.type.startsWith("image/") || att.type.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name);
  const isAudio = att.type.startsWith("audio/") || att.type.includes("audio") || /\.(webm|mp3|ogg|wav|m4a|aac)$/.test(name);
  const isVideo = att.type.startsWith("video/") || att.type.includes("video") || /\.(mp4|mov|avi|mkv)$/.test(name);

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow group relative h-24">
      {isImage ? (
        <a 
          href={viewUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block h-full w-full relative group overflow-hidden"
        >
          <img
            src={viewUrl}
            alt={att.name || "Attachment"}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </a>
      ) : isAudio ? (
        <div className="p-2.5 flex flex-col justify-between h-full">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wider">{att.name}</span>
          <audio src={viewUrl} controls className="w-full mt-1 h-8 max-w-full" />
        </div>
      ) : isVideo ? (
        <div className="h-full w-full relative bg-black">
          <video src={viewUrl} controls className="h-full w-full object-contain" />
        </div>
      ) : (
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 flex items-center gap-2.5 h-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <FileIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{att.name}</p>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Download File</p>
          </div>
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskRow — Interactive task item with status toggle
// ---------------------------------------------------------------------------
interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    dueDate?: string | null;
    priority?: string | null;
  };
  onToggle: () => Promise<void>;
}

function TaskRow({ task, onToggle }: TaskRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = task.status === 'COMPLETED';

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border rounded-2xl transition-all shadow-sm ${isCompleted ? 'border-green-200 dark:border-green-900/30 bg-green-50/10 dark:bg-green-950/10' : 'border-slate-200/60 dark:border-slate-800 hover:border-brand-blue/20'}`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={`h-5 w-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-blue dark:hover:border-brand-blue'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isUpdating ? (
          <Loader2 className="h-3 w-3 text-white dark:text-slate-350 animate-spin" />
        ) : isCompleted ? (
          <CheckSquare className="h-3 w-3 text-white" />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h5 className={`text-sm transition-all ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-800 dark:text-slate-200 font-semibold'}`}>
          {task.title}
        </h5>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.dueDate && (
            <p className={`text-[11px] font-semibold uppercase flex items-center gap-1 ${isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-rose-500 dark:text-rose-400'}`}>
              <Calendar className="h-3 w-3" />
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          {task.priority && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
              task.priority === 'URGENT' ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' :
              task.priority === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' :
              task.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400' :
              'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450'
            }`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {isCompleted && (
        <span className="text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
          Done
        </span>
      )}
    </div>
  );
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
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Edit Profile modal and form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    company: "",
    designation: "",
    source: "",
    priority: "",
    budget: "",
    notes: ""
  });

  const handleOpenEditModal = () => {
    if (!lead) return;
    setEditForm({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      alternatePhone: lead.alternatePhone || "",
      company: lead.company || "",
      designation: lead.designation || "",
      source: lead.source || "OTHER",
      priority: lead.priority || "MEDIUM",
      budget: lead.budget ? String(lead.budget) : "",
      notes: lead.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setIsSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        budget: editForm.budget ? Number(editForm.budget) : null,
      };
      await apiClient.put(`/leads/${id}`, payload);
      showToast("Profile updated successfully.", "success");
      setIsEditModalOpen(false);
      fetchLeadDetails(); // refresh leads data on UI
    } catch (error: any) {
      console.error("Failed to update lead profile:", error);
      showToast(error.message || "Failed to update profile.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);

      // timeslice of 100ms ensures ondataavailable fires continuously
      // so all chunks are populated BEFORE onstop is triggered
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      showToast("Could not access microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      setIsRecordModalOpen(false);
      return;
    }

    // Set onstop BEFORE calling stop() to guarantee it is registered
    // when the browser fires the event after flushing the final chunk
    recorder.onstop = () => {
      const chunks = audioChunksRef.current;
      console.log('[VoiceNote] onstop fired, chunks collected:', chunks.length);
      if (chunks.length === 0) {
        showToast("Recording was empty. Please try again.", "error");
        setIsRecording(false);
        setIsRecordModalOpen(false);
        return;
      }
      // Strip codec params (e.g. "audio/webm;codecs=opus" → "audio/webm")
      // so S3 Content-Type and DB entries are clean and browser-playable
      const rawMime = recorder.mimeType || 'audio/webm';
      const cleanMime = rawMime.split(';')[0].trim();
      const ext = cleanMime.includes('ogg') ? 'ogg' : 'webm';
      const audioBlob = new Blob(chunks, { type: cleanMime });
      const audioFile = new window.File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: cleanMime });
      console.log('[VoiceNote] File created:', audioFile.name, audioFile.size, 'bytes', cleanMime);

      setPendingAttachments(prev => [...prev, audioFile]);

      if (recorder.stream) {
        recorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setIsRecordModalOpen(false);
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setIsRecordModalOpen(false);
      };
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setIsRecordModalOpen(false);
    }
  };
  
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

  const parsedNotes = useMemo(() => {
    if (!lead?.notes) return [];
    try {
      const parsed = JSON.parse(lead.notes);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [{
        id: "legacy",
        text: lead.notes,
        authorName: "System",
        createdAt: lead.createdAt || new Date().toISOString()
      }];
    }
    return [];
  }, [lead?.notes]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !lead) return;

    setIsUploading(true);
    const uploadedAttachments: Array<{ url: string; name: string; type: string }> = [];

    try {
      // Step 1 & 2: Loop through pending attachments and upload directly to S3 via pre-signed URLs
      for (const file of pendingAttachments) {
        const res = await fetch("/api/upload/s3", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to generate upload URL for ${file.name}`);
        }

        const { uploadUrl, fileUrl } = await res.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name} to S3`);
        }

        uploadedAttachments.push({
          url: fileUrl,
          name: file.name,
          type: file.type,
        });
      }

      const newNote = {
        id: Math.random().toString(36).substr(2, 9),
        text: newNoteText,
        authorName: currentUser?.name || "System",
        createdAt: new Date().toISOString(),
        attachments: uploadedAttachments,
      };

      const updatedNotesList = [newNote, ...parsedNotes];
      const notesJson = JSON.stringify(updatedNotesList);

      await apiClient.put(`/leads/${id}`, { notes: notesJson });
      showToast("Note added successfully.", "success");
      setNewNoteText("");
      setPendingAttachments([]);
      setIsAddingNote(false);
      fetchLeadDetails(); // Hot reload details
      router.refresh();   // Sync Next.js Server Components cache
    } catch (error: any) {
      console.error("Failed to save note:", error);
      showToast(error.message || "Failed to save note.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    setIsTaskSubmitting(true);
    try {
      await apiClient.post("/tasks", {
        ...newTask,
        linkedLeadId: id,
      });
      showToast("Task added successfully.", "success");
      setIsTaskModalOpen(false);
      setNewTask({ title: "", description: "", dueDate: "" });
      fetchLeadDetails(); // Refresh tasks and timeline
    } catch (error) {
      console.error("Failed to add task:", error);
      showToast("Failed to add task.", "error");
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
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                {lead.firstName} {lead.lastName || ""}
              </h1>
              <StatusDropdown 
                leadId={lead.id} 
                currentStatus={lead.status} 
                size="md"
                onStatusChange={handleStatusChange}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              Created on {new Date(lead.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleOpenEditModal}
            className="btn btn-secondary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750 shadow-sm text-xs h-9"
          >
            Edit Profile
          </button>
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="btn btn-primary shadow-sm hover:shadow active:scale-95 transition-all h-9 text-xs"
          >
            Generate Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-brand-blue dark:text-brand-blue/90">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{lead.phone}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider mt-0.5">Primary</span>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{lead.email}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider mt-0.5">Email</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Source</span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lead.source}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Priority</span>
                    <div className="relative group">
                      <select
                        value={lead.priority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        className={`block w-full px-2 py-1 rounded text-[11px] font-bold border-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer appearance-none transition-all ${
                          lead.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-950/30 text-red-750 dark:text-red-400' : 
                          lead.priority === 'URGENT' ? 'bg-rose-600 dark:bg-rose-900 text-white' :
                          lead.priority === 'MEDIUM' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <option value="LOW" className="dark:bg-slate-900">LOW</option>
                        <option value="MEDIUM" className="dark:bg-slate-900">MEDIUM</option>
                        <option value="HIGH" className="dark:bg-slate-900">HIGH</option>
                        <option value="URGENT" className="dark:bg-slate-900">URGENT</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Company</span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{lead.company || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Assigned Agent</span>
                    {role === "SUPER_ADMIN" || role === "MANAGER" ? (
                      <div className="relative group">
                        <select
                          value={lead.agent?.id || ""}
                          onChange={(e) => handleAssignAgent(e.target.value)}
                          className="block w-full px-2 py-1 rounded text-[11px] font-bold border-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-blue/20 cursor-pointer appearance-none transition-all"
                        >
                          <option value="" className="dark:bg-slate-900">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id} className="dark:bg-slate-900">
                              {agent.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                          <svg className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lead.agent?.name || 'Unassigned'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-sm shadow-md shadow-brand-blue/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
                <a 
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md shadow-green-500/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Manager Card (Small) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-6 text-white shadow-xl border dark:border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Account Manager</h4>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <User className="h-5 w-5 text-gray-300 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold">{lead.manager?.name || 'Global HQ'}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">Reporting Office</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col h-full min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex items-center gap-8 px-8 border-b border-slate-100 dark:border-slate-800">
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
                    : "border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
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
                      <div className="text-center py-10 text-slate-400 dark:text-slate-550">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                        {lead.activities.map((activity, idx) => (
                          <div key={activity.id} className="relative">
                            <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                              idx === 0 ? 'bg-brand-blue scale-125' : 'bg-slate-350 dark:bg-slate-700'
                            }`} />
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-100">{activity.title}</h4>
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-medium">{activity.description}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <User className="h-2 w-2 text-slate-500 dark:text-slate-400" />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-550 dark:text-slate-400">By {activity.performedBy.name}</span>
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
                    {/* Add Note Button / Input Area */}
                    {!isAddingNote ? (
                      <button
                        onClick={() => setIsAddingNote(true)}
                        className="w-full py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all font-bold text-sm flex items-center justify-center gap-2 bg-gray-50/50"
                      >
                        <Plus className="h-4 w-4" />
                        Add Note
                      </button>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <textarea
                          rows={3}
                          disabled={isUploading}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none text-slate-850 dark:text-white leading-relaxed font-medium text-sm resize-none disabled:opacity-60"
                          placeholder="Type important details about this prospect..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                        />
                        
                        {/* File Input & Paperclip Button */}
                        <div className="space-y-2">
                          <input
                            type="file"
                            multiple
                            id="lead-note-file-input"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                setPendingAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById("lead-note-file-input")?.click()}
                              disabled={isUploading || isRecording}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
                            >
                              <Paperclip className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              Attach Files
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRecordModalOpen(true)}
                              disabled={isUploading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
                            >
                              <Mic className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              Voice Note
                            </button>
                          </div>
                          
                          {/* Pending Attachments List */}
                          {pendingAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {pendingAttachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-600 dark:text-slate-350 font-medium">
                                  <FileIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
 
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => {
                              setIsAddingNote(false);
                              setNewNoteText("");
                              setPendingAttachments([]);
                            }}
                            className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isUploading || !newNoteText.trim()}
                            onClick={handleSaveNote}
                            className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 min-w-[120px] justify-center"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Note"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
 
                    {/* Notes Feed */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {parsedNotes.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800">
                          <StickyNote className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          No notes added yet.
                        </div>
                      ) : (
                        parsedNotes.map((note) => (
                          <div key={note.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/60 rounded-2xl p-4 shadow-sm hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                            <p className="text-sm text-slate-750 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">{note.text}</p>
                            
                            {/* Attachments Section */}
                            {note.attachments && note.attachments.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {note.attachments.map((att: { url: string; name: string; type: string }, aIdx: number) => (
                                  <AttachmentCard key={aIdx} att={att} />
                                ))}
                              </div>
                            )}
 
                            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                {note.authorName || 'System'}
                              </span>
                              <span>{formatDate(note.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
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
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Pending Follow-ups</h3>
                      <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline transition-all"
                      >
                        <Plus className="h-3 w-3" />
                        Add New Task
                      </button>
                    </div>
                    {lead.tasks.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-slate-350 dark:text-slate-600" />
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-550">No pending tasks for this lead.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lead.tasks.map(task => {
                          const isCompleted = task.status === 'COMPLETED';
                          return (
                            <TaskRow
                              key={task.id}
                              task={task}
                              onToggle={async () => {
                                const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
                                try {
                                  await apiClient.patch(`/tasks/${task.id}/status`, { status: newStatus });
                                  showToast(`Task marked as ${newStatus.toLowerCase()}`, 'success');
                                  router.refresh();
                                  fetchLeadDetails();
                                } catch {
                                  showToast('Failed to update task', 'error');
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Follow-up Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-400 transition-colors text-lg">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Task Title *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium" 
                  placeholder="e.g. Call for requirement update"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Description</label>
                <textarea 
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium h-24 resize-none" 
                  placeholder="Additional details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Due Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button type="button" className="btn btn-ghost px-6 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-brand-blue/20" disabled={isTaskSubmitting}>
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

      {/* Voice Record Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Record Voice Note</h3>
            
            <div className="flex flex-col items-center justify-center mb-8">
              {isRecording ? (
                <>
                  <div className="h-20 w-20 bg-red-50 dark:bg-red-950/30 border border-red-105 dark:border-red-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Mic className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-650 dark:text-red-400 font-semibold text-sm animate-pulse mb-1">Recording in progress...</p>
                  <p className="text-slate-655 dark:text-slate-350 font-mono text-xl font-semibold">{formatDuration(recordingDuration)}</p>
                </>
              ) : (
                <>
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Mic className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Ready to record</p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <>
                  <button 
                    onClick={() => setIsRecordModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={startRecording}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-brand-blue hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
                  >
                    Start Recording
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={cancelRecording}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={stopRecording}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-red-655 hover:bg-red-750 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    Stop & Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in duration-200"
          >
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Lead Profile</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-450 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-350 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditProfileSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-550 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Alternate Phone</label>
                  <input 
                    type="tel" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.alternatePhone}
                    onChange={(e) => setEditForm({...editForm, alternatePhone: e.target.value})}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Company</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-550 uppercase tracking-wider">Designation</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.designation}
                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Source</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.source}
                    onChange={(e) => setEditForm({...editForm, source: e.target.value})}
                  >
                    <option value="WEBSITE" className="dark:bg-slate-900">WEBSITE</option>
                    <option value="REFERRAL" className="dark:bg-slate-900">REFERRAL</option>
                    <option value="SOCIAL_MEDIA" className="dark:bg-slate-900">SOCIAL_MEDIA</option>
                    <option value="COLD_CALL" className="dark:bg-slate-900">COLD_CALL</option>
                    <option value="OTHER" className="dark:bg-slate-900">OTHER</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-550 uppercase tracking-wider">Budget (INR)</label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.budget}
                    onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-blue/20 transition-all flex items-center justify-center min-w-[120px]"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
