"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Briefcase, UserPlus, ChevronDown, Calendar, IndianRupee } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useUser, useUserRole } from "@/store/useAuthStore";
import AddCustomerSlideOver from "@/components/customers/AddCustomerSlideOver";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

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

const DATE_FILTERS = [
  { id: "all", label: "All Time" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_month", label: "This Month" },
  { id: "this_year", label: "This Year" },
];

const REVENUE_FILTERS = [
  { id: "all", label: "Any Revenue" },
  { id: "gt_1000", label: "> ₹1,000" },
  { id: "gt_5000", label: "> ₹5,000" },
];

export default function CustomersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const user = useUser();
  const role = useUserRole();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const activeDateFilter = searchParams.get("date") || "all";
  const activeRevenueFilter = searchParams.get("revenue") || "all";

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (activeDateFilter !== "all") params.append("dateRange", activeDateFilter);
      if (activeRevenueFilter !== "all") params.append("revenueRange", activeRevenueFilter);
      
      const data = await apiClient.get<Customer[]>(`/customers?${params.toString()}`);
      setCustomers(data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, activeDateFilter, activeRevenueFilter]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-gray-500 leading-snug">View and manage your converted clients.</p>
        </div>
        {/* Add Customer button removed */}
      </div>

      <AddCustomerSlideOver 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        onSuccess={fetchCustomers}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name, company, email..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set("search", e.target.value);
              else params.delete("search");
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border-gray-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Date Filter */}
          <Menu as="div" className="relative flex-1 sm:flex-none">
            <Menu.Button className="flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {DATE_FILTERS.find(f => f.id === activeDateFilter)?.label}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black/5 focus:outline-none z-10">
                <div className="p-1">
                  {DATE_FILTERS.map((filter) => (
                    <Menu.Item key={filter.id}>
                      {({ active }) => (
                        <button
                          onClick={() => updateFilters("date", filter.id)}
                          className={`${
                            active || activeDateFilter === filter.id ? 'bg-brand-blue/5 text-brand-blue' : 'text-gray-700'
                          } flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
                        >
                          {filter.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Revenue Filter */}
          <Menu as="div" className="relative flex-1 sm:flex-none">
            <Menu.Button className="flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-gray-400" />
                {REVENUE_FILTERS.find(f => f.id === activeRevenueFilter)?.label}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black/5 focus:outline-none z-10">
                <div className="p-1">
                  {REVENUE_FILTERS.map((filter) => (
                    <Menu.Item key={filter.id}>
                      {({ active }) => (
                        <button
                          onClick={() => updateFilters("revenue", filter.id)}
                          className={`${
                            active || activeRevenueFilter === filter.id ? 'bg-brand-blue/5 text-brand-blue' : 'text-gray-700'
                          } flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
                        >
                          {filter.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Company</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Revenue</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Date Added</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                      <span className="text-sm font-medium text-gray-500">Fetching customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Briefcase className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">No customers found</p>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                          {customer.firstName[0]}{customer.lastName?.[0] || ''}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
                          {customer.firstName} {customer.lastName || ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-medium">
                      {customer.company || "Individual"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">{customer.email || "No email"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold tracking-tight">
                        ₹{Number(customer.totalRevenue).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 font-medium">
                      {new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                        className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-blue/5"
                      >
                        Details
                      </button>
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
