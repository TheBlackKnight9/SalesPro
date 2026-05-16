"use client";

import { useState, useEffect } from "react";
import { Search, Filter, FileText, Plus, Download, Eye, CheckCircle2, X } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import CreateQuotationModal from "@/components/quotations/CreateQuotationModal";

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  validUntil: string | null;
  lead?: { firstName: string; lastName?: string; company?: string };
  customer?: { firstName: string; lastName?: string; company?: string };
}

export default function QuotationsPage() {
  const { showToast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Quotation[]>("/quotations");
      setQuotations(data || []);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Draft</span>;
      case "SENT": return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Sent</span>;
      case "ACCEPTED": return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Accepted</span>;
      case "REJECTED": return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Rejected</span>;
      case "EXPIRED": return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Expired</span>;
      default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const handleDownload = async (id: string, number: string) => {
    try {
      const blob = await apiClient.get<Blob>(`/quotations/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage and track your sales proposals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary shadow-lg shadow-brand-blue/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search quotes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue dark:text-white transition-all outline-none"
          />
        </div>
        <button className="btn btn-secondary w-full sm:w-auto dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Quote #</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Expiry</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500 animate-pulse font-medium">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500 font-medium">No quotations found.</td>
                </tr>
              ) : (
                quotations
                  .filter(q => q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">{q.quotationNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-200">
                          {q.customer 
                            ? `${q.customer.firstName} ${q.customer.lastName || ''}` 
                            : q.lead 
                              ? `${q.lead.firstName} ${q.lead.lastName || ''}` 
                              : "N/A"}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">
                          {q.customer?.company || q.lead?.company || 'Personal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white">${Number(q.totalAmount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : 'No expiry'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <select 
                          value={q.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              await apiClient.patch(`/quotations/${q.id}/status`, { status: newStatus });
                              
                              toast.custom((t) => (
                                <div
                                  className={`${
                                    t.visible ? 'animate-enter' : 'animate-leave'
                                  } max-w-[350px] w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl pointer-events-auto flex items-center p-3 border border-green-100`}
                                >
                                  {/* Left Side: Light Green Icon Box */}
                                  <div className="flex-shrink-0 h-10 w-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-[#15803d]" strokeWidth={2.5} />
                                  </div>

                                  {/* Middle: Bold Dark Green Text */}
                                  <div className="ml-3 flex-1">
                                    <p className="text-[15px] font-bold text-[#14532d]">
                                      {newStatus === "ACCEPTED" 
                                        ? "Quotation Accepted! Lead converted to Customer."
                                        : `Status updated to ${newStatus}.`}
                                    </p>
                                  </div>

                                  {/* Right Side: Close Button */}
                                  <div className="ml-4 flex-shrink-0 flex items-center">
                                    <button
                                      onClick={() => toast.dismiss(t.id)}
                                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all focus:outline-none"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              ), { duration: 4000 });
                              
                              fetchQuotations();
                            } catch (err: any) {
                              console.error("Failed to update status", err);
                              toast.error(err.message || "Failed to update status");
                            }
                          }}
                          className="bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-blue/20 outline-none cursor-pointer transition-all uppercase tracking-wider"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="SENT">Sent</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleDownload(q.id, q.quotationNumber)}
                            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CreateQuotationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchQuotations();
          }}
        />
      )}
    </div>
  );
}
