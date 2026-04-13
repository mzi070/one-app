"use client";

import { useState } from "react";
import {
  Building2,
  ShoppingCart,
  Users,
  Bell,
  Palette,
  RotateCcw,
  Save,
  CheckCircle,
  Info,
  Globe,
  Clock,
  DollarSign,
  Receipt,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import { useSettingsStore, defaultSettings, useThemeStore } from "@/store";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "pos" | "hr" | "notifications" | "appearance";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "pos", label: "Point of Sale", icon: ShoppingCart },
  { id: "hr", label: "HR & Payroll", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const currencies = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "MVR", symbol: "ރ", label: "Maldivian Rufiyaa" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit" },
];

const timezones = [
  "UTC",
  "UTC+1 (Europe/London)",
  "UTC+2 (Europe/Berlin)",
  "UTC+3 (Asia/Riyadh)",
  "UTC+4 (Asia/Dubai)",
  "UTC+5 (Asia/Karachi)",
  "UTC+5:30 (Asia/Kolkata)",
  "UTC+6 (Asia/Dhaka)",
  "UTC+8 (Asia/Singapore)",
  "UTC+9 (Asia/Tokyo)",
  "UTC-5 (America/New_York)",
  "UTC-6 (America/Chicago)",
  "UTC-7 (America/Denver)",
  "UTC-8 (America/Los_Angeles)",
];

const accentColors = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
];

interface InputProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}

function FormInput({ label, value, onChange, type = "text", placeholder, hint }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  hint?: string;
}

