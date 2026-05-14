"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Briefcase } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email: string | null;
  phone: string;
  company?: string;
  totalRevenue: number;
  createdAt: string;
  lead?: {
    source: string;
    status: string;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Customer[]>("/customers");
      setCustomers(data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your converted clients.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-accent focus:border-accent"
          />
        </div>
        <button className="btn btn-secondary w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Revenue</th>
                <th>Date Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No customers found. Convert leads to see them here!
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium text-gray-900">{customer.firstName} {customer.lastName || ''}</td>
                    <td className="text-gray-500">{customer.company || "Individual"}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-gray-900">{customer.phone}</span>
                        <span className="text-xs text-gray-500">{customer.email || "No email"}</span>
                      </div>
                    </td>
                    <td className="text-gray-900 font-semibold">${Number(customer.totalRevenue).toLocaleString()}</td>
                    <td className="text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button className="text-accent hover:text-accent-hover text-sm font-medium">Details</button>
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
