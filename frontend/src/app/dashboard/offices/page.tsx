"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Building2, Plus, MapPin, Phone, Users, X, Mail, Globe, Check, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Office {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  monthlyTarget: number;
  _count?: { users: number; leads: number };
}

function formatIndianCurrency(value: number, short = false) {
  if (!value) return "₹0";
  if (short) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value}`;
  }
  return `₹${new Intl.NumberFormat('en-IN').format(value)}`;
}

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Visibility States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  
  // Submit loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [addForm, setAddForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    monthlyTarget: 5000000,
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    monthlyTarget: 5000000,
    isActive: true,
  });

  const fetchOffices = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Office[]>("/offices");
      setOffices(data || []);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setIsAddOpen(true);
        // Clean URL to prevent recurring modal open on back navigation
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Handle opening Edit Modal
  const handleEditClick = (office: Office) => {
    setSelectedOffice(office);
    setEditForm({
      name: office.name || "",
      address: office.address || "",
      city: office.city || "",
      state: office.state || "",
      phone: office.phone || "",
      email: office.email || "",
      monthlyTarget: office.monthlyTarget ?? 5000000,
      isActive: office.isActive ?? true,
    });
    setIsEditOpen(true);
  };

  // Create Office Submit Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/offices", addForm);
      await fetchOffices();
      setIsAddOpen(false);
      // Reset form
      setAddForm({
        name: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
        monthlyTarget: 5000000,
        isActive: true,
      });
    } catch (error: any) {
      console.error("Failed to create office:", error);
      alert(error.message || "Failed to create office.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Office Submit Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffice) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/offices/${selectedOffice.id}`, editForm);
      await fetchOffices();
      setIsEditOpen(false);
      setSelectedOffice(null);
    } catch (error: any) {
      console.error("Failed to update office:", error);
      alert(error.message || "Failed to update office.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 bg-[#f8f9fa] dark:bg-slate-950 -m-6 p-6 pt-12 min-h-screen">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Offices</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage your business locations, branch status, and monthly targets.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="btn btn-primary shadow-sm hover:shadow active:scale-95 transition-all h-9 text-xs"
        >
          <Building2 className="mr-1.5 h-3.5 w-3.5" />
          Add Office
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-medium">Loading branch structures...</span>
          </div>
        ) : offices.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm text-center">
            <Building2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">No Offices Registered</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create your first branch office using the top-right controls.</p>
          </div>
        ) : (
          offices.map((office) => (
            <div 
              key={office.id} 
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{office.name}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{office.city || "Branch Location"}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    office.isActive 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50" 
                      : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50"
                  }`}>
                    {office.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="line-clamp-2">{office.address || "No address provided"}</span>
                  </div>
                  {office.phone && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span>{office.phone}</span>
                    </div>
                  )}
                  {office.email && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{office.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    <span className="dark:text-slate-400">{office._count?.users || 0} Team</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">₹</span>
                    <span className="dark:text-slate-400">Target: <strong className="text-slate-700 dark:text-slate-200">{formatIndianCurrency(office.monthlyTarget || 0, true)}</strong></span>
                  </div>
                </div>
                <button 
                  onClick={() => handleEditClick(office)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================== */}
      {/* DIALOG 1: ADD OFFICE                       */}
      {/* ========================================== */}
      <Transition.Root show={isAddOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-5 text-left shadow-xl border border-slate-100 dark:border-slate-800 transition-all max-w-md w-full">
                  <div className="absolute right-4 top-4">
                    <button
                      type="button"
                      className="rounded-md bg-transparent text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 focus:outline-none"
                      onClick={() => setIsAddOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <Dialog.Title as="h3" className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1">
                      Add New Office Branch
                    </Dialog.Title>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Configure corporate properties and revenue target values.</p>
                  </div>

                  <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Office Name</label>
                      <input
                        type="text"
                        required
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        placeholder="e.g. Jaipur Corporate Headquarter"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location Tag (City)</label>
                        <input
                          type="text"
                          required
                          value={addForm.city}
                          onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="e.g. Jaipur"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">State / Region</label>
                        <input
                          type="text"
                          value={addForm.state}
                          onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="e.g. Rajasthan"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Revenue Target (INR)</label>
                      <div className="relative rounded-lg shadow-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 text-xs font-semibold">₹</span>
                        <input 
                          type="number" 
                          required
                          value={addForm.monthlyTarget} 
                          onChange={(e) => setAddForm({ ...addForm, monthlyTarget: Number(e.target.value) })}
                          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="Enter Target Amount"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Street Address</label>
                      <input
                        type="text"
                        value={addForm.address}
                        onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        placeholder="e.g. 456 Tonk Road"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phone</label>
                        <input
                          type="tel"
                          value={addForm.phone}
                          onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email</label>
                        <input
                          type="email"
                          value={addForm.email}
                          onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="e.g. jaipur@salespro.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Initial Status</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setAddForm({ ...addForm, isActive: true })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            addForm.isActive
                              ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddForm({ ...addForm, isActive: false })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            !addForm.isActive
                              ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        onClick={() => setIsAddOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Create Office"
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

      {/* ========================================== */}
      {/* DIALOG 2: EDIT OFFICE                      */}
      {/* ========================================== */}
      <Transition.Root show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-5 text-left shadow-xl border border-slate-100 dark:border-slate-800 transition-all max-w-md w-full">
                  <div className="absolute right-4 top-4">
                    <button
                      type="button"
                      className="rounded-md bg-transparent text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 focus:outline-none"
                      onClick={() => setIsEditOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <Dialog.Title as="h3" className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1">
                      Edit Office Parameters
                    </Dialog.Title>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Update parameters, revenue targets, and status conditions.</p>
                  </div>

                  <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Office Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        placeholder="Jaipur Corporate Headquarter"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location Tag (City)</label>
                        <input
                          type="text"
                          required
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="Jaipur"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">State / Region</label>
                        <input
                          type="text"
                          value={editForm.state}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="Rajasthan"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Revenue Target (INR)</label>
                      <div className="relative rounded-lg shadow-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 text-xs font-semibold">₹</span>
                        <input 
                          type="number" 
                          value={editForm.monthlyTarget} 
                          onChange={(e) => setEditForm({ ...editForm, monthlyTarget: Number(e.target.value) })}
                          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Street Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Branch Status</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, isActive: true })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            editForm.isActive
                              ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, isActive: false })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            !editForm.isActive
                              ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        onClick={() => setIsEditOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Save Changes"
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
    </div>
  );
}
