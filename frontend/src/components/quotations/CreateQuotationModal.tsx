"use client";
 
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calculator, Calendar, User } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
 
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

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  company?: string;
}
 
export default function CreateQuotationModal({ isOpen, onClose, onSuccess, preselectedLeadId }: CreateQuotationModalProps) {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entityType, setEntityType] = useState<'LEAD' | 'CUSTOMER'>('LEAD');
  const [selectedEntityId, setSelectedEntityId] = useState(preselectedLeadId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(18);

  const [formData, setFormData] = useState({
    validUntil: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 18 }]
  });
 
  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      fetchCustomers();
      if (preselectedLeadId) {
        setEntityType('LEAD');
        setSelectedEntityId(preselectedLeadId);
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

  const fetchCustomers = async () => {
    try {
      const data = await apiClient.get<Customer[]>("/customers?limit=100");
      setCustomers(data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
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

  const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmountWithTax = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) {
      showToast(entityType === 'LEAD' ? "Please select a lead." : "Please select a customer.", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        validUntil: formData.validUntil,
        notes: formData.notes,
        items: formData.items.map(item => ({
          ...item,
          taxRate: taxRate
        })),
        leadId: entityType === 'LEAD' ? selectedEntityId : undefined,
        customerId: entityType === 'CUSTOMER' ? selectedEntityId : undefined,
      };
      await apiClient.post("/quotations", payload);
      showToast("Quotation created successfully.", "success");
      onSuccess();
    } catch (error) {
      console.error("Failed to create quotation:", error);
      showToast("Error creating quotation. Please check your inputs.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeData = entityType === 'LEAD' ? leads : customers;
  const filteredEntities = activeData.filter((entity) => {
    const fullName = `${entity.firstName} ${entity.lastName || ''}`.toLowerCase();
    const companyName = (entity.company || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || companyName.includes(query);
  });

  const selectedEntity = entityType === 'LEAD'
    ? leads.find((l) => l.id === selectedEntityId)
    : customers.find((c) => c.id === selectedEntityId);

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
                {/* Lead / Customer Selection */}
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3" /> Target Recipient
                  </label>

                  {/* Segmented Toggle */}
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setEntityType('LEAD');
                        setSelectedEntityId("");
                        setSearchQuery("");
                        setIsDropdownOpen(false);
                      }}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                        entityType === 'LEAD'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEntityType('CUSTOMER');
                        setSelectedEntityId("");
                        setSearchQuery("");
                        setIsDropdownOpen(false);
                      }}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                        entityType === 'CUSTOMER'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Customer
                    </button>
                  </div>

                  {/* Search / Selection input */}
                  {selectedEntityId && selectedEntity ? (
                    <div className="flex items-center justify-between bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/20 rounded-2xl py-3 px-4 transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedEntity.firstName} {selectedEntity.lastName || ""}
                        </span>
                        {selectedEntity.company && (
                          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                            {selectedEntity.company}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntityId("");
                          setSearchQuery("");
                        }}
                        className="p-1 rounded-lg hover:bg-brand-blue/10 text-gray-400 dark:text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder={entityType === 'LEAD' ? "Search leads..." : "Search customers..."}
                        className="w-full rounded-2xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium"
                      />
                      {/* Floating Dropdown List */}
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 mt-2 z-20 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl shadow-xl divide-y divide-gray-50 dark:divide-slate-700/50 custom-scrollbar">
                            {filteredEntities.length === 0 ? (
                              <div className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 text-center">
                                No {entityType.toLowerCase()}s found.
                              </div>
                            ) : (
                              filteredEntities.map((entity) => (
                                <button
                                  key={entity.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEntityId(entity.id);
                                    setSearchQuery("");
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full text-left py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col transition-colors"
                                >
                                  <span>{entity.firstName} {entity.lastName || ""}</span>
                                  {entity.company && (
                                    <span className="text-[11px] text-gray-400 dark:text-slate-500 uppercase">{entity.company}</span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
                  <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Line Items</label>
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
                          placeholder="₹ Price"
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
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms, conditions, or special instructions..."
                  className="w-full rounded-2xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all py-3 px-4 font-medium h-24 text-sm"
                />
              </div>

              <div className="flex justify-between items-center mb-4 px-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Number(e.target.value))} 
                  placeholder="0"
                  className="w-20 px-3 py-1.5 text-xs text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-brand-blue rounded-lg font-semibold"
                  min="0"
                />
              </div>

              {/* Summary Footer */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-brand-blue/5 dark:bg-brand-blue/10 rounded-2xl border border-brand-blue/10">
                  <Calculator className="h-5 w-5 text-brand-blue" />
                  <div>
                    <p className="text-[11px] font-bold text-brand-blue uppercase tracking-tighter">Total Amount (Incl. Tax)</p>
                    <p className="text-lg font-black text-brand-blue">₹{totalAmountWithTax.toLocaleString('en-IN')}</p>
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
