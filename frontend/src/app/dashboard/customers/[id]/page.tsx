"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CreditCard, 
  History, 
  User, 
  ExternalLink,
  Save,
  MessageSquare,
  BadgeDollarSign
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName?: string;
  email: string | null;
  phone: string;
  company?: string;
  designation?: string;
  totalRevenue: string;
  notes: string | null;
  conversionNote: string | null;
  createdAt: string;
  office?: { name: string };
  quotations: Array<{
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "notes">("history");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get<CustomerDetail>(`/customers/${id}`);
        setCustomer(data);
        setNotes(data.notes || "");
      } catch (error) {
        console.error("Failed to fetch customer details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      // In a real app, you'd have a PATCH /customers/:id endpoint for notes
      // For now, we'll assume it works or just simulate
      await apiClient.patch(`/customers/${id}`, { notes });
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-lg font-semibold text-gray-900">Customer not found</p>
        <Button onClick={() => router.push("/dashboard/customers")} variant="secondary">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard/customers")}
            className="p-2.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {customer.firstName} {customer.lastName || ''}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer ID: {customer.id.slice(-8)}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-xs font-medium text-gray-500">Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl px-5 py-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
            <BadgeDollarSign className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900 tracking-tight">${Number(customer.totalRevenue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</label>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                  <Building2 className="h-4 w-4 text-gray-300" />
                  {customer.company || "Individual Client"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                  <Phone className="h-4 w-4 text-gray-300" />
                  {customer.phone}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                  <Mail className="h-4 w-4 text-gray-300" />
                  {customer.email || "No email provided"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Office</label>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                  <Building2 className="h-4 w-4 text-gray-300" />
                  {customer.office?.name || "Global Office"}
                </div>
              </div>

              {customer.conversionNote && (
                <div className="space-y-1 pt-4 border-t border-gray-50">
                  <label className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Conversion Note</label>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                    "{customer.conversionNote}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-50">
              <Button className="w-full" variant="secondary" onClick={() => alert("Edit functionality coming soon!")}>
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Workspace */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-100 px-6">
              <button 
                onClick={() => setActiveTab("history")}
                className={`py-4 px-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "history" 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Purchase History
              </button>
              <button 
                onClick={() => setActiveTab("notes")}
                className={`py-4 px-2 ml-8 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "notes" 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Client Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6">
              {activeTab === "history" ? (
                <div className="space-y-6">
                  {customer.quotations.length === 0 && customer.invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
                      <History className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No transaction history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customer.quotations.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:border-brand-blue/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Quotation #{q.id.slice(-6)}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">${Number(q.totalAmount).toLocaleString()}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                q.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            <button className="p-1.5 rounded-lg text-gray-300 hover:text-brand-blue hover:bg-brand-blue/5 transition-all">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-4">
                  <div className="flex-1">
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Type private notes about this client here..."
                      className="w-full h-full min-h-[300px] p-5 rounded-2xl border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveNotes}
                      isLoading={isSavingNotes}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
