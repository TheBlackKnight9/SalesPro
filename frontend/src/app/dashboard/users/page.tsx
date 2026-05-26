"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Search, Filter, Upload, RefreshCcw, UserCircle2, ShieldCheck, Building2, Mail, Phone, Trash2, RotateCcw, Pencil, Save, Eye, EyeOff } from "lucide-react";
import { useUser, useUserRole } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Office {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "SUPER_ADMIN" | "MANAGER" | "AGENT";
  isActive: boolean;
  avatarUrl?: string | null;
  office?: { id: string; name: string } | null;
  createdAt?: string;
  plainPassword?: string | null;
}

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  oldPassword?: string;
  role: "SUPER_ADMIN" | "MANAGER" | "AGENT";
  officeId: string;
  avatarUrl: string;
  isActive: boolean;
}

const initialFormState: UserFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  oldPassword: "",
  role: "AGENT",
  officeId: "",
  avatarUrl: "",
  isActive: true,
};

export default function UsersPage() {
  const currentUser = useUser();
  const role = useUserRole();
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Role Guard ──────────────────────────────
  useEffect(() => {
    if (role && role !== "SUPER_ADMIN" && role !== "MANAGER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const requiresOffice = form.role === "MANAGER" || form.role === "AGENT";

  const fetchOffices = async () => {
    try {
      const response = await apiClient.get<Office[]>("/offices", { page: 1, limit: 100 });
      setOffices(response || []);
    } catch (err) {
      console.error("Failed to fetch offices:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<UserRecord[]>("/users", {
        page: 1,
        limit: 200,
        search: search || undefined,
        role: roleFilter || undefined,
        // If manager, office is locked by backend, but we can pass it for clarity
        officeId: role === "MANAGER" ? currentUser?.officeId : (officeFilter || undefined),
      });
      const records = response || [];
      setUsers(
        statusFilter
          ? records.filter((user) => (statusFilter === "active" ? user.isActive : !user.isActive))
          : records
      );
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (role) fetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, roleFilter, officeFilter, statusFilter, role]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    const managers = users.filter((user) => user.role === "MANAGER").length;
    const agents = users.filter((user) => user.role === "AGENT").length;

    return { active, managers, agents, total: users.length };
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      ...initialFormState,
      // If Manager, lock office and role
      officeId: role === "MANAGER" ? (currentUser?.officeId || "") : "",
      role: "AGENT",
    });
    setError("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    if (role === "MANAGER" && user.role !== "AGENT") return; // Security safeguard

    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      oldPassword: user.plainPassword || "",
      role: user.role,
      officeId: user.office?.id || "",
      avatarUrl: user.avatarUrl || "",
      isActive: user.isActive,
    });
    setError("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setIsModalOpen(true);
  };

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, avatarUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (requiresOffice && !form.officeId) {
      setError("Select an office for MANAGER or AGENT roles.");
      return;
    }

    if (!editingUser && !form.password) {
      setError("Password is required for new users.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: role === "MANAGER" ? "AGENT" : form.role, // Managers can only create/edit Agents
          avatarUrl: form.avatarUrl || undefined,
          isActive: form.isActive,
          officeId: role === "MANAGER" ? currentUser?.officeId : (requiresOffice ? form.officeId : undefined),
          ...(form.password.trim() !== "" && { password: form.password }),
        });
        showToast("User updated successfully.", "success");
      } else {
        await apiClient.post("/users", {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: role === "MANAGER" ? "AGENT" : form.role,
          officeId: role === "MANAGER" ? currentUser?.officeId : form.officeId,
          avatarUrl: form.avatarUrl || undefined,
        });
        showToast("User created successfully.", "success");
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    try {
      await apiClient.delete(`/users/${id}`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
      showToast("User deactivated.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to deactivate user.", "error");
    }
  };

  const handleReactivate = async (event: React.MouseEvent, user: UserRecord) => {
    event.preventDefault();
    try {
      await apiClient.put(`/users/${user.id}`, { isActive: true });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: true } : u)));
      showToast("User reactivated.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to reactivate user.", "error");
    }
  };

  const handleImportCsv = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    setError("");

    try {
      const text = await file.text();
      const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(",").map((header) => header.trim().toLowerCase());

      for (const line of lines) {
        const values = line.split(",");
        const row = headers.reduce<Record<string, string>>((accumulator, header, index) => {
          accumulator[header] = (values[index] || "").trim();
          return accumulator;
        }, {});

        if (!row.name || !row.email || !row.password) continue;
        
        // If manager, force their office. If admin, check CSV officeid or name
        let targetOfficeId = role === "MANAGER" ? currentUser?.officeId : "";
        if (role !== "MANAGER" && row.officeid) {
          const cleanedOfficeInput = row.officeid.trim().toLowerCase();
          const matchedOffice = offices.find(
            (o) =>
              o.id.toLowerCase() === cleanedOfficeInput ||
              o.name.toLowerCase().includes(cleanedOfficeInput)
          );
          if (matchedOffice) {
            targetOfficeId = matchedOffice.id;
          } else {
            targetOfficeId = row.officeid; // Fallback to raw input (e.g. CUID)
          }
        }
        if (!targetOfficeId) continue;

        await apiClient.post("/users", {
          name: row.name,
          email: row.email,
          phone: row.phone || "",
          password: row.password,
          role: role === "MANAGER" ? "AGENT" : ((row.role?.toUpperCase() || "AGENT") as UserRecord["role"]),
          officeId: targetOfficeId,
          avatarUrl: row.avatarurl || undefined,
        });
      }

      showToast("CSV import completed.", "success");
      await fetchUsers();
    } catch (err: any) {
      showToast(err?.message || "Failed to import CSV file.", "error");
    } finally {
      setImporting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "SUPER_ADMIN") return "bg-rose-100 text-rose-700";
    if (role === "MANAGER") return "bg-violet-100 text-violet-700";
    return "bg-sky-100 text-sky-700";
  };

  // ── UI Logic for Managers ──────────────────
  const canModify = (targetUser: UserRecord) => {
    if (role === "SUPER_ADMIN") return true;
    if (role === "MANAGER") {
      // Manager can only edit Agents in their office
      return targetUser.role === "AGENT" && targetUser.office?.id === currentUser?.officeId;
    }
    return false;
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 px-4 py-2 pb-12 bg-[#f8f9fa] dark:bg-slate-950 -m-6 p-6 pt-12 min-h-screen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Team Management</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {role === "MANAGER" ? "Manage your office agents and pipeline." : "Global search, filter, and administrative control."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all w-fit cursor-pointer h-9">
            <Upload className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            {importing ? "Importing..." : "Bulk Import Agents"}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleImportCsv(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button 
            type="button" 
            onClick={openCreateModal} 
            className="btn btn-primary shadow-sm hover:shadow active:scale-95 transition-all h-9 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New User
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(role === "SUPER_ADMIN"
          ? [
              { label: "Total Staff", value: stats.total },
              { label: "Active", value: stats.active },
              { label: "Managers", value: stats.managers },
              { label: "Agents", value: stats.agents },
            ]
          : [
              { label: "Total Agents", value: stats.total },
              { label: "Active Agents", value: stats.active },
              { label: "Inactive Agents", value: stats.total - stats.active },
            ]
        ).map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-9 pr-3 py-1 outline-none shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-blue/20 h-9"
            />
          </div>

          {role === "SUPER_ADMIN" ? (
            <select 
              value={roleFilter} 
              onChange={(event) => setRoleFilter(event.target.value)} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none shadow-sm focus:ring-1 focus:ring-brand-blue/20 cursor-pointer h-9"
            >
              <option value="" className="dark:bg-slate-900">All roles</option>
              <option value="SUPER_ADMIN" className="dark:bg-slate-900">Super Admin</option>
              <option value="MANAGER" className="dark:bg-slate-900">Manager</option>
              <option value="AGENT" className="dark:bg-slate-900">Agent</option>
            </select>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs rounded-lg px-3 flex items-center cursor-not-allowed h-9">
              <ShieldCheck className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500" />
              Role: Agent Only
            </div>
          )}

          {role === "SUPER_ADMIN" ? (
            <select 
              value={officeFilter} 
              onChange={(event) => setOfficeFilter(event.target.value)} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none shadow-sm focus:ring-1 focus:ring-brand-blue/20 cursor-pointer h-9"
            >
              <option value="" className="dark:bg-slate-900">All offices</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id} className="dark:bg-slate-900">{office.name}</option>
              ))}
            </select>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs rounded-lg px-3 flex items-center cursor-not-allowed h-9">
              <Building2 className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500" />
              {currentUser?.officeId ? offices.find(o => o.id === currentUser.officeId)?.name : "My Office"}
            </div>
          )}

          <select 
            value={statusFilter} 
            onChange={(event) => setStatusFilter(event.target.value)} 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none shadow-sm focus:ring-1 focus:ring-brand-blue/20 cursor-pointer h-9"
          >
            <option value="" className="dark:bg-slate-900">All status</option>
            <option value="active" className="dark:bg-slate-900">Active</option>
            <option value="inactive" className="dark:bg-slate-900">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50/30 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="w-[35%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">User</th>
                <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Role</th>
                <th className="w-[20%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Office</th>
                <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="w-[15%] px-4 py-[8.5px] text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-indigo-600" />
                    Syncing team data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">No team members found.</td>
                </tr>
              ) : (
                users.map((user) => {
                  const getRoleStyles = (r: string) => {
                    if (r === "SUPER_ADMIN") return "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50";
                    if (r === "MANAGER") return "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50";
                    return "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50";
                  };

                  return (
                    <tr key={user.id} className={`${user.role === "SUPER_ADMIN" ? "bg-gray-50/20 dark:bg-slate-900/10" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/30"} transition-colors`}>
                      <td className="px-4 py-[7px]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              <UserCircle2 className="h-4.5 w-4.5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14.5px] font-medium text-slate-800 dark:text-white truncate">{user.name}</p>
                            <div className="flex flex-col text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                              <span>{user.email}</span>
                              {user.phone && <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{user.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-[7px]">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${getRoleStyles(user.role)}`}>
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-[7px]">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          {user.office?.name || "Global"}
                        </span>
                      </td>
                      <td className="px-4 py-[7px]">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                          user.isActive 
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-[7px] text-right">
                        {canModify(user) ? (
                          <div className="inline-flex items-center gap-1.5 justify-end w-full">
                            <button 
                              type="button" 
                              onClick={() => openEditModal(user)} 
                              className="px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            {user.isActive ? (
                              <button 
                                type="button" 
                                onClick={(e) => handleDeactivate(e, user.id)} 
                                className="px-2 py-1 text-[11px] font-semibold rounded-md border border-red-200 dark:border-red-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors inline-flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Deactivate
                              </button>
                            ) : (
                              <button 
                                type="button" 
                                onClick={(e) => handleReactivate(e, user)} 
                                className="px-2 py-1 text-[11px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors inline-flex items-center gap-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reactivate
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{editingUser ? "Edit Profile" : "Onboard user"}</p>
                <h2 className="mt-1 text-xl font-semibold">{editingUser ? editingUser.name : "New Team Member"}</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm text-slate-400 hover:text-white transition-colors">
                Close
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Name</label>
                  <input 
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all" 
                    value={form.name} 
                    placeholder="Enter full name"
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} 
                  />
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all disabled:opacity-50 disabled:bg-slate-950/50"
                    value={form.email}
                    placeholder="name@company.com"
                    disabled={Boolean(editingUser)}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Phone</label>
                  <input 
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all" 
                    value={form.phone} 
                    placeholder="Enter phone number"
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} 
                  />
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Role</label>
                  {role === "SUPER_ADMIN" ? (
                    <select 
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer" 
                      value={form.role} 
                      onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserFormState["role"] }))}
                    >
                      <option value="SUPER_ADMIN" className="bg-slate-900 text-white">SUPER_ADMIN</option>
                      <option value="MANAGER" className="bg-slate-900 text-white">MANAGER</option>
                      <option value="AGENT" className="bg-slate-900 text-white">AGENT</option>
                    </select>
                  ) : (
                    <div className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2 text-sm text-slate-300">
                      AGENT (Default)
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Office</label>
                  {role === "SUPER_ADMIN" ? (
                    <select 
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer" 
                      value={form.officeId} 
                      onChange={(event) => setForm((current) => ({ ...current, officeId: event.target.value }))}
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Select office</option>
                      {offices.map((office) => (
                        <option key={office.id} value={office.id} className="bg-slate-900 text-white">{office.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2 text-sm text-slate-300">
                      {offices.find(o => o.id === currentUser?.officeId)?.name || "Assigned Office"}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-300">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(event) => handleAvatarUpload(event.target.files?.[0] || null)} 
                    className="w-full rounded-lg border border-dashed border-white/10 bg-slate-950/30 px-3.5 py-1.5 text-xs text-slate-300 file:mr-3.5 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-600 file:transition-colors file:cursor-pointer cursor-pointer" 
                  />
                </div>

                {/* Password Fields inside the Grid */}
                {editingUser ? (
                  <>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-slate-300">Old Password</label>
                      <div className="relative w-full">
                        <input 
                          className="w-full rounded-lg border border-white/10 bg-slate-950/40 pl-3.5 pr-10 py-2 text-sm text-slate-400 placeholder-slate-500 outline-none transition-all cursor-not-allowed" 
                          type={showOldPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={form.oldPassword || ""} 
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="no-hover absolute right-3 top-0 bottom-0 my-auto h-fit text-slate-400 hover:text-white transition-colors focus:outline-none flex items-center justify-center"
                        >
                          {showOldPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-slate-300">New Password (Optional)</label>
                      <div className="relative w-full">
                        <input 
                          className="w-full rounded-lg border border-white/10 bg-slate-900 pl-3.5 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all" 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Leave blank to keep unchanged" 
                          value={form.password} 
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="no-hover absolute right-3 top-0 bottom-0 my-auto h-fit text-slate-400 hover:text-white transition-colors focus:outline-none flex items-center justify-center"
                        >
                          {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <div className="relative w-full">
                        <input 
                          className="w-full rounded-lg border border-white/10 bg-slate-900 pl-3.5 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all" 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={form.password} 
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="no-hover absolute right-3 top-0 bottom-0 my-auto h-fit text-slate-400 hover:text-white transition-colors focus:outline-none flex items-center justify-center"
                        >
                          {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>
                    <div></div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-2.5 text-xs font-medium text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} 
                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-0 cursor-pointer" 
                  />
                  Active account
                </label>

                {requiresOffice && (
                  <p className="text-[11px] text-cyan-200/60 font-medium">Office is required for Manager and Agent roles.</p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary h-8.5 text-xs px-3.5">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary h-8.5 text-xs px-3.5">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
