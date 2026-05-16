"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calculator, Calendar, User } from "lucide-react";
import { apiClient } from "@/lib/api";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedLeadId?: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  company?: string;
}

export default function CreateQuotationModal({ isOpen, onClose, onSuccess, preselectedLeadId }: CreateQuotationModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leadId: preselectedLeadId || "",
    validUntil: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 18 }]
  });

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      if (preselectedLeadId) {
        setFormData(prev => ({ ...prev, leadId: preselectedLeadId }));
      }
    }
  }, [isOpen, preselectedLeadId]);

  const fetchLeads = async () => {
    try {
      const data = await apiClient.get<Lead[]>("/leads?limit=100");
      setLeads(data || []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0, taxRate: 18 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items] as any;
    // Safeguard numeric inputs: Fallback to 0 if NaN or empty
    let processedValue = value;
    if ((field === "quantity" || field === "unitPrice" || field === "taxRate")) {
      processedValue = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
    }
    newItems[index][field] = processedValue;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const tax = lineTotal * (item.taxRate / 100);
      return sum + lineTotal + tax;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) return alert("Please select a lead.");
    
    setIsSubmitting(true);
    try {
      await apiClient.post("/quotations", formData);
      onSuccess();
    } catch (error) {
      console.error("Failed to create quotation:", error);
      alert("Error creating quotation. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Quotation</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">Generate a professional price proposal</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3" /> Select Lead
                  </label>
                  <select
                    required
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                    className="w-full rounded-2xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium appearance-none"
                  >
                    <option value="">Choose a lead...</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName || ""} {lead.company ? `(${lead.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full rounded-2xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Line Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:opacity-80 transition-opacity"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <div className="flex-1">
                        <input
                          placeholder="Description"
                          required
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold dark:text-white p-0"
                        />
                      </div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          placeholder="Qty"
                          required
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          className="w-16 bg-white dark:bg-slate-700 rounded-lg border-gray-200 dark:border-slate-600 text-xs font-bold dark:text-white p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          required
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                          className="w-24 bg-white dark:bg-slate-700 rounded-lg border-gray-200 dark:border-slate-600 text-xs font-bold dark:text-white p-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms, conditions, or special instructions..."
                  className="w-full rounded-2xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium h-24 text-sm"
                />
              </div>

              {/* Summary Footer */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-brand-blue/5 dark:bg-brand-blue/10 rounded-2xl border border-brand-blue/10">
                  <Calculator className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-tighter">Total Amount (Incl. Tax)</p>
                    <p className="text-lg font-black text-brand-blue">${calculateTotal().toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 md:flex-none px-10 py-3 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Generate Quotation"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
