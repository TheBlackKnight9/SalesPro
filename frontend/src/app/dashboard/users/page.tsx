"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Search, Filter, Upload, RefreshCcw, UserCircle2, ShieldCheck, Building2, Mail, Phone, Trash2, RotateCcw, Pencil, Save } from "lucide-react";

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
}

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
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
  role: "AGENT",
  officeId: "",
  avatarUrl: "",
  isActive: true,
};

export default function UsersPage() {
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
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);

  const requiresOffice = form.role === "MANAGER" || form.role === "AGENT";

  const fetchOffices = async () => {
    const response = await apiClient.get<Office[]>("/offices", { page: 1, limit: 100 });
    setOffices(response || []);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<UserRecord[]>("/users", {
        page: 1,
        limit: 200,
        search: search || undefined,
        role: roleFilter || undefined,
        officeId: officeFilter || undefined,
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
    fetchOffices().catch((err) => console.error("Failed to fetch offices:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, roleFilter, officeFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    const managers = users.filter((user) => user.role === "MANAGER").length;
    const agents = users.filter((user) => user.role === "AGENT").length;

    return { active, managers, agents, total: users.length };
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(initialFormState);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      officeId: user.office?.id || "",
      avatarUrl: user.avatarUrl || "",
      isActive: user.isActive,
    });
    setError("");
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
    setMessage("");

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
          role: form.role,
          avatarUrl: form.avatarUrl || undefined,
          isActive: form.isActive,
          ...(requiresOffice ? { officeId: form.officeId } : { officeId: undefined }),
        });
        setMessage("User updated successfully.");
      } else {
        await apiClient.post("/users", {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
          officeId: form.officeId,
          avatarUrl: form.avatarUrl || undefined,
        });
        setMessage("User created successfully.");
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiClient.delete(`/users/${id}`);
      setMessage("User deactivated.");
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate user.");
    }
  };

  const handleReactivate = async (user: UserRecord) => {
    try {
      await apiClient.put(`/users/${user.id}`, { isActive: true });
      setMessage("User reactivated.");
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to reactivate user.");
    }
  };

  const handleImportCsv = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    setError("");
    setMessage("");

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

        if (!row.name || !row.email || !row.password || !row.officeid) continue;

        await apiClient.post("/users", {
          name: row.name,
          email: row.email,
          phone: row.phone || "",
          password: row.password,
          role: (row.role?.toUpperCase() || "AGENT") as UserRecord["role"],
          officeId: row.officeid,
          avatarUrl: row.avatarurl || undefined,
        });
      }

      setMessage("CSV import completed.");
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to import CSV file.");
    } finally {
      setImporting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "SUPER_ADMIN") return "bg-rose-100 text-rose-700";
    if (role === "MANAGER") return "bg-violet-100 text-violet-700";
    return "bg-sky-100 text-sky-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Search, filter, create, edit, deactivate, and import users.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="btn btn-secondary cursor-pointer">
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Bulk Import CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleImportCsv(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            New User
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Users", value: stats.total },
          { label: "Active Users", value: stats.active },
          { label: "Managers", value: stats.managers },
          { label: "Agents", value: stats.agents },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or phone"
              className="field-input pl-11"
            />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="field-input">
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="AGENT">Agent</option>
          </select>

          <select value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)} className="field-input">
            <option value="">All offices</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-input">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {(error || message) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Office</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-accent" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <UserCircle2 className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:gap-4">
                            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                            {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadge(user.role)}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        {user.office?.name || "Global"}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button type="button" onClick={() => openEditModal(user)} className="btn btn-secondary px-3 py-2 text-xs">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        {user.isActive ? (
                          <button type="button" onClick={() => handleDeactivate(user.id)} className="btn btn-secondary px-3 py-2 text-xs text-rose-600 hover:text-rose-700">
                            <Trash2 className="h-4 w-4" />
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleReactivate(user)} className="btn btn-secondary px-3 py-2 text-xs text-emerald-700 hover:text-emerald-800">
                            <RotateCcw className="h-4 w-4" />
                            Reactivate
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{editingUser ? "Edit user" : "Create user"}</p>
                <h2 className="mt-1 text-2xl font-semibold">{editingUser ? editingUser.name : "New Team Member"}</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Name</label>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Email</label>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white disabled:opacity-70"
                    value={form.email}
                    disabled={Boolean(editingUser)}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Phone</label>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Role</label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserFormState["role"] }))}>
                    <option value="SUPER_ADMIN" className="bg-slate-900">SUPER_ADMIN</option>
                    <option value="MANAGER" className="bg-slate-900">MANAGER</option>
                    <option value="AGENT" className="bg-slate-900">AGENT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Office</label>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white" value={form.officeId} onChange={(event) => setForm((current) => ({ ...current, officeId: event.target.value }))}>
                    <option value="" className="bg-slate-900">Select office</option>
                    {offices.map((office) => (
                      <option key={office.id} value={office.id} className="bg-slate-900">{office.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Profile Photo</label>
                  <input type="file" accept="image/*" onChange={(event) => handleAvatarUpload(event.target.files?.[0] || null)} className="w-full rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-white" />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                </div>
              )}

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500" />
                Active account
              </label>

              {requiresOffice && (
                <p className="text-xs text-cyan-200/70">Office is required for Manager and Agent roles.</p>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
