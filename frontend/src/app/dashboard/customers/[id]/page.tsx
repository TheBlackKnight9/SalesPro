"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CreditCard, 
  History, 
  User, 
  ExternalLink,
  Save,
  MessageSquare,
  IndianRupee,
  Plus,
  StickyNote,
  Paperclip,
  File as FileIcon,
  X,
  Loader2,
  Mic,
  Square
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/store/useAuthStore";

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName?: string;
  email: string | null;
  phone: string;
  company?: string;
  designation?: string;
  totalRevenue: string;
  notes: string | null;
  conversionNote: string | null;
  createdAt: string;
  office?: { name: string };
  quotations: Array<{
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
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

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const currentUser = useUser();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "notes">("history");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Edit Profile modal and form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleOpenEditModal = () => {
    if (!customer) return;
    setEditForm({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      designation: customer.designation || "",
      gstNumber: (customer as any).gstNumber || "",
      address: (customer as any).address || "",
      city: (customer as any).city || "",
      state: (customer as any).state || "",
      pincode: (customer as any).pincode || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setIsSavingEdit(true);
    try {
      const updatedData = await apiClient.put<CustomerDetail>(`/customers/${id}`, editForm);
      setCustomer(updatedData);
      setIsEditModalOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to update customer profile:", error);
      alert(error.message || "Failed to update profile.");
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
      alert("Could not access microphone.");
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
        alert("Recording was empty. Please try again.");
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

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get<CustomerDetail>(`/customers/${id}`);
        setCustomer(data);
      } catch (error) {
        console.error("Failed to fetch customer details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id]);

  const parsedNotes = useMemo(() => {
    if (!customer?.notes) return [];
    try {
      const parsed = JSON.parse(customer.notes);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [{
        id: "legacy",
        text: customer.notes,
        authorName: "System",
        createdAt: customer.createdAt || new Date().toISOString()
      }];
    }
    return [];
  }, [customer?.notes]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !customer) return;

    setIsSavingNotes(true);
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

      await apiClient.patch(`/customers/${id}`, { notes: notesJson });
      setNewNoteText("");
      setPendingAttachments([]);
      setIsAddingNote(false);
      
      // Local state update
      setCustomer({ ...customer, notes: notesJson });
      router.refresh(); // Sync Server Components cache
    } catch (error: any) {
      console.error("Failed to save note:", error);
      alert(error.message || "Failed to save note.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin shadow-sm" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-lg font-semibold text-slate-800 dark:text-white">Customer not found</p>
        <Button onClick={() => router.push("/dashboard/customers")} variant="secondary">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard/customers")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
              {customer.firstName} {customer.lastName || ''}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Customer ID: {customer.id.slice(-8)}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/10 dark:border-brand-blue/20 rounded-2xl px-5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0">
          <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
            <IndianRupee className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-brand-blue uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">₹{Number(customer.totalRevenue).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-850 dark:text-white uppercase tracking-wider">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-450 dark:text-slate-550 font-semibold uppercase tracking-wider">Company</label>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {customer.company || "Individual Client"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-450 dark:text-slate-550 font-semibold uppercase tracking-wider">Phone</label>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {customer.phone}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-450 dark:text-slate-550 font-semibold uppercase tracking-wider">Email</label>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {customer.email || "No email provided"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-450 dark:text-slate-550 font-semibold uppercase tracking-wider">Assigned Office</label>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {customer.office?.name || "Global Office"}
                </div>
              </div>

              {customer.conversionNote && (
                <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] text-brand-blue uppercase tracking-widest">Conversion Note</label>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "{customer.conversionNote}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button className="w-full text-xs h-9" variant="secondary" onClick={handleOpenEditModal}>
                Edit Profile
              </Button>
            </div>
          </div>
        </div>        {/* Right Column: Tabs & Workspace */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
              <button 
                onClick={() => setActiveTab("history")}
                className={`py-4 px-2 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "history" 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Purchase History
              </button>
              <button 
                onClick={() => setActiveTab("notes")}
                className={`py-4 px-2 ml-8 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "notes" 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-slate-455 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-355"
                }`}
              >
                Client Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6">
              {activeTab === "history" ? (
                <div className="space-y-6">
                  {customer.quotations.length === 0 && customer.invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-550 space-y-3">
                      <History className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No transaction history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customer.quotations.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 hover:border-brand-blue/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800">
                              <FileText className="h-5 w-5 text-slate-400 dark:text-slate-550" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Quotation #{q.id.slice(-6)}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">₹{Number(q.totalAmount).toLocaleString('en-IN')}</p>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${
                                q.status === "ACCEPTED" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450" : "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-450"
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            <button className="p-1.5 rounded-lg text-slate-300 dark:text-slate-655 hover:text-brand-blue dark:hover:text-brand-blue/90 hover:bg-brand-blue/5 transition-all">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-4">
                  {/* Add Note Button / Input Area */}
                  {!isAddingNote ? (
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="w-full py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all font-semibold text-sm flex items-center justify-center gap-2 bg-gray-50/50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </button>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                      <textarea
                        rows={3}
                        disabled={isSavingNotes}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none text-slate-850 dark:text-white leading-relaxed font-medium text-sm resize-none disabled:opacity-60"
                        placeholder="Type important details about this client..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      
                      {/* File Input & Paperclip Button */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          multiple
                          id="customer-note-file-input"
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
                            onClick={() => document.getElementById("customer-note-file-input")?.click()}
                            disabled={isSavingNotes || isRecording}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                            Attach Files
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRecordModalOpen(true)}
                            disabled={isSavingNotes}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
                          >
                            <Mic className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
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
                                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
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
                          disabled={isSavingNotes}
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteText("");
                            setPendingAttachments([]);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingNotes || !newNoteText.trim()}
                          onClick={handleSaveNote}
                          className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 min-w-[120px] justify-center"
                        >
                          {isSavingNotes ? (
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
                      <div className="text-center py-10 text-slate-400 dark:text-slate-550 text-sm bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800">
                        <StickyNote className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-655" />
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <p className="text-red-600 dark:text-red-400 font-semibold text-sm animate-pulse mb-1">Recording in progress...</p>
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
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
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

      {/* Edit Customer Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Customer Profile</h3>
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
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-555 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Company</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-555 uppercase tracking-wider">Designation</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.designation}
                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  />
                </div>

                {/* Billing details heading separator */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Billing & Tax Details</h4>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">GST Number</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium uppercase placeholder:normal-case" 
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    value={editForm.gstNumber}
                    onChange={(e) => setEditForm({...editForm, gstNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Billing Address</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">City</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-555 uppercase tracking-wider">State</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.state}
                    onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-455 dark:text-slate-550 uppercase tracking-wider">Pincode</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all py-2.5 px-3.5 text-sm font-medium" 
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({...editForm, pincode: e.target.value})}
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
          </div>
        </div>
      )}
    </div>
  );
}
