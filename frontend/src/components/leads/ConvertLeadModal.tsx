"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, FileText, IndianRupee } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

interface Quotation {
  id: string;
  quotationNumber: string;
  totalAmount: number;
  status: string;
}

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  leadName: string;
}

function shortenQuoteNumber(num: string): string {
  if (!num) return "";
  const parts = num.split("-");
  if (parts.length >= 4) {
    return `${parts.slice(0, 4).join("-")}...`;
  }
  if (num.length > 15) {
    return `${num.substring(0, 15)}...`;
  }
  return num;
}

export default function ConvertLeadModal({ isOpen, onClose, onSuccess, leadId, leadName }: ConvertLeadModalProps) {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [conversionNote, setConversionNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchAllQuotes();
    }
  }, [isOpen, leadId]);

  const fetchAllQuotes = async () => {
    try {
      setIsLoading(true);
      // Fetch all quotations for this lead
      const data = await apiClient.get<Quotation[]>("/quotations", { 
        leadId
      });
      // STRICT FILTERING: Ensure we only show quotes for this lead and non-rejected ones
      const filtered = (data || []).filter(q => (q as any).leadId === leadId && q.status !== "REJECTED");
      setQuotes(filtered);
      
      // Auto-select first ACCEPTED quote if it exists, otherwise first available
      const accepted = filtered.find(q => q.status === "ACCEPTED");
      if (accepted) {
        setSelectedQuoteId(accepted.id);
      } else if (filtered.length > 0) {
        setSelectedQuoteId(filtered[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch quotes", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    // FLEXIBLE VALIDATION: Require either a quotation OR a conversion note
    if (!selectedQuoteId && !conversionNote.trim()) {
      showToast("Please provide either a quotation or a conversion note.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/leads/${leadId}/convert`, {
        quotationId: selectedQuoteId,
        conversionNote: conversionNote.trim()
      });
      showToast(`${leadName} successfully converted to customer!`, "success");
      onSuccess();
    } catch (error: any) {
      console.error("Conversion failed", error);
      showToast(error.response?.data?.message || "Failed to convert lead.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Convert to Customer</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Lead: <span className="font-bold text-brand-blue">{leadName}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-500">Checking quotations...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">No Quotations Found</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Please create a quotation for this lead first before converting to a customer.</p>
                <Button variant="secondary" onClick={onClose} className="mt-2 w-full">Got it</Button>
              </div>
            ) : (
              <>
                {/* Quote Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Select Quotation to Accept & Link</label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {quotes.map((quote) => (
                      <div 
                        key={quote.id}
                        onClick={() => setSelectedQuoteId(quote.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedQuoteId === quote.id 
                            ? "border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10" 
                            : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${selectedQuoteId === quote.id ? "bg-brand-blue text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-400"}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900 dark:text-white uppercase" title={quote.quotationNumber}>
                                {shortenQuoteNumber(quote.quotationNumber)}
                              </p>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                quote.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                {quote.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <IndianRupee className="h-3 w-3 text-emerald-500" />
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{Number(quote.totalAmount).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                        {selectedQuoteId === quote.id && <CheckCircle className="h-5 w-5 text-brand-blue" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Note */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Conversion Note {selectedQuoteId ? "(Optional if Quote selected)" : "(Mandatory if no Quote)"}
                  </label>
                  <textarea 
                    value={conversionNote}
                    onChange={(e) => setConversionNote(e.target.value)}
                    placeholder="e.g., Client confirmed via email, 100% upfront paid..."
                    className="w-full min-h-[100px] p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue transition-all resize-none dark:text-white"
                  />
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleConvert}
                    className="w-full py-6 text-base font-bold rounded-2xl shadow-xl shadow-brand-blue/20"
                    loading={isSubmitting}
                  >
                    Accept Quote & Convert
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
