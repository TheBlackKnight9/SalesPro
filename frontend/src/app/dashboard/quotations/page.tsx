"use client";

import { useState, useEffect } from "react";
import { Search, Filter, FileText, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  validUntil: string | null;
  lead?: { firstName: string; lastName?: string };
  customer?: { firstName: string; lastName?: string };
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      case "DRAFT": return <span className="badge bg-gray-100 text-gray-800">Draft</span>;
      case "SENT": return <span className="badge bg-blue-100 text-blue-800">Sent</span>;
      case "ACCEPTED": return <span className="badge bg-green-100 text-green-800">Accepted</span>;
      case "REJECTED": return <span className="badge bg-red-100 text-red-800">Rejected</span>;
      case "EXPIRED": return <span className="badge bg-yellow-100 text-yellow-800">Expired</span>;
      default: return <span className="badge bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage price quotes and proposals.</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search quotations..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-accent focus:border-accent"
          />
        </div>
        <button className="btn btn-secondary w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th>Quote #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">No quotations found.</td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id}>
                    <td className="font-medium text-gray-900">{q.quotationNumber}</td>
                    <td className="text-gray-500">
                      {q.customer 
                        ? `${q.customer.firstName} ${q.customer.lastName || ''}` 
                        : q.lead 
                          ? `${q.lead.firstName} ${q.lead.lastName || ''}` 
                          : "N/A"}
                    </td>
                    <td className="text-gray-900 font-semibold">${Number(q.totalAmount).toLocaleString()}</td>
                    <td>{getStatusBadge(q.status)}</td>
                    <td className="text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button className="text-accent hover:text-accent-hover text-sm font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