function FormSelect({ label, value, onChange, options, hint }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ml-4",
          checked ? "bg-blue-500" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon size={20} className="text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SettingsModule() {
  const settings = useSettingsStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ ...settings });

  const update = (key: string, value: string | number | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    settings.updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset all settings to default values? This cannot be undone.")) {
      settings.resetSettings();
      setDraft({ ...defaultSettings, updateSettings: settings.updateSettings, resetSettings: settings.resetSettings });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your application preferences and business information</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle size={16} />
              Changes saved
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={15} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save size={15} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Tab navigation */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1 sticky top-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={17} className={isActive ? "text-blue-600" : "text-gray-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <SectionHeader icon={Building2} title="Business Profile" subtitle="Your company information displayed across the app" />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Business Name"
                  value={draft.businessName}
                  onChange={(v) => update("businessName", v)}
                  placeholder="Your Business Name"
                />
                <FormInput
                  label="Business Email"
                  value={draft.businessEmail}
                  onChange={(v) => update("businessEmail", v)}
                  type="email"
                  placeholder="info@yourbusiness.com"
                />
                <FormInput
                  label="Phone Number"
                  value={draft.businessPhone}
                  onChange={(v) => update("businessPhone", v)}
                  placeholder="+1 (555) 000-0000"
                />
                <FormInput
                  label="Business Address"
                  value={draft.businessAddress}
                  onChange={(v) => update("businessAddress", v)}
                  placeholder="123 Main Street, City"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={17} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Locale & Format</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Currency"
                    value={draft.currency}
                    onChange={(v) => {
                      const c = currencies.find((cur) => cur.code === v);
                      update("currency", v);
                      if (c) update("currencySymbol", c.symbol);
                    }}
                    options={currencies.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol}) – ${c.label}` }))}
                    hint="Used in POS, invoices, and financial reports"
                  />
                  <FormSelect
                    label="Language"
                    value={draft.language}
                    onChange={(v) => update("language", v)}
                    options={[
                      { value: "English", label: "English" },
                      { value: "Arabic", label: "Arabic (العربية)" },
                      { value: "French", label: "French (Français)" },
                      { value: "Spanish", label: "Spanish (Español)" },
                      { value: "German", label: "German (Deutsch)" },
                    ]}
                  />
                  <FormSelect
                    label="Date Format"
                    value={draft.dateFormat}
                    onChange={(v) => update("dateFormat", v)}
                    options={[
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY (EU)" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                      { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY" },
                    ]}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      Timezone
                    </label>
                    <select
                      value={draft.timezone}
                      onChange={(e) => update("timezone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── POS ── */}
          {activeTab === "pos" && (
            <div className="space-y-6">
              <SectionHeader icon={ShoppingCart} title="Point of Sale" subtitle="Configure POS behaviour, tax, and receipt settings" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={17} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Tax & Payment</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Tax Rate (%)"
                    value={draft.taxRate}
                    onChange={(v) => update("taxRate", parseFloat(v) || 0)}
                    type="number"
                    hint="Applied to all sales unless overridden per product"
                  />
                  <FormSelect
                    label="Default Payment Method"
                    value={draft.defaultPaymentMethod}
                    onChange={(v) => update("defaultPaymentMethod", v)}
                    options={[
                      { value: "cash", label: "Cash" },
                      { value: "card", label: "Card" },
                      { value: "transfer", label: "Bank Transfer" },
                      { value: "mobile", label: "Mobile Payment" },
                    ]}
                  />
                  <FormInput
                    label="Low Stock Threshold"
                    value={draft.lowStockThreshold}
                    onChange={(v) => update("lowStockThreshold", parseInt(v) || 0)}
                    type="number"
                    hint="Trigger a low-stock alert when quantity falls below this"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt size={17} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Receipt Customization</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header Message</label>
                    <textarea
                      value={draft.receiptHeader}
                      onChange={(e) => update("receiptHeader", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Printed at the top of every receipt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
                    <textarea
                      value={draft.receiptFooter}
                      onChange={(e) => update("receiptFooter", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Printed at the bottom of every receipt"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Receipt Preview</p>
                <div className="bg-white rounded p-4 font-mono text-xs text-gray-700 space-y-1 shadow-sm max-w-xs mx-auto text-center">
                  <p className="font-bold text-sm">{draft.businessName}</p>
                  <p className="text-gray-500">{draft.businessPhone}</p>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <p className="text-gray-500 italic">{draft.receiptHeader}</p>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-between"><span>Sample Item x1</span><span>{draft.currencySymbol}10.00</span></div>
                  <div className="flex justify-between text-gray-500"><span>Tax ({draft.taxRate}%)</span><span>{draft.currencySymbol}{(10 * draft.taxRate / 100).toFixed(2)}</span></div>
                  <div className="border-t border-gray-300 my-1" />
                  <div className="flex justify-between font-bold"><span>TOTAL</span><span>{draft.currencySymbol}{(10 + 10 * draft.taxRate / 100).toFixed(2)}</span></div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <p className="text-gray-500 italic text-[10px]">{draft.receiptFooter}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── HR ── */}
          {activeTab === "hr" && (
            <div className="space-y-6">
              <SectionHeader icon={Users} title="HR & Payroll" subtitle="Configure work schedules, leave policies, and payroll rules" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={17} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Work Schedule</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Work Hours Per Day"
                    value={draft.workHoursPerDay}
                    onChange={(v) => update("workHoursPerDay", parseFloat(v) || 8)}
                    type="number"
                    hint="Standard daily working hours"
                  />
                  <FormSelect
                    label="Work Days Per Week"
                    value={draft.workDaysPerWeek}
                    onChange={(v) => update("workDaysPerWeek", parseInt(v))}
                    options={[
                      { value: 4, label: "4 days" },
                      { value: 5, label: "5 days" },
                      { value: 6, label: "6 days" },
                      { value: 7, label: "7 days" },
                    ]}
                  />
                  <FormInput
                    label="Overtime Rate Multiplier"
                    value={draft.overtimeMultiplier}
                    onChange={(v) => update("overtimeMultiplier", parseFloat(v) || 1.5)}
                    type="number"
                    hint="e.g. 1.5 = 150% of regular hourly rate"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays size={17} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Leave Policy</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Annual Leave Days"
                    value={draft.annualLeaveDays}
                    onChange={(v) => update("annualLeaveDays", parseInt(v) || 0)}
                    type="number"
                    hint="Paid annual leave days per year"
                  />
                  <FormInput
                    label="Sick Leave Days"
                    value={draft.sickLeaveDays}
                    onChange={(v) => update("sickLeaveDays", parseInt(v) || 0)}
                    type="number"
                    hint="Paid sick leave days per year"
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                  <Info size={15} />
                  Work Schedule Summary
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded p-3 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-800">{draft.workHoursPerDay * draft.workDaysPerWeek}</p>
                    <p className="text-xs text-gray-500">Hours / Week</p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-800">{draft.annualLeaveDays}</p>
                    <p className="text-xs text-gray-500">Annual Leave Days</p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-800">{draft.overtimeMultiplier}x</p>
                    <p className="text-xs text-gray-500">Overtime Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <SectionHeader icon={Bell} title="Notifications" subtitle="Choose which alerts and reminders you receive" />

              <div className="space-y-0">
                <Toggle
                  label="Sales Notifications"
                  description="Get notified when new sales are completed or payment received"
                  checked={draft.salesNotifications}
                  onChange={(v) => update("salesNotifications", v)}
                />
                <Toggle
                  label="Low Stock Alerts"
                  description={`Alert when product stock falls below ${draft.lowStockThreshold} units`}
                  checked={draft.lowStockAlerts}
                  onChange={(v) => update("lowStockAlerts", v)}
                />
                <Toggle
                  label="HR Reminders"
                  description="Reminders for pending leave requests, upcoming payroll, and attendance issues"
                  checked={draft.hrReminders}
                  onChange={(v) => update("hrReminders", v)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
                <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Notifications are shown as in-app alerts. Email notifications require email configuration in your hosting environment.
                </p>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <SectionHeader icon={Palette} title="Appearance" subtitle="Customize the look and feel of your application" />

              {/* Dark Mode */}
              <div className="border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Dark Mode</p>
                    <p className="text-xs text-gray-500 mt-0.5">Switch between light and dark interface</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isDark ? "bg-blue-500" : "bg-gray-200"
                    )}
                    role="switch"
                    aria-checked={isDark}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        isDark ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => update("accentColor", color.value)}
                      title={color.label}
                      className={cn(
                        "w-10 h-10 rounded-full transition-all",
                        color.class,
                        draft.accentColor === color.value
                          ? "ring-2 ring-offset-2 ring-gray-800 scale-110"
                          : "hover:scale-105"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Selected: {accentColors.find((c) => c.value === draft.accentColor)?.label}</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Layout Options</label>
                <div className="space-y-0">
                  <Toggle
                    label="Compact Mode"
                    description="Reduce padding and spacing for a denser information display"
                    checked={draft.compactMode}
                    onChange={(v) => update("compactMode", v)}
                  />
                  <Toggle
                    label="Sidebar Open by Default"
                    description="Start with the navigation sidebar expanded on page load"
                    checked={draft.sidebarDefaultOpen}
                    onChange={(v) => update("sidebarDefaultOpen", v)}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
                <div className="flex gap-3">
                  {/* Mini sidebar preview */}
                  <div className="w-40 bg-gray-900 rounded-lg p-3 text-white text-xs space-y-1.5">
                    <div className={cn("w-full h-1.5 rounded", accentColors.find((c) => c.value === draft.accentColor)?.class)} />
                    <p className="font-bold text-[10px] opacity-70">OneApp</p>
                    {["Dashboard", "POS", "HR", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded",
                          i === 0 ? accentColors.find((c) => c.value === draft.accentColor)?.class + " bg-opacity-20" : "opacity-50"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? accentColors.find((c) => c.value === draft.accentColor)?.class : "bg-gray-500")} />
                        {item}
                      </div>
                    ))}
                  </div>
                  {/* Mini content preview */}
                  <div className={cn("flex-1 bg-white rounded-lg border border-gray-200", draft.compactMode ? "p-2" : "p-4")}>
                    <div className={cn("h-2 rounded bg-gray-200 mb-2", draft.compactMode ? "w-1/2" : "w-2/3")} />
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={cn("rounded", accentColors.find((c) => c.value === draft.accentColor)?.class, "bg-opacity-10", draft.compactMode ? "h-6" : "h-10")} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About section */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">1A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">OneApp v1.0.0</p>
            <p className="text-xs text-gray-500">All-in-One Business Management Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Database connected
          </span>
          <span>Next.js 16 · MongoDB · Tailwind CSS</span>
        </div>
      </div>
    </div>
  );
}
