"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, FileText, Plus, Download, Eye, CheckCircle2, X, Check } from "lucide-react";
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
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);
  const [viewingQuoteDetails, setViewingQuoteDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getClientName = (q: Quotation) => {
    if (q.customer) return `${q.customer.firstName} ${q.customer.lastName || ""}`.trim();
    if (q.lead) return `${q.lead.firstName} ${q.lead.lastName || ""}`.trim();
    return "";
  };

  const finalDisplayData = quotations.filter((q) => {
    const clientName = getClientName(q);
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus ? q.status === selectedStatus : true;

    return matchesSearch && matchesStatus;
  });

  const handleOpenQuickView = async (quote: Quotation) => {
    setViewingQuote(quote);
    setIsLoadingDetails(true);
    try {
      const details = await apiClient.get<any>(`/quotations/${quote.id}`);
      setViewingQuoteDetails(details);
    } catch (error) {
      console.error("Failed to fetch quotation details:", error);
      showToast("Failed to load quotation details.", "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
      case "DRAFT": return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Draft</span>;
      case "SENT": return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Sent</span>;
      case "ACCEPTED": return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Accepted</span>;
      case "REJECTED": return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Rejected</span>;
      case "EXPIRED": return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Expired</span>;
      default: return <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
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
    <div className="max-w-6xl mx-auto w-full space-y-4 px-4 py-2">
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
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search quotes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-brand-blue/25 focus:border-brand-blue dark:text-white transition-all outline-none"
          />
        </div>
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex h-9 items-center justify-center px-3.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 w-full sm:w-auto dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {selectedStatus ? `Status: ${selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase()}` : "Filters"}
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Filter by Status
              </div>
              <div className="space-y-1">
                {[
                  { value: null, label: "All Statuses" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "SENT", label: "Sent" },
                  { value: "ACCEPTED", label: "Accepted" },
                  { value: "REJECTED", label: "Rejected" }
                ].map((statusOption) => (
                  <button
                    key={statusOption.value || "ALL"}
                    onClick={() => {
                      setSelectedStatus(statusOption.value);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                      selectedStatus === statusOption.value
                        ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-blue-light"
                        : "text-gray-700 dark:text-slate-300 hover:bg-gray-150 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{statusOption.label}</span>
                    {selectedStatus === statusOption.value && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/30 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Quote #</th>
                <th className="w-[30%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Client</th>
                <th className="w-[20%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="w-[12%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="w-[13%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="w-[10%] px-4 py-[8.5px] text-right text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
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
              ) : finalDisplayData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500 font-medium">No quotations matched your search criteria.</td>
                </tr>
              ) : (
                finalDisplayData.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-[7px]">
                      <span className="text-[14.5px] font-medium text-gray-900 dark:text-white">{q.quotationNumber}</span>
                    </td>
                    <td className="px-4 py-[7px]">
                      <div className="flex flex-col">
                        <span className="text-[14.5px] font-medium text-gray-900 dark:text-slate-200">
                          {q.customer 
                            ? `${q.customer.firstName} ${q.customer.lastName || ''}` 
                            : q.lead 
                              ? `${q.lead.firstName} ${q.lead.lastName || ''}` 
                              : "N/A"}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium uppercase mt-0.5">
                          {q.customer?.company || q.lead?.company || 'Personal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-[7px]">
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">₹{Number(q.totalAmount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-[7px]">{getStatusBadge(q.status)}</td>
                    <td className="px-4 py-[7px]">
                      <span className="text-[11px] font-medium text-gray-400 dark:text-slate-400">
                        {q.validUntil ? new Date(q.validUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No expiry'}
                      </span>
                    </td>
                    <td className="px-4 py-[7px] text-right">
                      <div className="flex items-center justify-end gap-2">
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
                                        ? q.customer
                                          ? "Quotation Accepted! Deal closed successfully."
                                          : "Quotation Accepted! Lead converted to Customer."
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
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-[10px] font-semibold rounded px-1.5 py-0.5 focus:ring-1 focus:ring-brand-blue/20 outline-none cursor-pointer transition-all uppercase tracking-wider h-6 flex items-center"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="SENT">Sent</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        <div className="flex items-center gap-0.5">
                          <button 
                            onClick={() => handleDownload(q.id, q.quotationNumber)}
                            className="p-1 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded transition-all"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleOpenQuickView(q)}
                            className="p-1 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded transition-all"
                            title="Quick View"
                          >
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

      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#07111f] p-6 text-gray-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200/70 font-bold">QUOTATION DETAILS</p>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">{viewingQuote.quotationNumber}</h2>
                  {getStatusBadge(viewingQuote.status)}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setViewingQuote(null);
                  setViewingQuoteDetails(null);
                }} 
                className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {isLoadingDetails ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mb-3" />
                  <p className="text-sm font-medium">Fetching line items...</p>
                </div>
              ) : viewingQuoteDetails ? (
                <>
                  {/* Client Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Client Name</p>
                      <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-slate-200">
                        {viewingQuoteDetails.customer 
                          ? `${viewingQuoteDetails.customer.firstName} ${viewingQuoteDetails.customer.lastName || ''}` 
                          : viewingQuoteDetails.lead 
                            ? `${viewingQuoteDetails.lead.firstName} ${viewingQuoteDetails.lead.lastName || ''}` 
                            : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Company / Org</p>
                      <p className="text-sm font-bold mt-0.5 text-gray-900 dark:text-slate-200">
                        {viewingQuoteDetails.customer?.company || viewingQuoteDetails.lead?.company || 'Personal'}
                      </p>
                    </div>
                    {viewingQuoteDetails.validUntil && (
                      <div className="md:col-span-2 border-t border-gray-150 dark:border-white/5 pt-2 mt-1">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Quotation Validity</p>
                        <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mt-0.5">
                          Valid until {new Date(viewingQuoteDetails.validUntil).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Line Items Table */}
                  <div className="border border-gray-150 dark:border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Item Description</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Price</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {viewingQuoteDetails.items?.map((item: any) => (
                            <tr key={item.id} className="text-sm">
                              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-slate-300">{item.description}</td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-slate-400">{Number(item.quantity)}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">₹{Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {viewingQuoteDetails.notes && (
                    <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Notes & Special Instructions</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-400 mt-1 whitespace-pre-wrap">{viewingQuoteDetails.notes}</p>
                    </div>
                  )}

                  {/* Summary Block */}
                  <div className="border-t border-gray-150 dark:border-white/5 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Subtotal</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{Number(viewingQuoteDetails.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Tax Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{Number(viewingQuoteDetails.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-150 dark:border-white/10 pt-2 text-base font-bold">
                      <span className="text-gray-900 dark:text-white">Grand Total</span>
                      <span className="text-cyan-600 dark:text-cyan-400">₹{Number(viewingQuoteDetails.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-rose-500">Failed to load details.</div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setViewingQuote(null);
                  setViewingQuoteDetails(null);
                }}
                className="btn btn-secondary px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
