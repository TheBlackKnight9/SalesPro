"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Phone, Image as ImageIcon, Loader2, Save, KeyRound } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, useUser } from "@/store/useAuthStore";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  officeId: string | null;
  avatarUrl: string | null;
}

interface PreferenceState {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  whatsappNumber: string;
}

const preferencesKey = "salespro_profile_preferences";

export default function SettingsPage() {
  const currentUser = useUser();
  const updateUser = useAuthStore((state) => state.updateUser);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [preferences, setPreferences] = useState<PreferenceState>({
    emailNotifications: true,
    whatsappNotifications: true,
    whatsappNumber: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedPreferences = window.localStorage.getItem(preferencesKey);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await api.get("/auth/profile");
        const data = response.data.data as ProfileData;
        setProfile(data);
        setProfileForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          avatarUrl: data.avatarUrl ?? "",
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load your profile.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }, [preferences]);

  const avatarPreview = useMemo(
    () => profileForm.avatarUrl || currentUser?.avatarUrl || "",
    [profileForm.avatarUrl, currentUser?.avatarUrl]
  );

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, avatarUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      const response = await api.put("/auth/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        avatarUrl: profileForm.avatarUrl || null,
      });

      const updatedProfile = response.data.data as ProfileData;
      setProfile(updatedProfile);
      updateUser({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatarUrl,
      });
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingPassword(true);

    try {
      await api.put("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage("Password changed successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Update your personal details, password, notifications, and WhatsApp settings.</p>
      </div>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400" : "border-emerald-200 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400"}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          </div>

          {isLoadingProfile ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 px-4 py-10 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              Loading your profile...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-950">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-slate-600">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Profile photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleAvatarUpload(event.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-hover cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <input
                    type="text"
                    className="field-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    className="field-input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Phone Number</label>
                  <input
                    type="text"
                    className="field-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((current) => ({ ...current, phone: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Role</label>
                  <div className="field-input bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 border border-gray-150 dark:border-slate-850 opacity-80 flex items-center">{profile?.role || currentUser?.role || "-"}</div>
                </div>
              </div>

              <button type="submit" disabled={isSavingProfile} className="btn btn-primary shadow-lg shadow-brand-blue/15 hover:shadow-xl hover:shadow-brand-blue/20">
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </button>
            </div>
          )}
        </motion.form>

        <div className="space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onSubmit={handlePasswordChange}
            className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password</h2>
            </div>
            <div className="space-y-4">
              <div className="field">
                <label className="field-label">Current Password</label>
                <input
                  type="password"
                  className="field-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field-label">New Password</label>
                <input
                  type="password"
                  className="field-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isSavingPassword} className="btn btn-secondary w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Change Password
              </button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Email notifications</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Receive CRM alerts in your inbox.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences((current) => ({ ...current, emailNotifications: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">WhatsApp notifications</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Enable alerts for WhatsApp workflows.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.whatsappNotifications}
                  onChange={(e) => setPreferences((current) => ({ ...current, whatsappNotifications: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                />
              </label>

              <div className="field">
                <label className="field-label flex items-center gap-2">
                  <Phone className="h-4 w-4" /> WhatsApp number
                </label>
                <input
                  type="text"
                  className="field-input"
                  value={preferences.whatsappNumber}
                  onChange={(e) => setPreferences((current) => ({ ...current, whatsappNumber: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
