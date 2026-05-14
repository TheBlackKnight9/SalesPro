"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, PieChart, Download } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get<any>("/dashboard/stats");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch report stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track your performance and sales metrics.</p>
        </div>
        <button className="btn btn-secondary">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Lead Conversion
            </h3>
            <select className="text-sm border-gray-300 rounded-lg">
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Conversion chart visualization</p>
              <p className="text-xs text-gray-400 mt-1">Real-time data: {stats?.conversionRate || "0%"}</p>
            </div>
          </div>
        </div>

        {/* Source Breakdown Placeholder */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent" />
              Lead Sources
            </h3>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
            <div className="text-center">
              <PieChart className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Source distribution pie chart</p>
              <p className="text-xs text-gray-400 mt-1">Total Leads: {stats?.totalLeads || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
