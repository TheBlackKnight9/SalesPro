"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, User, Phone, Mail, Building, Loader2, Globe } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useUser } from "@/store/useAuthStore";

interface AddLeadSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SOURCE_OPTIONS = ["WEBSITE", "WHATSAPP", "REFERRAL", "MANUAL", "SOCIAL_MEDIA"];

export default function AddLeadSlideOver({
  isOpen,
  onClose,
  onSuccess,
}: AddLeadSlideOverProps) {
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
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col divide-y divide-gray-100 bg-white shadow-2xl"
                  >
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll py-6">
                      <div className="px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-xl font-bold text-gray-900 tracking-tight">
                            Add New Lead
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={onClose}
                            >
                              <span className="sr-only">Close panel</span>
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 leading-snug">
                          Capture details of a new prospect to add to the sales funnel.
                        </p>
                      </div>

                      <div className="relative mt-8 flex-1 px-6 space-y-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            First Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10"
                            placeholder="e.g. John"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10"
                            placeholder="+91 98765 43210"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10"
                            placeholder="john@example.com"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Building className="h-3 w-3" />
                            Company Name
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10"
                            placeholder="e.g. Tech Corp"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Globe className="h-3 w-3" />
                            Lead Source
                          </label>
                          <select
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all focus:border-brand-blue focus:ring-brand-blue/10"
                          >
                            {SOURCE_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 justify-end px-6 py-4 bg-gray-50/50 gap-3">
                      <button
                        type="button"
                        className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-all"
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
        </div>
      </Dialog>
    </Transition.Root>
  );
}
