"use client";

import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  Edit3,
  Save,
  X,
  Shield,
  Clock,
  Activity,
  Key,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ChevronRight,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useProfileStore, useSettingsStore } from "@/store";
import { cn } from "@/lib/utils";

type ProfileTab = "overview" | "security" | "activity";

const AVATAR_COLORS = [
  { label: "Blue-Purple", value: "from-blue-500 to-purple-600" },
  { label: "Green-Teal", value: "from-green-400 to-teal-600" },
  { label: "Orange-Red", value: "from-orange-400 to-red-600" },
  { label: "Pink-Purple", value: "from-pink-500 to-purple-500" },
  { label: "Teal-Blue", value: "from-teal-400 to-blue-600" },
  { label: "Yellow-Orange", value: "from-yellow-400 to-orange-500" },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function moduleColor(mod: string) {
  const map: Record<string, string> = {
    POS: "bg-green-100 text-green-700",
    HR: "bg-purple-100 text-purple-700",
    Accounting: "bg-orange-100 text-orange-700",
    "PDF Tools": "bg-red-100 text-red-700",
    System: "bg-blue-100 text-blue-700",
  };
  return map[mod] ?? "bg-gray-100 text-gray-700";
}

export default function ProfileModule() {
  const profile = useProfileStore();
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const initialsRef = useRef<HTMLInputElement>(null);

  const upd = (key: string, val: string | boolean | number) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    profile.updateProfile({
      fullName: draft.fullName,
      displayName: draft.displayName,
      email: draft.email,
      phone: draft.phone,
      jobTitle: draft.jobTitle,
      department: draft.department,
      bio: draft.bio,
      avatarInitials: draft.avatarInitials,
      avatarColor: draft.avatarColor,
      location: draft.location,
    });
    profile.addActivity({ action: "Updated profile information", module: "System" });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setEditing(false);
  };

  const handlePasswordChange = () => {
    setPasswordError("");
    if (!passwordForm.current) return setPasswordError("Please enter your current password.");
    if (passwordForm.next.length < 8) return setPasswordError("New password must be at least 8 characters.");
    if (passwordForm.next !== passwordForm.confirm) return setPasswordError("Passwords do not match.");
    // In a real app this would call an API
    setPasswordSuccess(true);
    profile.addActivity({ action: "Changed account password", module: "System" });
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setPasswordForm({ current: "", next: "", confirm: "" });
    }, 2000);
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-500 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative flex items-start gap-5">
          {/* Avatar */}
          <div className={cn(
            "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0",
            profile.avatarColor
          )}>
            {profile.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.fullName}</h1>
              {saved && (
                <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                  <CheckCircle size={12} /> Saved
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{profile.jobTitle} · {profile.department}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <Mail size={14} className="text-gray-400" />{profile.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <MapPin size={14} className="text-gray-400" />{profile.location}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <Calendar size={14} className="text-gray-400" />
                Joined {new Date(profile.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => { setDraft({ ...profile }); setEditing(true); setActiveTab("overview"); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Module", value: settings.businessName },
            { label: "Currency", value: `${settings.currency} (${settings.currencySymbol})` },
            { label: "Activity Entries", value: profile.activityLog.length.toString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main form */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={16} className="text-gray-400" /> Personal Information
              </h3>
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { k: "fullName", label: "Full Name", placeholder: "Your full name" },
                    { k: "displayName", label: "Display Name", placeholder: "Short display name" },
                    { k: "email", label: "Email Address", placeholder: "you@example.com" },
                    { k: "phone", label: "Phone Number", placeholder: "+1 555 000-0000" },
                    { k: "jobTitle", label: "Job Title", placeholder: "e.g. Manager" },
                    { k: "department", label: "Department", placeholder: "e.g. Operations" },
                    { k: "location", label: "Location", placeholder: "City, Country" },
                  ].map(({ k, label, placeholder }) => (
                    <div key={k} className={k === "email" || k === "location" ? "col-span-2" : ""}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type="text"
                        value={(draft as unknown as Record<string, string>)[k] ?? ""}
                        onChange={(e) => upd(k, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                    <textarea
                      value={draft.bio}
                      onChange={(e) => upd("bio", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Short description about yourself..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: "Full Name", value: profile.fullName },
                    { icon: Mail, label: "Email", value: profile.email },
                    { icon: Phone, label: "Phone", value: profile.phone },
                    { icon: Briefcase, label: "Job Title", value: profile.jobTitle },
                    { icon: Building, label: "Department", value: profile.department },
                    { icon: MapPin, label: "Location", value: profile.location },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <Icon size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
                      <span className="text-sm text-gray-800">{value}</span>
                    </div>
                  ))}
                  {profile.bio && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div className="flex items-center justify-end gap-3">
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <X size={15} /> Cancel
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium">
                  <Save size={15} /> Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Avatar customizer */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Avatar</h3>
              <div className={cn(
                "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold mx-auto mb-3",
                editing ? draft.avatarColor : profile.avatarColor
              )}>
                {editing ? draft.avatarInitials : profile.avatarInitials}
              </div>
              {editing && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Initials (max 2)</label>
                    <input
                      ref={initialsRef}
                      type="text"
                      maxLength={2}
                      value={draft.avatarInitials}
                      onChange={(e) => upd("avatarInitials", e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
                    <div className="grid grid-cols-3 gap-2">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => upd("avatarColor", c.value)}
                          title={c.label}
                          className={cn(
                            "h-8 rounded-lg bg-gradient-to-br transition-all",
                            c.value,
                            draft.avatarColor === c.value ? "ring-2 ring-offset-1 ring-gray-800 scale-105" : "hover:scale-105"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { icon: Key, label: "Change Password", action: () => setShowPasswordModal(true) },
                  { icon: Shield, label: "Security Settings", action: () => setActiveTab("security") },
                  { icon: Activity, label: "View Activity", action: () => setActiveTab("activity") },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <Icon size={15} className="text-gray-400" />
                    <span className="flex-1 text-left">{label}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" /> Password
            </h3>
            <p className="text-xs text-gray-500 mb-4">Keep your account secure with a strong password</p>
            <div className="flex items-center justify-between py-3 border border-gray-100 rounded-lg px-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Password set</p>
                  <p className="text-xs text-gray-400">Last changed: Never</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Key size={15} /> Change Password
            </button>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Shield size={16} className="text-gray-400" /> Two-Factor Authentication
            </h3>
            <p className="text-xs text-gray-500 mb-4">Add an extra layer of security to your account</p>
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border mb-4",
              profile.twoFactorEnabled ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
            )}>
              <div className="flex items-center gap-2">
                {profile.twoFactorEnabled
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <AlertTriangle size={16} className="text-amber-500" />
                }
                <span className={cn("text-sm font-medium", profile.twoFactorEnabled ? "text-green-700" : "text-amber-700")}>
                  {profile.twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                profile.updateProfile({ twoFactorEnabled: !profile.twoFactorEnabled });
                profile.addActivity({
                  action: `Two-factor authentication ${profile.twoFactorEnabled ? "disabled" : "enabled"}`,
                  module: "System",
                });
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                profile.twoFactorEnabled
                  ? "border border-red-300 text-red-600 hover:bg-red-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Shield size={15} />
              {profile.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>

          {/* Session timeout */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" /> Session Timeout
            </h3>
            <p className="text-xs text-gray-500 mb-4">Automatically log out after inactivity</p>
            <select
              value={profile.sessionTimeout}
              onChange={(e) => {
                profile.updateProfile({ sessionTimeout: parseInt(e.target.value) });
                profile.addActivity({ action: `Session timeout set to ${e.target.value} minutes`, module: "System" });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-4"
            >
              {[15, 30, 60, 120, 240, 480].map((m) => (
                <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? "s" : ""}`}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock size={12} />
              Current setting: {profile.sessionTimeout < 60 ? `${profile.sessionTimeout} minutes` : `${profile.sessionTimeout / 60} hour${profile.sessionTimeout > 60 ? "s" : ""}`}
            </p>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" /> Danger Zone
            </h3>
            <p className="text-xs text-gray-500 mb-4">Irreversible actions — proceed with caution</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (confirm("Clear all activity logs? This cannot be undone.")) {
                    profile.clearActivity();
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} /> Clear Activity Log
              </button>
              <button
                onClick={() => alert("In a real app this would end your session.")}
                className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
              <p className="text-xs text-gray-500 mt-0.5">{profile.activityLog.length} entries recorded</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Clear all activity logs?")) profile.clearActivity();
              }}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Clear All
            </button>
          </div>

          {profile.activityLog.length === 0 ? (
            <div className="py-16 text-center">
              <RefreshCw size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {profile.activityLog.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Activity size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{entry.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", moduleColor(entry.module))}>
                    {entry.module}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">{formatRelativeTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Key size={18} className="text-gray-500" /> Change Password
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordForm({ current: "", next: "", confirm: "" }); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-800">Password changed successfully!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "current", label: "Current Password", show: showCurrentPwd, toggle: () => setShowCurrentPwd(v => !v) },
                  { key: "next", label: "New Password", show: showNewPwd, toggle: () => setShowNewPwd(v => !v) },
                  { key: "confirm", label: "Confirm New Password", show: showConfirmPwd, toggle: () => setShowConfirmPwd(v => !v) },
                ].map(({ key, label, show, toggle }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? "text" : "password"}
                        value={passwordForm[key as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}

                {passwordForm.next && (
                  <div className="text-xs space-y-1">
                    {[
                      { ok: passwordForm.next.length >= 8, text: "At least 8 characters" },
                      { ok: /[A-Z]/.test(passwordForm.next), text: "One uppercase letter" },
                      { ok: /[0-9]/.test(passwordForm.next), text: "One number" },
                    ].map(({ ok, text }) => (
                      <div key={text} className={cn("flex items-center gap-1.5", ok ? "text-green-600" : "text-gray-400")}>
                        <CheckCircle size={11} className={ok ? "text-green-500" : "text-gray-300"} />
                        {text}
                      </div>
                    ))}
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={15} /> {passwordError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowPasswordModal(false); setPasswordError(""); }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
