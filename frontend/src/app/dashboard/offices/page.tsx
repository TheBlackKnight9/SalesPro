"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, MapPin, Phone, Users } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Office {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  _count?: { users: number; leads: number };
}

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business locations and branches.</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Office
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-gray-500">Loading offices...</p>
        ) : offices.length === 0 ? (
          <p className="text-gray-500">No offices found.</p>
        ) : (
          offices.map((office) => (
            <div key={office.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{office.name}</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <span>{office.address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{office.phone || "No phone provided"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>{office._count?.users || 0} Team</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{office._count?.leads || 0} Leads</span>
                  </div>
                </div>
                <button className="text-accent text-sm font-medium hover:underline">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
