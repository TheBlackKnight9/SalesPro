"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Calendar, Flag, AlignLeft, Link, Loader2, CheckSquare } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    linkType: "NONE" as "NONE" | "LEAD" | "CUSTOMER",
    linkedId: "",
  });

  const [leads, setLeads] = useState<{id: string, firstName: string, lastName?: string}[]>([]);
  const [customers, setCustomers] = useState<{id: string, firstName: string, lastName?: string}[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEntities();
    }
  }, [isOpen]);

  const fetchEntities = async () => {
    try {
      setIsLoadingEntities(true);
      const [leadsRes, customersRes] = await Promise.all([
        apiClient.get<any[]>("/leads"),
        apiClient.get<any[]>("/customers")
      ]);
      setLeads(leadsRes || []);
      setCustomers(customersRes || []);
    } catch (error) {
      console.error("Failed to fetch entities for task linkage:", error);
    } finally {
      setIsLoadingEntities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
      };

      if (formData.linkType === "LEAD") {
        payload.linkedLeadId = formData.linkedId;
      } else if (formData.linkType === "CUSTOMER") {
        payload.linkedCustomerId = formData.linkedId;
      }

      await apiClient.post("/tasks", payload);
      
      toast.success("Task created successfully!");
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        linkType: "NONE",
        linkedId: "",
      });
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error(error.message || "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md dark:bg-slate-900 dark:border dark:border-slate-800">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:text-slate-500 dark:hover:bg-slate-800"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                      Create New Task
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Set a follow-up or reminder for yourself.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      placeholder="e.g. Call client for follow-up"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <AlignLeft className="h-3 w-3" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white resize-none"
                      placeholder="Add more context about the task..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                        <Calendar className="h-3 w-3" />
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                        <Flag className="h-3 w-3" />
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Entity Linkage */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <Link className="h-3 w-3" />
                      Relate To
                    </label>
                    <div className="flex gap-2">
                      {["NONE", "LEAD", "CUSTOMER"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, linkType: type as any, linkedId: "" })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            formData.linkType === type 
                              ? "bg-brand-blue border-brand-blue text-white" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>

                    {formData.linkType !== "NONE" && (
                      <select
                        name="linkedId"
                        required
                        value={formData.linkedId}
                        onChange={handleChange}
                        disabled={isLoadingEntities}
                        className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      >
                        <option value="">Select {formData.linkType.toLowerCase()}...</option>
                        {formData.linkType === "LEAD" 
                          ? leads.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName || ''}</option>)
                          : customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ''}</option>)
                        }
                      </select>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <button
                      type="button"
                      className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center rounded-xl bg-brand-blue px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Task"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
