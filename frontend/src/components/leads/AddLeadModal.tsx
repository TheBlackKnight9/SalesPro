"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, User, Phone, Mail, Building, Loader2, Globe } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useUser } from "@/store/useAuthStore";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SOURCE_OPTIONS = ["WEBSITE", "WHATSAPP", "REFERRAL", "MANUAL", "SOCIAL_MEDIA"];

export default function AddLeadModal({
  isOpen,
  onClose,
  onSuccess,
}: AddLeadModalProps) {
  const user = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    email: "",
    company: "",
    source: "WEBSITE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/leads", {
        ...formData,
        officeId: user?.officeId,
      });
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        firstName: "",
        phone: "",
        email: "",
        company: "",
        source: "WEBSITE",
      });
    } catch (error: any) {
      console.error("Failed to create lead:", error);
      alert(error.message || "Failed to create lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md dark:bg-slate-900 dark:border dark:border-slate-800">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none dark:text-slate-500 dark:hover:text-slate-400"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-left sm:mt-0 sm:w-full">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                      Add New Prospect
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Capture details of a new prospect to add to the sales funnel.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <User className="h-3 w-3" />
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-brand-blue"
                      placeholder="e.g. John"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <Phone className="h-3 w-3" />
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-brand-blue"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <Mail className="h-3 w-3" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-brand-blue"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <Building className="h-3 w-3" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-brand-blue"
                      placeholder="e.g. Tech Corp"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 dark:text-slate-500">
                      <Globe className="h-3 w-3" />
                      Lead Source
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-brand-blue"
                    >
                      {SOURCE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center rounded-xl bg-brand-blue px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save Lead"
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
