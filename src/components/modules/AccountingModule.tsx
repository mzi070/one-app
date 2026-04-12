"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { notify } from "@/store";
import {
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  Plus,
  Search,
  X,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Receipt,
  Building,
  Calculator,
  ChevronRight,
  Trash2,
  Eye,
  XCircle,
  Edit3,
  Copy,
  Printer,
  CreditCard,
  Mail,
  RotateCcw,
  Tag,
  Filter,
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Calendar,
  ArrowLeftRight,
  Banknote,
  Receipt as ReceiptIcon,
  Building2,
  Users,
  Briefcase,
  FilePlus,
  FileCheck,
  FileX,
  FileText as FileTextIcon,
  Power,
} from "lucide-react";
import { formatCurrency, generateInvoiceNumber, formatDate, formatRelativeTime } from "@/lib/utils";
import { getInvoiceStatusInfo, getExpenseStatusInfo, getDefaultAccounts, calculateProfitLoss, generateBalanceSheet, generateProfitLoss } from "@/lib/accounting";
import { AccStatCard, InvoiceStatusBadge, ExpenseStatusBadge, AccSearchFilterBar, AccCurrencyInput, AccDataTable } from "@/components/accounting/AccountingComponents";

type AccView = "overview" | "invoices" | "expenses" | "accounts" | "journal" | "reports" | "budget" | "assets";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Invoice {
  id: string;
  customer: string;
  email: string;
  amount: number;
  subtotal: number;
  tax: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  dueDate: string;
  issueDate: string;
  paidAt: string | null;
  description: string;
  items: { description: string; qty: number; rate: number }[];
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  status: "approved" | "pending" | "rejected";
  notes?: string;
  receipt?: string;
}

interface Account {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  balance: number;
  description?: string;
  isActive?: boolean;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: string;
  credit: string;
  amount: number;
  posted: boolean;
}

// ── API Mapping Helpers ───────────────────────────────────────────────────────
function mapInvoice(raw: any): Invoice {
  return {
    id: raw.invoiceNumber,
    customer: raw.customerName,
    email: raw.customerEmail || "",
    amount: raw.total,
    subtotal: raw.subtotal,
    tax: raw.taxAmount,
    status: raw.status,
    dueDate: raw.dueDate ? String(raw.dueDate).split("T")[0] : "",
    issueDate: raw.issueDate ? String(raw.issueDate).split("T")[0] : "",
    paidAt: raw.paidAt ? String(raw.paidAt).split("T")[0] : null,
    description: raw.description || "",
    items: (() => { try { return JSON.parse(raw.items || "[]"); } catch { return []; } })(),
  };
}

function mapExpense(raw: any): Expense {
  return {
    id: raw.id,
    category: raw.category,
    description: raw.description,
    amount: raw.amount,
    date: raw.date ? String(raw.date).split("T")[0] : "",
    vendor: raw.vendor || "",
    status: raw.status,
    notes: raw.notes || "",
  };
}

function mapAccount(raw: any): Account {
  return {
    code: raw.code,
    name: raw.name,
    type: raw.type,
    balance: raw.balance,
    description: raw.description || "",
    isActive: raw.isActive ?? true,
  };
}

function mapJournalEntry(raw: any): JournalEntry {
  return {
    id: raw.id,
    date: raw.date ? String(raw.date).split("T")[0] : "",
    description: raw.description,
    reference: raw.reference || "—",
    debit: raw.debitAccount,
    credit: raw.creditAccount,
    amount: raw.amount,
    posted: raw.posted,
  };
}

const SEED_ACCOUNTS: Account[] = [
  { code: "1100", name: "Cash & Bank", type: "Asset", balance: 0, description: "Cash on hand and bank accounts", isActive: true },
  { code: "1200", name: "Accounts Receivable", type: "Asset", balance: 0, description: "Amounts owed by customers", isActive: true },
  { code: "1300", name: "Inventory", type: "Asset", balance: 0, description: "Goods held for resale", isActive: true },
  { code: "1400", name: "Prepaid Expenses", type: "Asset", balance: 0, description: "Expenses paid in advance", isActive: true },
  { code: "1500", name: "Fixed Assets", type: "Asset", balance: 0, description: "Property, plant & equipment", isActive: true },
  { code: "2100", name: "Accounts Payable", type: "Liability", balance: 0, description: "Amounts owed to suppliers", isActive: true },
  { code: "2200", name: "Accrued Liabilities", type: "Liability", balance: 0, description: "Expenses incurred but not yet paid", isActive: true },
  { code: "2300", name: "Short-term Loans", type: "Liability", balance: 0, description: "Loans due within one year", isActive: true },
  { code: "2400", name: "Long-term Debt", type: "Liability", balance: 0, description: "Loans due after one year", isActive: true },
  { code: "3100", name: "Owner's Capital", type: "Equity", balance: 0, description: "Owner investment in the business", isActive: true },
  { code: "3200", name: "Retained Earnings", type: "Equity", balance: 0, description: "Accumulated profits retained in the business", isActive: true },
  { code: "4100", name: "Sales Revenue", type: "Revenue", balance: 0, description: "Revenue from sales of goods or services", isActive: true },
  { code: "4200", name: "Service Revenue", type: "Revenue", balance: 0, description: "Revenue from services rendered", isActive: true },
  { code: "4300", name: "Other Income", type: "Revenue", balance: 0, description: "Miscellaneous income", isActive: true },
  { code: "5100", name: "Cost of Goods Sold", type: "Expense", balance: 0, description: "Direct cost of goods sold", isActive: true },
  { code: "5200", name: "Salaries & Wages", type: "Expense", balance: 0, description: "Employee salaries and wages", isActive: true },
  { code: "5300", name: "Rent Expense", type: "Expense", balance: 0, description: "Office and facility rent", isActive: true },
  { code: "5400", name: "Utilities", type: "Expense", balance: 0, description: "Electricity, water, internet", isActive: true },
  { code: "5500", name: "Marketing & Advertising", type: "Expense", balance: 0, description: "Promotion and advertising costs", isActive: true },
  { code: "5600", name: "General & Administrative", type: "Expense", balance: 0, description: "General operating expenses", isActive: true },
];

// ── Root Component ────────────────────────────────────────────────────────────
export default function AccountingModule() {
  const [view, setView] = useState<AccView>("overview");
  const [loading, setLoading] = useState(true);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [showEditInvoice, setShowEditInvoice] = useState<Invoice | null>(null);
  const [showSendInvoice, setShowSendInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [showEditExpense, setShowEditExpense] = useState<Expense | null>(null);
  const [showViewExpense, setShowViewExpense] = useState<Expense | null>(null);
  const [showEditAccount, setShowEditAccount] = useState<Account | null>(null);
  const [showViewAccount, setShowViewAccount] = useState<Account | null>(null);
  const [showViewJournal, setShowViewJournal] = useState<JournalEntry | null>(null);
  const [showEditJournal, setShowEditJournal] = useState<JournalEntry | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, expRes, accRes, jeRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/expenses"),
        fetch("/api/accounts"),
        fetch("/api/journal"),
      ]);
      const [invData, expData, accData, jeData] = await Promise.all([
        invRes.json(),
        expRes.json(),
        accRes.json(),
        jeRes.json(),
      ]);
      setInvoices(Array.isArray(invData) ? invData.map(mapInvoice) : []);
      setExpenses(Array.isArray(expData) ? expData.map(mapExpense) : []);
      setAccounts(Array.isArray(accData) ? accData.map(mapAccount) : []);
      setJournalEntries(Array.isArray(jeData) ? jeData.map(mapJournalEntry) : []);
    } catch {
      // silently fail — UI shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSendInvoice = async (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "sent" } : i));
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "sent" }) });
    notify({ title: "Invoice Sent", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) has been sent.`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleMarkPaid = async (id: string, date?: string, method?: string, notes?: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const paidAt = date ?? new Date().toISOString().slice(0, 10);
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "paid", paidAt } : i));
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid", paidAt }) });
    notify({ title: "Payment Recorded", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) paid${method ? ` via ${method}` : ""}.${notes ? ` Ref: ${notes}` : ""}`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleVoidInvoice = async (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "void" } : i));
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "void" }) });
    notify({ title: "Invoice Voided", message: `Invoice ${inv.id} has been voided.`, category: "accounting", priority: "warning", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleInvoiceCreated = async (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });
    } catch { await loadAll(); }
    notify({ title: "Invoice Created", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) created.`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleEditInvoice = async (inv: Invoice) => {
    setInvoices((prev) => prev.map((i) => i.id === inv.id ? inv : i));
    try {
      await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });
    } catch { await loadAll(); }
    notify({ title: "Invoice Updated", message: `Invoice ${inv.id} for ${inv.customer} updated.`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleDeleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    notify({ title: "Invoice Deleted", message: `Invoice ${id} has been deleted.`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleDuplicateInvoice = async (inv: Invoice) => {
    const newInv: Invoice = { ...inv, id: generateInvoiceNumber(), status: "draft", issueDate: new Date().toISOString().slice(0, 10), paidAt: null };
    setInvoices((prev) => [newInv, ...prev]);
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInv),
      });
    } catch { await loadAll(); }
    notify({ title: "Invoice Duplicated", message: `${inv.id} duplicated as ${newInv.id} (draft).`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleApproveExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "approved" } : e));
    await fetch(`/api/expenses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) });
    notify({ title: "Expense Approved", message: `${exp.description} (${formatCurrency(exp.amount)}) from ${exp.vendor} approved.`, category: "accounting", priority: "success", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleRejectExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "rejected" } : e));
    await fetch(`/api/expenses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) });
    notify({ title: "Expense Rejected", message: `${exp.description} (${formatCurrency(exp.amount)}) has been rejected.`, category: "accounting", priority: "error", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleDeleteExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (exp) notify({ title: "Expense Deleted", message: `${exp.description} (${formatCurrency(exp.amount)}) deleted.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleEditExpense = async (exp: Expense) => {
    setExpenses((prev) => prev.map((e) => e.id === exp.id ? exp : e));
    try {
      await fetch(`/api/expenses/${exp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exp),
      });
    } catch { await loadAll(); }
    notify({ title: "Expense Updated", message: `${exp.description} (${formatCurrency(exp.amount)}) updated and resubmitted for approval.`, category: "accounting", priority: "success", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleResubmitExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "pending" } : e));
    await fetch(`/api/expenses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "pending" }) });
    notify({ title: "Expense Resubmitted", message: `${exp.description} (${formatCurrency(exp.amount)}) resubmitted for approval.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleExpenseAdded = async (exp: Expense) => {
    setExpenses((prev) => [exp, ...prev]);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exp),
      });
    } catch { await loadAll(); }
    notify({ title: "Expense Submitted", message: `${exp.description} (${formatCurrency(exp.amount)}) submitted for approval.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleAccountAdded = async (acc: Account) => {
    setAccounts((prev) => [...prev, acc].sort((a, b) => a.code.localeCompare(b.code)));
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acc),
      });
    } catch { await loadAll(); }
    notify({ title: "Account Added", message: `${acc.name} (${acc.code}) added to chart of accounts.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleEditAccount = async (acc: Account) => {
    setAccounts((prev) => prev.map((a) => a.code === acc.code ? acc : a).sort((a, b) => a.code.localeCompare(b.code)));
    try {
      await fetch(`/api/accounts/${acc.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acc),
      });
    } catch { await loadAll(); }
    notify({ title: "Account Updated", message: `${acc.name} (${acc.code}) has been updated.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleDeleteAccount = async (code: string) => {
    const acc = accounts.find((a) => a.code === code);
    setAccounts((prev) => prev.filter((a) => a.code !== code));
    await fetch(`/api/accounts/${code}`, { method: "DELETE" });
    if (acc) notify({ title: "Account Removed", message: `${acc.name} (${acc.code}) removed from chart of accounts.`, category: "accounting", priority: "info", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleToggleAccountActive = async (code: string) => {
    const acc = accounts.find((a) => a.code === code);
    if (!acc) return;
    const newActive = acc.isActive === false;
    setAccounts((prev) => prev.map((a) => a.code === code ? { ...a, isActive: newActive } : a));
    await fetch(`/api/accounts/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: newActive }) });
    notify({ title: newActive ? "Account Activated" : "Account Deactivated", message: `${acc.name} (${acc.code}) is now ${newActive ? "active" : "inactive"}.`, category: "accounting", priority: "info", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleAdjustBalance = async (code: string, newBalance: number, memo: string) => {
    const acc = accounts.find((a) => a.code === code);
    if (!acc) return;
    const diff = parseFloat((newBalance - acc.balance).toFixed(2));
    if (Math.abs(diff) < 0.01) return;
    setAccounts((prev) => prev.map((a) => a.code === code ? { ...a, balance: newBalance } : a));
    await fetch(`/api/accounts/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBalance }) });
    const je: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      description: memo || `Balance adjustment — ${acc.name}`,
      reference: `ADJ-${acc.code}`,
      debit: diff > 0 ? acc.name : "Retained Earnings",
      credit: diff > 0 ? "Retained Earnings" : acc.name,
      amount: Math.abs(diff),
      posted: true,
    };
    setJournalEntries((prev) => [je, ...prev]);
    await fetch("/api/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(je) });
    notify({ title: "Balance Adjusted", message: `${acc.name} adjusted by ${diff >= 0 ? "+" : ""}${formatCurrency(diff)} → ${formatCurrency(newBalance)}.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleSeedAccounts = async () => {
    const toAdd = SEED_ACCOUNTS.filter((s) => !accounts.some((a) => a.code === s.code));
    if (toAdd.length === 0) return;
    setAccounts((prev) => [...prev, ...toAdd].sort((a, b) => a.code.localeCompare(b.code)));
    await Promise.all(toAdd.map((acc) => fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(acc) })));
    notify({ title: "Chart Seeded", message: `${toAdd.length} standard accounts added.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleJournalAdded = async (je: JournalEntry) => {
    setJournalEntries((prev) => [je, ...prev]);
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(je),
      });
    } catch { await loadAll(); }
    notify({ title: je.posted ? "Journal Entry Posted" : "Journal Entry Saved as Draft", message: `${je.description} — Dr. ${je.debit} / Cr. ${je.credit} (${formatCurrency(je.amount)}).`, category: "accounting", priority: "success", actionLabel: "View Journal", actionModule: "accounting" });
  };

  const handleEditJournal = async (je: JournalEntry) => {
    setJournalEntries((prev) => prev.map((e) => e.id === je.id ? je : e));
    try {
      await fetch(`/api/journal/${je.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(je),
      });
    } catch { await loadAll(); }
    notify({ title: "Journal Entry Updated", message: `${je.id}: ${je.description} updated.`, category: "accounting", priority: "success", actionLabel: "View Journal", actionModule: "accounting" });
  };

  const handleDeleteJournal = async (id: string) => {
    const je = journalEntries.find((e) => e.id === id);
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    if (je) notify({ title: "Entry Removed", message: `Journal entry ${je.id} deleted.`, category: "accounting", priority: "info", actionLabel: "View Journal", actionModule: "accounting" });
  };

  const handleTogglePostJournal = async (id: string) => {
    const je = journalEntries.find((e) => e.id === id);
    if (!je) return;
    setJournalEntries((prev) => prev.map((e) => e.id === id ? { ...e, posted: !e.posted } : e));
    await fetch(`/api/journal/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posted: !je.posted }) });
  };

  const navItems: { id: AccView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: PieChart },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "accounts", label: "Chart of Accounts", icon: Building },
    { id: "journal", label: "Journal", icon: Calculator },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      const mNum = d.getMonth();
      const mYear = d.getFullYear();
      const month = d.toLocaleString("default", { month: "short" });
      return {
        month,
        revenue: invoices
          .filter((inv) => {
            const pd = new Date(inv.paidAt || inv.dueDate);
            return pd.getMonth() === mNum && pd.getFullYear() === mYear && inv.status === "paid";
          })
          .reduce((s, inv) => s + inv.amount, 0),
        expenses: expenses
          .filter((e) => {
            const pd = new Date(e.date);
            return pd.getMonth() === mNum && pd.getFullYear() === mYear && e.status === "approved";
          })
          .reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [invoices, expenses]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading accounting data...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                view === item.id ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {view === "overview" && <AccOverview invoices={invoices} expenses={expenses} onNavigate={setView} />}
        {view === "invoices" && (
          <InvoicesView
            invoices={invoices}
            onCreateNew={() => setShowCreateInvoice(true)}
            onEdit={(inv) => setShowEditInvoice(inv)}
            onDuplicate={handleDuplicateInvoice}
            onDelete={handleDeleteInvoice}
            onVoid={handleVoidInvoice}
            onOpenSend={(inv) => setShowSendInvoice(inv)}
            onOpenPayment={(inv) => setShowPaymentModal(inv)}
          />
        )}
        {view === "expenses" && (
          <ExpensesView
            expenses={expenses}
            onAddNew={() => setShowAddExpense(true)}
            onApprove={handleApproveExpense}
            onReject={handleRejectExpense}
            onDelete={handleDeleteExpense}
            onEdit={(exp) => setShowEditExpense(exp)}
            onView={(exp) => setShowViewExpense(exp)}
            onResubmit={handleResubmitExpense}
          />
        )}
        {view === "accounts" && <ChartOfAccountsView
            accounts={accounts}
            onAddNew={() => setShowAddAccount(true)}
            onEdit={(acc) => setShowEditAccount(acc)}
            onView={(acc) => setShowViewAccount(acc)}
            onDelete={handleDeleteAccount}
            onToggleActive={handleToggleAccountActive}
            onSeedAccounts={handleSeedAccounts}
          />}
        {view === "journal" && <JournalView entries={journalEntries} accounts={accounts} onAddEntry={() => setShowAddJournal(true)} onView={(je) => setShowViewJournal(je)} onDelete={handleDeleteJournal} onTogglePost={handleTogglePostJournal} />}
        {view === "reports" && <ReportsView invoices={invoices} expenses={expenses} accounts={accounts} journalEntries={journalEntries} monthlyData={monthlyData} />}
      </div>

      {showCreateInvoice && <InvoiceFormModal key="create" invoice={null} onClose={() => setShowCreateInvoice(false)} onSave={handleInvoiceCreated} />}
      {showEditInvoice && <InvoiceFormModal key="edit" invoice={showEditInvoice} onClose={() => setShowEditInvoice(null)} onSave={(inv) => { handleEditInvoice(inv); setShowEditInvoice(null); }} />}
      {showSendInvoice && <SendInvoiceModal invoice={showSendInvoice} onClose={() => setShowSendInvoice(null)} onSend={(id) => { handleSendInvoice(id); setShowSendInvoice(null); }} />}
      {showPaymentModal && <RecordPaymentModal invoice={showPaymentModal} onClose={() => setShowPaymentModal(null)} onRecord={(id, date, method, notes) => { handleMarkPaid(id, date, method, notes); setShowPaymentModal(null); }} />}
      {showAddExpense && <ExpenseFormModal expense={null} onClose={() => setShowAddExpense(false)} onSave={handleExpenseAdded} />}
      {showEditExpense && <ExpenseFormModal expense={showEditExpense} onClose={() => setShowEditExpense(null)} onSave={(exp) => { handleEditExpense(exp); setShowEditExpense(null); }} />}
      {showViewExpense && <ExpenseDetailModal expense={showViewExpense} onClose={() => setShowViewExpense(null)} onApprove={() => { handleApproveExpense(showViewExpense.id); setShowViewExpense(null); }} onReject={() => { handleRejectExpense(showViewExpense.id); setShowViewExpense(null); }} onEdit={(exp) => { setShowViewExpense(null); setShowEditExpense(exp); }} onDelete={(id) => { handleDeleteExpense(id); setShowViewExpense(null); }} onResubmit={() => { handleResubmitExpense(showViewExpense.id); setShowViewExpense(null); }} />}
      {showAddAccount && <AccountFormModal account={null} onClose={() => setShowAddAccount(false)} onSave={handleAccountAdded} existing={accounts} />}
      {showEditAccount && <AccountFormModal account={showEditAccount} onClose={() => setShowEditAccount(null)} onSave={(acc) => { handleEditAccount(acc); setShowEditAccount(null); }} existing={accounts} />}
      {showViewAccount && <AccountDetailModal account={showViewAccount} onClose={() => setShowViewAccount(null)} onEdit={(acc) => { setShowViewAccount(null); setShowEditAccount(acc); }} onDelete={(code) => { handleDeleteAccount(code); setShowViewAccount(null); }} journalEntries={journalEntries} onAdjustBalance={handleAdjustBalance} onToggleActive={(code) => { handleToggleAccountActive(code); setShowViewAccount((prev) => prev ? { ...prev, isActive: !(prev.isActive !== false) } : null); }} />}
      {showAddJournal && <JournalEntryFormModal entry={null} onClose={() => setShowAddJournal(false)} onSave={handleJournalAdded} accounts={accounts} />}
      {showEditJournal && <JournalEntryFormModal entry={showEditJournal} onClose={() => setShowEditJournal(null)} onSave={(je) => { handleEditJournal(je); setShowEditJournal(null); }} accounts={accounts} />}
      {showViewJournal && <JournalEntryDetailModal entry={showViewJournal} onClose={() => setShowViewJournal(null)} onEdit={(je) => { setShowViewJournal(null); setShowEditJournal(je); }} onDelete={(id) => { handleDeleteJournal(id); setShowViewJournal(null); }} onTogglePost={(id) => { handleTogglePostJournal(id); setShowViewJournal((prev) => prev ? { ...prev, posted: !prev.posted } : null); }} />}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function AccOverview({ invoices, expenses, onNavigate }: { invoices: Invoice[]; expenses: Expense[]; onNavigate: (v: AccView) => void }) {
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const receivables = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const overdueAmt = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (Paid)", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600", note: `${invoices.filter(i => i.status === "paid").length} paid invoice${invoices.filter(i => i.status === "paid").length !== 1 ? "s" : ""}` },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "bg-red-50 text-red-600", note: `${expenses.filter(e => e.status === "approved").length} approved expense${expenses.filter(e => e.status === "approved").length !== 1 ? "s" : ""}` },
          { label: "Net Income", value: formatCurrency(totalRevenue - totalExpenses), icon: DollarSign, color: "bg-blue-50 text-blue-600", note: totalRevenue - totalExpenses >= 0 ? "Profitable" : "Net loss" },
          { label: "Outstanding", value: formatCurrency(receivables), icon: Wallet, color: "bg-orange-50 text-orange-600", note: `${invoices.filter(i => i.status === "sent" || i.status === "overdue").length} invoices` },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border p-4">
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}><Icon size={18} /></div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.note}</p>
            </div>
          );
        })}
      </div>

      {overdueAmt > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Overdue Invoices</p>
              <p className="text-xs text-red-600">
                {overdueCount} invoice{overdueCount !== 1 ? "s" : ""} totalling {formatCurrency(overdueAmt)} are past due
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate("invoices")} className="text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-1 shrink-0">
            View <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
            <button onClick={() => onNavigate("invoices")} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-0.5">View All <ChevronRight size={14} /></button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{inv.customer}</p>
                  <p className="text-xs text-gray-400">{inv.id} · Due {inv.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(inv.amount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    inv.status === "void" ? "bg-gray-200 text-gray-500" :
                    "bg-gray-100 text-gray-700"
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Expenses</h3>
            <button onClick={() => onNavigate("expenses")} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-0.5">View All <ChevronRight size={14} /></button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-gray-400">{exp.category} · {exp.vendor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">-{formatCurrency(exp.amount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    exp.status === "approved" ? "bg-green-100 text-green-700" :
                    exp.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>{exp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Profit & Loss — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Revenue", value: totalRevenue, color: "text-green-700", bg: "bg-green-50" },
            { label: "Total Expenses", value: totalExpenses, color: "text-red-700", bg: "bg-red-50" },
            { label: "Net Profit", value: totalRevenue - totalExpenses, color: (totalRevenue - totalExpenses) >= 0 ? "text-blue-700" : "text-red-700", bg: (totalRevenue - totalExpenses) >= 0 ? "bg-blue-50" : "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Invoices ──────────────────────────────────────────────────────────────────
function printInvoice(inv: Invoice) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.id}</title><style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111;margin:0}
    .hdr{display:flex;justify-content:space-between;margin-bottom:30px;align-items:flex-start}
    .logo{font-size:24px;font-weight:bold;color:#ea580c}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th{background:#f9fafb;text-align:left;padding:8px 12px;border-bottom:2px solid #e5e7eb;font-size:11px;text-transform:uppercase;color:#6b7280}
    td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px}
    .totals{margin-left:auto;width:260px}
    .totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}
    .totals .total{font-weight:bold;font-size:16px;border-top:2px solid #111;padding-top:8px}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${inv.status==='paid'?'#dcfce7':inv.status==='overdue'?'#fee2e2':'#dbeafe'};color:${inv.status==='paid'?'#15803d':inv.status==='overdue'?'#dc2626':'#1d4ed8'}}
    @media print{button{display:none}}
  </style></head><body>
    <div class="hdr">
      <div><div class="logo">OneApp</div><p style="margin:4px 0;color:#6b7280;font-size:13px">Your Business Name</p></div>
      <div style="text-align:right">
        <h2 style="margin:0;font-size:26px;color:#ea580c">${inv.id}</h2>
        <p style="margin:4px 0;font-size:13px;color:#6b7280">Issued: ${inv.issueDate}</p>
        <p style="margin:4px 0;font-size:13px;color:#6b7280">Due: ${inv.dueDate}</p>
        <span class="badge">${inv.status.toUpperCase()}</span>
      </div>
    </div>
    <div style="margin-bottom:24px">
      <p style="font-weight:bold;margin:0 0 4px">Bill To:</p>
      <p style="margin:0;font-size:15px">${inv.customer}</p>
      <p style="margin:0;color:#6b7280;font-size:13px">${inv.email}</p>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${inv.items.map(item=>`<tr><td>${item.description}</td><td>${item.qty}</td><td>$${item.rate.toFixed(2)}</td><td style="text-align:right">$${(item.qty*item.rate).toFixed(2)}</td></tr>`).join("")}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>$${inv.subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Tax</span><span>$${inv.tax.toFixed(2)}</span></div>
      <div class="row total"><span>Total</span><span>$${inv.amount.toFixed(2)}</span></div>
      ${inv.paidAt?`<div class="row" style="color:#15803d"><span>Paid On</span><span>${inv.paidAt}</span></div>`:""}
    </div>
    ${inv.description?`<div style="margin-top:28px;padding:14px;background:#f9fafb;border-radius:8px;font-size:13px;color:#374151"><strong>Notes:</strong> ${inv.description}</div>`:""}
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

function InvoicesView({ invoices, onCreateNew, onEdit, onDuplicate, onDelete, onVoid, onOpenSend, onOpenPayment }: {
  invoices: Invoice[];
  onCreateNew: () => void;
  onEdit: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onDelete: (id: string) => void;
  onVoid: (id: string) => void;
  onOpenSend: (inv: Invoice) => void;
  onOpenPayment: (inv: Invoice) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "due">("date-desc");
  const today = new Date().toISOString().slice(0, 10);

  const withEff = useMemo(() => invoices.map((inv) => ({
    ...inv,
    eff: inv.status === "sent" && inv.dueDate < today ? "overdue" : inv.status,
  })), [invoices, today]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? withEff : withEff.filter((i) => i.eff === filter);
    if (search) list = list.filter((i) =>
      i.customer.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => {
      if (sortBy === "date-asc") return a.issueDate.localeCompare(b.issueDate);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "due") return a.dueDate.localeCompare(b.dueDate);
      return b.issueDate.localeCompare(a.issueDate);
    });
  }, [withEff, filter, search, sortBy]);

  const summary = useMemo(() => ({
    paid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    outstanding: withEff.filter((i) => i.eff === "sent" || i.eff === "overdue").reduce((s, i) => s + i.amount, 0),
    overdue: withEff.filter((i) => i.eff === "overdue").reduce((s, i) => s + i.amount, 0),
    draft: invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.amount, 0),
    overdueCount: withEff.filter((i) => i.eff === "overdue").length,
  }), [invoices, withEff]);

  const exportCsv = () => {
    const rows = [
      ["Invoice #", "Customer", "Email", "Issue Date", "Due Date", "Status", "Subtotal", "Tax", "Amount", "Paid At"],
      ...invoices.map((i) => [i.id, i.customer, i.email, i.issueDate, i.dueDate, i.status, i.subtotal, i.tax, i.amount, i.paidAt ?? ""]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusCls = (eff: string) =>
    eff === "paid" ? "bg-green-100 text-green-700" :
    eff === "sent" ? "bg-blue-100 text-blue-700" :
    eff === "overdue" ? "bg-red-100 text-red-700" :
    eff === "void" ? "bg-gray-200 text-gray-500" :
    "bg-gray-100 text-gray-700";

  const daysOverdue = (dueDate: string) => Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  const filterCount = (f: string) => f === "all" ? invoices.length : withEff.filter((i) => i.eff === f).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Paid", value: formatCurrency(summary.paid), count: invoices.filter((i) => i.status === "paid").length, color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "Outstanding", value: formatCurrency(summary.outstanding), count: withEff.filter((i) => i.eff === "sent" || i.eff === "overdue").length, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Overdue", value: formatCurrency(summary.overdue), count: summary.overdueCount, color: "text-red-700", bg: "bg-red-50 border-red-100" },
          { label: "Draft", value: formatCurrency(summary.draft), count: invoices.filter((i) => i.status === "draft").length, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label} <span className="text-gray-400">({s.count})</span></p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {summary.overdueCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <AlertCircle size={15} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {summary.overdueCount} invoice{summary.overdueCount > 1 ? "s" : ""} overdue · {formatCurrency(summary.overdue)} outstanding
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {(["all", "draft", "sent", "overdue", "paid", "void"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {f} <span className="text-gray-400">({filterCount(f)})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="due">By Due Date</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-44 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={exportCsv} title="Export CSV" className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <Download size={13} /> Export
          </button>
          <button onClick={onCreateNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> New Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Customer</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs hidden sm:table-cell">Issued</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Due</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No invoices match your filter</td></tr>
            )}
            {filtered.map((inv) => {
              const od = inv.eff === "overdue" ? daysOverdue(inv.dueDate) : 0;
              return (
                <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-orange-700 whitespace-nowrap text-xs">{inv.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-sm">{inv.customer}</p>
                    <p className="text-xs text-gray-400">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500 hidden sm:table-cell">{inv.issueDate}</td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-xs text-gray-500">{inv.dueDate}</p>
                    {od > 0 && <p className="text-xs text-red-500 font-medium">{od}d overdue</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(inv.amount)}</p>
                    <p className="text-xs text-gray-400">{inv.items.length} item{inv.items.length !== 1 ? "s" : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCls(inv.eff)}`}>
                      {inv.eff.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1 flex-wrap">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="View"><Eye size={13} /></button>
                      {inv.status === "draft" && (
                        <>
                          <button onClick={() => onEdit(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Edit"><Edit3 size={13} /></button>
                          <button onClick={() => onOpenSend(inv)} className="p-1.5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100" title="Send"><Send size={13} /></button>
                        </>
                      )}
                      {(inv.eff === "sent" || inv.eff === "overdue") && (
                        <button onClick={() => onOpenPayment(inv)} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Record Payment"><CreditCard size={13} /></button>
                      )}
                      {(inv.status === "draft" || inv.eff === "sent") && (
                        <button onClick={() => { if (confirm(`Void invoice ${inv.id}?`)) onVoid(inv.id); }} className="p-1.5 rounded bg-red-50 text-red-400 hover:bg-red-100" title="Void"><XCircle size={13} /></button>
                      )}
                      <button onClick={() => onDuplicate(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Duplicate"><Copy size={13} /></button>
                      {(inv.status === "draft" || inv.status === "void") && (
                        <button onClick={() => { if (confirm(`Delete ${inv.id}? This cannot be undone.`)) onDelete(inv.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                      )}
                      <button onClick={() => printInvoice(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Print / PDF"><Printer size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-2 flex justify-end text-xs text-gray-400">
          {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} · Total:&nbsp;<span className="font-semibold text-gray-700">{formatCurrency(filtered.reduce((s, i) => s + i.amount, 0))}</span>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={(inv) => { setSelectedInvoice(null); onEdit(inv); }}
          onSend={(inv) => { setSelectedInvoice(null); onOpenSend(inv); }}
          onPayment={(inv) => { setSelectedInvoice(null); onOpenPayment(inv); }}
          onDuplicate={(inv) => { setSelectedInvoice(null); onDuplicate(inv); }}
          onVoid={(id) => { setSelectedInvoice(null); onVoid(id); }}
        />
      )}
    </div>
  );
}

function InvoiceDetailModal({ invoice: inv, onClose, onEdit, onSend, onPayment, onDuplicate, onVoid }: {
  invoice: Invoice;
  onClose: () => void;
  onEdit: (inv: Invoice) => void;
  onSend: (inv: Invoice) => void;
  onPayment: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onVoid: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const eff = inv.status === "sent" && inv.dueDate < today ? "overdue" : inv.status;
  const odDays = eff === "overdue" ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0;

  const statusBg =
    eff === "paid" ? "bg-green-50 text-green-700 border-green-200" :
    eff === "overdue" ? "bg-red-50 text-red-700 border-red-200" :
    eff === "sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
    eff === "void" ? "bg-gray-100 text-gray-500 border-gray-200" :
    "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h3 className="text-xl font-bold text-orange-700">{inv.id}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Issued {inv.issueDate} · Due {inv.dueDate}</p>
          </div>
          <div className="flex items-center gap-1">
            {inv.status === "draft" && <button onClick={() => onEdit(inv)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Edit Invoice"><Edit3 size={15} /></button>}
            <button onClick={() => onDuplicate(inv)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Duplicate"><Copy size={15} /></button>
            <button onClick={() => printInvoice(inv)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Print / PDF"><Printer size={15} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 ml-1"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-semibold text-sm ${statusBg}`}>
            <span>{eff.toUpperCase()}</span>
            <span className="font-normal text-xs">
              {inv.paidAt ? `Paid on ${inv.paidAt}` : odDays > 0 ? `${odDays} days overdue` : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bill To</p>
              <p className="font-semibold text-gray-800">{inv.customer}</p>
              <p className="text-sm text-gray-500">{inv.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Invoice Details</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Items:</span> {inv.items.length} line item{inv.items.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Subtotal:</span> {formatCurrency(inv.subtotal)}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Tax:</span> {formatCurrency(inv.tax)}</p>
            </div>
          </div>

          {inv.description && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-600">{inv.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Line Items</p>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Rate</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2.5 text-gray-700">{item.description}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{item.qty}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{formatCurrency(item.rate)}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(item.qty * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{formatCurrency(inv.tax)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-orange-700">{formatCurrency(inv.amount)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t flex-wrap">
            {inv.status === "draft" && (
              <>
                <button onClick={() => onEdit(inv)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 min-w-[110px]">
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => onSend(inv)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5 min-w-[110px]">
                  <Send size={14} /> Send Invoice
                </button>
              </>
            )}
            {(eff === "sent" || eff === "overdue") && (
              <button onClick={() => onPayment(inv)} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
                <CreditCard size={14} /> Record Payment
              </button>
            )}
            <button onClick={() => printInvoice(inv)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expenses ──────────────────────────────────────────────────────────────────
function ExpensesView({ expenses, onAddNew, onApprove, onReject, onDelete, onEdit, onView, onResubmit }: {
  expenses: Expense[];
  onAddNew: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (exp: Expense) => void;
  onView: (exp: Expense) => void;
  onResubmit: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category">("date-desc");
  const [dateRange, setDateRange] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(true);

  const CATEGORIES = ["Office Supplies", "Software", "Travel", "Marketing", "Utilities", "Maintenance", "Salaries", "Rent", "Other"];

  const categories = useMemo(() => {
    const fromData = Array.from(new Set(expenses.map((e) => e.category)));
    const merged = Array.from(new Set([...fromData, ...CATEGORIES])).sort();
    return ["all", ...merged];
  }, [expenses]);

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
  const thisQtrStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = expenses.filter((e) => {
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.vendor.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateRange === "this-month" && e.date < thisMonthStart) return false;
      if (dateRange === "last-month" && (e.date < lastMonthStart || e.date > lastMonthEnd)) return false;
      if (dateRange === "this-qtr" && e.date < thisQtrStart) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return b.date.localeCompare(a.date);
    });
  }, [expenses, catFilter, statusFilter, search, sortBy, dateRange, thisMonthStart, lastMonthStart, lastMonthEnd, thisQtrStart]);

  const summary = useMemo(() => ({
    approved: expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0),
    rejected: expenses.filter((e) => e.status === "rejected").reduce((s, e) => s + e.amount, 0),
    pendingCount: expenses.filter((e) => e.status === "pending").length,
    approvedCount: expenses.filter((e) => e.status === "approved").length,
    total: expenses.reduce((s, e) => s + e.amount, 0),
  }), [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter((e) => e.status === "approved").forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [expenses]);

  const maxCatAmount = categoryBreakdown[0]?.[1] ?? 1;

  const exportCsv = () => {
    const rows = [
      ["ID", "Date", "Description", "Category", "Vendor", "Amount", "Status", "Receipt", "Notes"],
      ...expenses.map((e) => [e.id, e.date, e.description, e.category, e.vendor, e.amount, e.status, e.receipt ?? "", e.notes ?? ""]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusCls = (s: string) =>
    s === "approved" ? "bg-green-100 text-green-700" :
    s === "pending" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  const catColors = ["bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-green-500", "bg-red-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-yellow-500"];

  return (
    <div className="max-w-6xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border p-3 bg-green-50 border-green-100">
          <p className="text-xs text-gray-500">Approved <span className="text-gray-400">({summary.approvedCount})</span></p>
          <p className="text-xl font-bold mt-0.5 text-green-700">{formatCurrency(summary.approved)}</p>
        </div>
        <div className="rounded-xl border p-3 bg-yellow-50 border-yellow-100">
          <p className="text-xs text-gray-500">Pending <span className="text-gray-400">({summary.pendingCount})</span></p>
          <p className="text-xl font-bold mt-0.5 text-yellow-700">{formatCurrency(summary.pending)}</p>
        </div>
        <div className="rounded-xl border p-3 bg-red-50 border-red-100">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="text-xl font-bold mt-0.5 text-red-700">{formatCurrency(summary.rejected)}</p>
        </div>
        <div className="rounded-xl border p-3 bg-gray-50 border-gray-200">
          <p className="text-xs text-gray-500">Total Submitted</p>
          <p className="text-xl font-bold mt-0.5 text-gray-700">{formatCurrency(summary.total)}</p>
        </div>
      </div>

      {/* Pending alert */}
      {summary.pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
          <AlertCircle size={15} className="text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">
            {summary.pendingCount} expense{summary.pendingCount > 1 ? "s" : ""} pending approval · {formatCurrency(summary.pending)}
          </p>
        </div>
      )}

      {/* Analytics */}
      {showAnalytics && categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Spending by Category (Approved)</p>
            <button onClick={() => setShowAnalytics(false)} className="text-xs text-gray-400 hover:text-gray-600">Hide</button>
          </div>
          <div className="space-y-2">
            {categoryBreakdown.map(([cat, amt], i) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 shrink-0 truncate">{cat}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${catColors[i % catColors.length]}`}
                    style={{ width: `${(amt / maxCatAmount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-20 text-right shrink-0">{formatCurrency(amt)}</span>
                <span className="text-xs text-gray-400 w-8 text-right shrink-0">{Math.round((amt / summary.approved) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!showAnalytics && (
        <button onClick={() => setShowAnalytics(true)} className="mb-4 text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium">
          <BarChart3 size={12} /> Show Category Breakdown
        </button>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap items-center">
          {(["all", "approved", "pending", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}>
              {s} <span className="text-gray-400">({expenses.filter((e) => s === "all" || e.status === s).length})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {/* Date Range */}
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="all">All Time</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-qtr">This Quarter</option>
          </select>
          {/* Category */}
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="category">Category A–Z</option>
          </select>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-36 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={exportCsv} title="Export CSV" className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <Download size={13} /> Export
          </button>
          <button onClick={onAddNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden lg:table-cell">Vendor</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs hidden sm:table-cell">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No expenses match your filter</td></tr>
            )}
            {filtered.map((exp) => (
              <tr key={exp.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 text-sm">{exp.description}</p>
                  <p className="text-xs text-gray-400">{exp.id}{exp.receipt ? ` · Ref: ${exp.receipt}` : ""}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    <Tag size={10} />{exp.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{exp.vendor}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 hidden sm:table-cell">{exp.date}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">-{formatCurrency(exp.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCls(exp.status)}`}>
                    {exp.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => onView(exp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="View Details"><Eye size={13} /></button>
                    {exp.status === "pending" && (
                      <>
                        <button onClick={() => onEdit(exp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Edit"><Edit3 size={13} /></button>
                        <button onClick={() => onApprove(exp.id)} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Approve"><CheckCircle size={13} /></button>
                        <button onClick={() => onReject(exp.id)} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100" title="Reject"><XCircle size={13} /></button>
                      </>
                    )}
                    {exp.status === "rejected" && (
                      <>
                        <button onClick={() => onEdit(exp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Edit & Resubmit"><Edit3 size={13} /></button>
                        <button onClick={() => onResubmit(exp.id)} className="p-1.5 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="Resubmit"><RotateCcw size={13} /></button>
                      </>
                    )}
                    <button onClick={() => { if (confirm(`Delete "${exp.description}"? This cannot be undone.`)) onDelete(exp.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td className="px-4 py-2.5 text-xs text-gray-400">{filtered.length} expense{filtered.length !== 1 ? "s" : ""}</td>
                <td colSpan={3} className="hidden md:table-cell" />
                <td colSpan={1} className="md:hidden" />
                <td className="px-4 py-2.5 text-right font-bold text-red-600 text-sm">-{formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Chart of Accounts ─────────────────────────────────────────────────────────
function ChartOfAccountsView({ accounts, onAddNew, onEdit, onView, onDelete, onToggleActive, onSeedAccounts }: {
  accounts: Account[];
  onAddNew: () => void;
  onEdit: (acc: Account) => void;
  onView: (acc: Account) => void;
  onDelete: (code: string) => void;
  onToggleActive: (code: string) => void;
  onSeedAccounts: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"code" | "name" | "balance-desc" | "balance-asc">("code");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"] as const;

  const typeColors: Record<string, { badge: string; header: string; bg: string; text: string }> = {
    Asset:     { badge: "bg-blue-100 text-blue-700",   header: "bg-blue-50 border-blue-100",   bg: "bg-blue-50",   text: "text-blue-700" },
    Liability: { badge: "bg-red-100 text-red-700",     header: "bg-red-50 border-red-100",     bg: "bg-red-50",    text: "text-red-700" },
    Equity:    { badge: "bg-purple-100 text-purple-700", header: "bg-purple-50 border-purple-100", bg: "bg-purple-50", text: "text-purple-700" },
    Revenue:   { badge: "bg-green-100 text-green-700", header: "bg-green-50 border-green-100", bg: "bg-green-50",  text: "text-green-700" },
    Expense:   { badge: "bg-orange-100 text-orange-700", header: "bg-orange-50 border-orange-100", bg: "bg-orange-50", text: "text-orange-700" },
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    TYPES.forEach((tp) => { t[tp] = accounts.filter((a) => a.type === tp).reduce((s, a) => s + a.balance, 0); });
    return t;
  }, [accounts]);

  const totalAssets = totals["Asset"] ?? 0;
  const totalLiabilities = totals["Liability"] ?? 0;
  const totalEquity = totals["Equity"] ?? 0;
  const isBalanced = Math.abs(totalAssets - totalLiabilities - totalEquity) < 1;

  const filtered = useMemo(() => {
    let list = accounts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.code.includes(q) || (a.description ?? "").toLowerCase().includes(q);
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "balance-desc") return b.balance - a.balance;
      if (sortBy === "balance-asc") return a.balance - b.balance;
      return a.code.localeCompare(b.code);
    });
  }, [accounts, typeFilter, search, sortBy]);

  const grouped = useMemo(() => {
    const g: Record<string, Account[]> = {};
    TYPES.forEach((t) => { g[t] = filtered.filter((a) => a.type === t); });
    return g;
  }, [filtered]);

  const toggleCollapse = (type: string) => setCollapsed((p) => ({ ...p, [type]: !p[type] }));

  const exportCsv = () => {
    const rows = [
      ["Code", "Name", "Type", "Balance", "Description", "Active"],
      ...accounts.map((a) => [a.code, a.name, a.type, a.balance, a.description ?? "", a.isActive === false ? "No" : "Yes"]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chart-of-accounts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeTypes = typeFilter === "all" ? TYPES.slice() : [typeFilter as Account["type"]];

  return (
    <div className="max-w-6xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {TYPES.map((tp) => (
          <button
            key={tp}
            onClick={() => setTypeFilter(typeFilter === tp ? "all" : tp)}
            className={`rounded-xl border p-3 text-left transition-all ${typeFilter === tp ? "ring-2 ring-orange-400 " + typeColors[tp].header : "bg-white border-gray-200 hover:border-gray-300"}`}
          >
            <p className="text-xs text-gray-500">{tp}</p>
            <p className={`text-base font-bold mt-0.5 ${typeColors[tp].text}`}>{formatCurrency(totals[tp] ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{accounts.filter((a) => a.type === tp).length} accounts</p>
          </button>
        ))}
      </div>

      {/* Accounting Equation + Trial Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2.5">Accounting Equation</p>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-semibold text-blue-700">{formatCurrency(totalAssets)}</span>
            <span className="text-gray-400 text-xs">Assets =</span>
            <span className="font-semibold text-red-700">{formatCurrency(totalLiabilities)}</span>
            <span className="text-gray-400 text-xs">Liabilities +</span>
            <span className="font-semibold text-purple-700">{formatCurrency(totalEquity)}</span>
            <span className="text-gray-400 text-xs">Equity</span>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isBalanced ? "✓ Balanced" : `⚠ Off by ${formatCurrency(Math.abs(totalAssets - totalLiabilities - totalEquity))}`}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2.5">Summary</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Total Revenue</span><span className="font-semibold text-green-700">{formatCurrency(totals["Revenue"] ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Expenses</span><span className="font-semibold text-orange-700">{formatCurrency(totals["Expense"] ?? 0)}</span></div>
            <div className="flex justify-between col-span-2 border-t pt-1.5"><span className="text-gray-600 font-medium">Net Income</span><span className={`font-bold ${(totals["Revenue"] ?? 0) - (totals["Expense"] ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency((totals["Revenue"] ?? 0) - (totals["Expense"] ?? 0))}</span></div>
            <div className="flex justify-between col-span-2"><span className="text-gray-500">Total Accounts</span><span className="font-semibold text-gray-700">{accounts.length}</span></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTypeFilter("all")} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === "all" ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}>
            All <span className="text-gray-400">({accounts.length})</span>
          </button>
          {TYPES.map((tp) => (
            <button key={tp} onClick={() => setTypeFilter(typeFilter === tp ? "all" : tp)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === tp ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}>
              {tp} <span className="text-gray-400">({accounts.filter((a) => a.type === tp).length})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="code">Sort: Code</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="balance-desc">Sort: Highest Balance</option>
            <option value="balance-asc">Sort: Lowest Balance</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-44 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={exportCsv} title="Export CSV" className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <Download size={13} /> Export
          </button>
          <button onClick={onSeedAccounts} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap" title="Load standard chart of accounts template">
            <BookOpen size={13} /> Template
          </button>
          <button onClick={onAddNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>

      {/* Grouped Tables */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border py-16 text-center space-y-3">
          {accounts.length === 0 ? (
            <>
              <Building size={32} className="mx-auto text-gray-300" />
              <p className="text-gray-500 font-medium">No accounts set up yet</p>
              <p className="text-sm text-gray-400">Start from a standard template or add accounts manually</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={onSeedAccounts} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center gap-2">
                  <BookOpen size={15} /> Load Standard Template
                </button>
                <button onClick={onAddNew} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Add Manually</button>
              </div>
            </>
          ) : (
            <p className="text-gray-400">No accounts match your search</p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {activeTypes.map((type) => {
          const accs = grouped[type] ?? [];
          if (accs.length === 0 && search === "") return null;
          const isCollapsed = collapsed[type];
          const subtotal = accs.reduce((s, a) => s + a.balance, 0);
          const c = typeColors[type];
          return (
            <div key={type} className="bg-white rounded-xl border overflow-hidden">
              <button
                onClick={() => toggleCollapse(type)}
                className={`w-full px-4 py-3 border-b flex items-center justify-between ${c.header} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>{type}</span>
                  <span className="text-xs text-gray-500">{accs.length} account{accs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${c.text}`}>{formatCurrency(subtotal)}</span>
                  {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                </div>
              </button>
              {!isCollapsed && (
                <>
                  {accs.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-400">No accounts found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs w-20">Code</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Account Name</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs hidden md:table-cell">Description</th>
                          <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs hidden sm:table-cell">Status</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Balance</th>
                          <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accs.map((acc) => (
                          <tr key={acc.code} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${acc.isActive === false ? "opacity-60" : ""}`}>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{acc.code}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-800">{acc.name}</p>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-400 hidden md:table-cell">{acc.description ?? "—"}</td>
                            <td className="px-4 py-2.5 text-center hidden sm:table-cell">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.isActive === false ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-700"}`}>
                                {acc.isActive === false ? "Inactive" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`font-semibold ${acc.balance < 0 ? "text-red-600" : "text-gray-800"}`}>{formatCurrency(acc.balance)}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => onView(acc)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="View"><Eye size={13} /></button>
                                <button onClick={() => onEdit(acc)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Edit"><Edit3 size={13} /></button>
                                <button onClick={() => onToggleActive(acc.code)} className={`p-1.5 rounded ${acc.isActive === false ? "text-green-400 hover:bg-green-50 hover:text-green-600" : "text-orange-300 hover:bg-orange-50 hover:text-orange-600"}`} title={acc.isActive === false ? "Activate account" : "Deactivate account"}><Power size={13} /></button>
                                <button
                                  onClick={() => { if (confirm(`Remove account "${acc.name}" (${acc.code})? This cannot be undone.`)) onDelete(acc.code); }}
                                  className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-xs text-gray-400">{accs.length} account{accs.length !== 1 ? "s" : ""}</td>
                          <td className={`px-4 py-2 text-right text-sm font-bold ${c.text}`}>{formatCurrency(subtotal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Journal Entries ───────────────────────────────────────────────────────────
function JournalView({ entries, onAddEntry, onView, onDelete, onTogglePost, accounts }: {
  entries: JournalEntry[];
  onAddEntry: () => void;
  onView: (je: JournalEntry) => void;
  onDelete: (id: string) => void;
  onTogglePost: (id: string) => void;
  accounts: Account[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "posted" | "pending">("all");
  const [accountFilter, setAccountFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let list = [...entries];
    if (statusFilter === "posted") list = list.filter((e) => e.posted);
    if (statusFilter === "pending") list = list.filter((e) => !e.posted);
    if (dateFrom) list = list.filter((e) => e.date >= dateFrom);
    if (dateTo) list = list.filter((e) => e.date <= dateTo);
    if (accountFilter) list = list.filter((e) => e.debit === accountFilter || e.credit === accountFilter);
    const q = search.toLowerCase();
    if (q) list = list.filter((e) =>
      e.description.toLowerCase().includes(q) ||
      e.reference.toLowerCase().includes(q) ||
      e.debit.toLowerCase().includes(q) ||
      e.credit.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return list;
  }, [entries, statusFilter, dateFrom, dateTo, accountFilter, search, sortBy]);

  const postedEntries = entries.filter((e) => e.posted);
  const pendingEntries = entries.filter((e) => !e.posted);
  const postedTotal = postedEntries.reduce((s, e) => s + e.amount, 0);

  const exportCSV = () => {
    const rows = [
      ["ID", "Date", "Description", "Reference", "Debit Account", "Credit Account", "Amount", "Status"],
      ...filtered.map((e) => [e.id, e.date, e.description, e.reference, e.debit, e.credit, e.amount.toFixed(2), e.posted ? "Posted" : "Pending"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `journal_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Journal Entries</h3>
          <p className="text-xs text-gray-400 mt-0.5">{entries.length} total · {postedEntries.length} posted · {pendingEntries.length} pending</p>
        </div>
        <button onClick={onAddEntry} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: entries.length.toString(), color: "text-gray-700", bg: "bg-white" },
          { label: "Posted", value: postedEntries.length.toString(), color: "text-green-700", bg: "bg-green-50" },
          { label: "Pending / Draft", value: pendingEntries.length.toString(), color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Posted Total", value: formatCurrency(postedTotal), color: "text-orange-700", bg: "bg-orange-50" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl border p-4`}>
            <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Trial Balance Banner */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Trial Balance (Posted Entries)</p>
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <span>Total Debits: <span className="font-bold text-green-700">{formatCurrency(postedTotal)}</span></span>
          <span>Total Credits: <span className="font-bold text-red-600">{formatCurrency(postedTotal)}</span></span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium flex items-center gap-1"><CheckCircle size={12} /> Balanced</span>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white rounded-xl border p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>From:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none" />
          <span>To:</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-orange-600 hover:text-orange-700 underline text-xs">Clear</button>
          )}
        </div>
        <div className="flex gap-1 ml-auto">
          {(["all", "posted", "pending"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === s ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none">
          <option value="date-desc">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="amount-desc">Amount (High→Low)</option>
          <option value="amount-asc">Amount (Low→High)</option>
        </select>
        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none max-w-[180px]" title="Filter by account">
          <option value="">All Accounts</option>
          {accounts.filter((a) => a.isActive !== false).sort((a, b) => a.code.localeCompare(b.code)).map((a) => (
            <option key={a.code} value={a.name}>{a.code} · {a.name}</option>
          ))}
        </select>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 pr-7 py-1.5 border rounded-lg text-xs w-44 focus:ring-2 focus:ring-orange-400 outline-none" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
        </div>
        <button onClick={exportCSV} className="px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Reference</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Debit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Credit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">No entries match your filters</td></tr>
            )}
            {filtered.map((je) => (
              <tr key={je.id} className={`border-b hover:bg-gray-50 transition-colors ${!je.posted ? "opacity-70" : ""}`}>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{je.id}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{je.date}</td>
                <td className="px-4 py-3 font-medium text-sm max-w-[200px] truncate" title={je.description}>{je.description}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{je.reference}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium whitespace-nowrap">{je.debit}</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium whitespace-nowrap">{je.credit}</span></td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(je.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${je.posted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {je.posted ? "Posted" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(je)} title="View details" className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Eye size={14} /></button>
                    <button
                      onClick={() => onTogglePost(je.id)}
                      title={je.posted ? "Unpost (move to draft)" : "Post entry"}
                      className={`p-1 rounded hover:bg-gray-100 ${je.posted ? "text-green-500 hover:text-green-700" : "text-yellow-500 hover:text-yellow-700"}`}
                    >
                      {je.posted ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </button>
                    <button onClick={() => { if (confirm(`Delete journal entry ${je.id}?`)) onDelete(je.id); }} title="Delete" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-right">{filtered.length} entr{filtered.length === 1 ? "y" : "ies"} · Total:</td>
                <td className="px-4 py-2.5 text-right font-bold text-sm tabular-nums">{formatCurrency(filtered.reduce((s, je) => s + je.amount, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function ReportsView({ invoices, expenses, accounts, journalEntries, monthlyData }: { invoices: Invoice[]; expenses: Expense[]; accounts: Account[]; journalEntries: JournalEntry[]; monthlyData: { month: string; revenue: number; expenses: number }[] }) {
  const [activeReport, setActiveReport] = useState<"pl" | "balance" | "cashflow" | "aging" | "trial">("pl");

  const totalAssets = accounts.filter((a) => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.filter((a) => a.type === "Equity").reduce((s, a) => s + a.balance, 0);
  const totalRevenue = accounts.filter((a) => a.type === "Revenue").reduce((s, a) => s + a.balance, 0);
  const totalExpenseAmt = accounts.filter((a) => a.type === "Expense").reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenseAmt;
  const grossMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : "0.0";
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.revenue, m.expenses)));

  const trialAccounts = useMemo(() => {
    const map: Record<string, { name: string; debits: number; credits: number }> = {};
    journalEntries.filter((e) => e.posted).forEach((e) => {
      if (!map[e.debit]) map[e.debit] = { name: e.debit, debits: 0, credits: 0 };
      if (!map[e.credit]) map[e.credit] = { name: e.credit, debits: 0, credits: 0 };
      map[e.debit].debits += e.amount;
      map[e.credit].credits += e.amount;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [journalEntries]);
  const trialDebitTotal = trialAccounts.reduce((s, a) => s + a.debits, 0);
  const trialCreditTotal = trialAccounts.reduce((s, a) => s + a.credits, 0);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter((e) => e.status === "approved").forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const totalApprovedExpenses = expenseByCategory.reduce((s, [, v]) => s + v, 0);

  const exportTableCSV = (rows: string[][], filename: string) => {
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Financial Reports</h3>
          <p className="text-xs text-gray-400 mt-0.5">Year to Date · April 2026</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${netIncome >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          Net Income: {formatCurrency(netIncome)}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: "pl", label: "Profit & Loss" },
          { id: "balance", label: "Balance Sheet" },
          { id: "cashflow", label: "Cash Flow" },
          { id: "aging", label: "AR Aging" },
          { id: "trial", label: "Trial Balance" },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id as typeof activeReport)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === r.id ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Profit & Loss */}
      {activeReport === "pl" && (
        <div className="space-y-4">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue", value: formatCurrency(totalRevenue), color: "text-green-700", bg: "bg-green-50" },
              { label: "Total Expenses", value: formatCurrency(totalExpenseAmt), color: "text-red-600", bg: "bg-red-50" },
              { label: "Net Income", value: formatCurrency(netIncome), color: netIncome >= 0 ? "text-green-700" : "text-red-600", bg: netIncome >= 0 ? "bg-green-50" : "bg-red-50" },
              { label: "Profit Margin", value: `${grossMargin}%`, color: parseFloat(grossMargin) >= 0 ? "text-orange-600" : "text-red-600", bg: "bg-orange-50" },
            ].map((kpi) => (
              <div key={kpi.label} className={`${kpi.bg} rounded-xl border p-4`}>
                <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-semibold text-gray-800">Revenue vs Expenses (Last 7 Months)</h4>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Expenses</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-44">
              {monthlyData.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "128px" }}>
                    <div
                      className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-default"
                      style={{ height: `${(m.revenue / maxMonthly) * 100}%` }}
                      title={`Revenue: ${formatCurrency(m.revenue)}`}
                    />
                    <div
                      className="flex-1 bg-red-400 rounded-t transition-all hover:bg-red-500 cursor-default"
                      style={{ height: `${(m.expenses / maxMonthly) * 100}%` }}
                      title={`Expenses: ${formatCurrency(m.expenses)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">Income Statement (YTD)</h4>
              <button onClick={() => exportTableCSV([["Account","Amount"],...accounts.filter((a)=>a.type==="Revenue").map((a)=>[a.code+" · "+a.name,a.balance.toFixed(2)]),["Total Revenue",totalRevenue.toFixed(2)],...accounts.filter((a)=>a.type==="Expense").map((a)=>[a.code+" · "+a.name,(-a.balance).toFixed(2)]),["Total Expenses",(-totalExpenseAmt).toFixed(2)],["Net Income",netIncome.toFixed(2)]], "income_statement.csv")} className="text-sm text-orange-600 flex items-center gap-1 hover:text-orange-700"><Download size={14} /> CSV</button>
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between pb-2 border-b mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase">Revenue</span>
                <span className="text-xs font-semibold text-gray-400 uppercase">Amount</span>
              </div>
              {accounts.filter((a) => a.type === "Revenue").map((a) => (
                <div key={a.code} className="flex justify-between py-2 px-2 hover:bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">{a.code} · {a.name}</span>
                  <span className="font-medium text-green-700">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 px-2 font-semibold text-sm border-t">
                <span>Total Revenue</span><span className="text-green-700">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="pt-3 pb-1 border-b">
                <span className="text-xs font-semibold text-gray-400 uppercase">Expenses</span>
              </div>
              {accounts.filter((a) => a.type === "Expense").map((a) => (
                <div key={a.code} className="flex justify-between py-2 px-2 hover:bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">{a.code} · {a.name}</span>
                  <span className="font-medium text-red-600">({formatCurrency(a.balance)})</span>
                </div>
              ))}
              <div className="flex justify-between py-2 px-2 font-semibold text-sm border-t">
                <span>Total Expenses</span><span className="text-red-600">({formatCurrency(totalExpenseAmt)})</span>
              </div>
              <div className={`flex justify-between py-3 px-3 rounded-xl font-bold text-base mt-2 ${netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <span>Net Income</span>
                <span className={netIncome >= 0 ? "text-green-700" : "text-red-700"}>{formatCurrency(netIncome)}</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown by Category */}
          {expenseByCategory.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Expense Breakdown (Approved)</h4>
              <div className="space-y-2.5">
                {expenseByCategory.map(([cat, amt]) => {
                  const pct = totalApprovedExpenses > 0 ? (amt / totalApprovedExpenses) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-medium">{formatCurrency(amt)} <span className="text-gray-400 font-normal text-xs">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-2">
                  <span>Total Approved</span>
                  <span className="text-red-600">{formatCurrency(totalApprovedExpenses)}</span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {activeReport === "balance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">Assets</h4>
              <button onClick={() => exportTableCSV([["Account","Balance"],...accounts.filter((a)=>a.type==="Asset").map((a)=>[a.code+" · "+a.name,a.balance.toFixed(2)]),[ "Total Assets",totalAssets.toFixed(2)]], "assets.csv")} className="text-sm text-orange-600 flex items-center gap-1"><Download size={14} /> CSV</button>
            </div>
            {accounts.filter((a) => a.type === "Asset").map((a) => (
              <div key={a.code} className="flex justify-between py-2 px-2 hover:bg-gray-50 rounded text-sm">
                <span className="text-gray-600">{a.code} · {a.name}</span>
                <span className="font-medium">{formatCurrency(a.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5 px-2 font-bold text-sm border-t bg-blue-50 rounded-lg mt-2">
              <span className="text-blue-700">Total Assets</span>
              <span className="text-blue-700">{formatCurrency(totalAssets)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Liabilities</h4>
              {accounts.filter((a) => a.type === "Liability").map((a) => (
                <div key={a.code} className="flex justify-between py-2 px-2 hover:bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">{a.code} · {a.name}</span>
                  <span className="font-medium">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5 px-2 font-bold text-sm border-t bg-red-50 rounded-lg mt-2">
                <span className="text-red-700">Total Liabilities</span>
                <span className="text-red-700">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Equity</h4>
              {accounts.filter((a) => a.type === "Equity").map((a) => (
                <div key={a.code} className="flex justify-between py-2 px-2 hover:bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">{a.code} · {a.name}</span>
                  <span className="font-medium">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5 px-2 font-bold text-sm border-t bg-purple-50 rounded-lg mt-2">
                <span className="text-purple-700">Total Equity</span>
                <span className="text-purple-700">{formatCurrency(totalEquity)}</span>
              </div>
            </div>
            <div className={`bg-white rounded-xl border p-4 flex justify-between font-bold text-sm ${Math.abs(totalAssets - totalLiabilities - totalEquity) < 1 ? "border-green-300" : "border-red-300"}`}>
              <span>Liabilities + Equity</span>
              <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {activeReport === "cashflow" && (() => {
        const cashIn = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
        const expByCategory = expenses
          .filter((e) => e.status === "approved")
          .reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
        const totalExpOut = Object.values(expByCategory).reduce((s, v) => s + v, 0);
        const netOperating = cashIn - totalExpOut;
        return (
          <div className="bg-white rounded-xl border p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Cash Flow Statement</h4>
            </div>
            {/* Operating Activities */}
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Operating Activities</h5>
              <div className="rounded-xl border overflow-hidden">
                <div className="flex justify-between px-4 py-2.5 border-b text-sm hover:bg-gray-50">
                  <span className="text-gray-600">Cash received from customers</span>
                  <span className="text-green-700 font-medium">+{formatCurrency(cashIn)}</span>
                </div>
                {Object.entries(expByCategory).length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No approved expenses</div>
                ) : Object.entries(expByCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between px-4 py-2.5 border-b last:border-0 text-sm hover:bg-gray-50">
                    <span className="text-gray-600">Cash paid — {cat}</span>
                    <span className="text-red-600 font-medium">−{formatCurrency(amt)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 font-semibold text-sm bg-green-50">
                  <span className="text-green-700">Net Operating Activities</span>
                  <span className={netOperating >= 0 ? "text-green-700" : "text-red-600"}>{netOperating >= 0 ? "+" : ""}{formatCurrency(netOperating)}</span>
                </div>
              </div>
            </div>
            {/* Investing Activities */}
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Investing Activities</h5>
              <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-3 text-sm text-gray-400 text-center">No investing transactions recorded</div>
                <div className="flex justify-between px-4 py-2.5 font-semibold text-sm bg-blue-50">
                  <span className="text-blue-700">Net Investing Activities</span>
                  <span className="text-blue-700">{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
            {/* Financing Activities */}
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Financing Activities</h5>
              <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-3 text-sm text-gray-400 text-center">No financing transactions recorded</div>
                <div className="flex justify-between px-4 py-2.5 font-semibold text-sm bg-purple-50">
                  <span className="text-purple-700">Net Financing Activities</span>
                  <span className="text-purple-700">{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between px-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
              <span>Net Change in Cash</span>
              <span className={netOperating >= 0 ? "text-green-400" : "text-red-400"}>{netOperating >= 0 ? "+" : ""}{formatCurrency(netOperating)}</span>
            </div>
          </div>
        );
      })()}

      {/* AR Aging */}
      {activeReport === "aging" && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Accounts Receivable Aging</h4>
            <button className="text-sm text-orange-600 flex items-center gap-1"><Download size={14} /> PDF</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Current</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">1–30 Days</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">31–60 Days</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">60+ Days</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.filter((i) => i.status === "sent" || i.status === "overdue").length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No outstanding receivables</td></tr>
              )}
              {invoices.filter((i) => i.status === "sent" || i.status === "overdue").map((inv) => {
                const days = Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / 86400000);
                return (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.customer}</td>
                    <td className="px-4 py-3 text-orange-700">{inv.id}</td>
                    <td className="px-4 py-3 text-right">{days <= 0 ? formatCurrency(inv.amount) : "—"}</td>
                    <td className="px-4 py-3 text-right text-yellow-700">{days > 0 && days <= 30 ? formatCurrency(inv.amount) : "—"}</td>
                    <td className="px-4 py-3 text-right text-orange-700">{days > 30 && days <= 60 ? formatCurrency(inv.amount) : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-700 font-medium">{days > 60 ? formatCurrency(inv.amount) : "—"}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(inv.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            {invoices.filter((i) => i.status === "sent" || i.status === "overdue").length > 0 && (
              <tfoot className="bg-gray-50 border-t font-bold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm">Total Outstanding</td>
                  <td colSpan={4} />
                  <td className="px-4 py-3 text-right text-orange-700">
                    {formatCurrency(invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Trial Balance */}
      {activeReport === "trial" && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-800">Trial Balance</h4>
              <p className="text-xs text-gray-400 mt-0.5">Aggregated from posted journal entries</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${Math.abs(trialDebitTotal - trialCreditTotal) < 0.01 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {Math.abs(trialDebitTotal - trialCreditTotal) < 0.01 ? "✓ Balanced" : "⚠ Unbalanced"}
              </span>
              <button onClick={() => exportTableCSV([["Account","Debits","Credits","Net"],...trialAccounts.map((a)=>[a.name,a.debits.toFixed(2),a.credits.toFixed(2),(a.debits-a.credits).toFixed(2)]),[ "TOTALS",trialDebitTotal.toFixed(2),trialCreditTotal.toFixed(2),(trialDebitTotal-trialCreditTotal).toFixed(2)]], "trial_balance.csv")} className="text-sm text-orange-600 flex items-center gap-1"><Download size={14} /> CSV</button>
            </div>
          </div>
          {trialAccounts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No posted journal entries yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Account</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Debits</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Credits</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Net</th>
                </tr>
              </thead>
              <tbody>
                {trialAccounts.map((a) => {
                  const net = a.debits - a.credits;
                  return (
                    <tr key={a.name} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-right text-green-700">{a.debits > 0 ? formatCurrency(a.debits) : "—"}</td>
                      <td className="px-4 py-3 text-right text-red-600">{a.credits > 0 ? formatCurrency(a.credits) : "—"}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${net > 0 ? "text-green-700" : net < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {net !== 0 ? (net > 0 ? "+" : "") + formatCurrency(Math.abs(net)) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 bg-gray-50">
                <tr>
                  <td className="px-4 py-3 font-bold text-sm">Totals</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(trialDebitTotal)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(trialCreditTotal)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${Math.abs(trialDebitTotal - trialCreditTotal) < 0.01 ? "text-green-700" : "text-red-600"}`}>
                    {Math.abs(trialDebitTotal - trialCreditTotal) < 0.01 ? "Balanced" : formatCurrency(Math.abs(trialDebitTotal - trialCreditTotal))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
interface InvoiceLineItem { description: string; qty: number; rate: number; }

function InvoiceFormModal({ invoice, onClose, onSave }: {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const initTaxRate = invoice && invoice.subtotal > 0 ? Math.round((invoice.tax / invoice.subtotal) * 100) : 5;
  const [form, setForm] = useState({
    customer: invoice?.customer ?? "",
    email: invoice?.email ?? "",
    issueDate: invoice?.issueDate ?? today,
    dueDate: invoice?.dueDate ?? "",
    taxRate: initTaxRate,
    description: invoice?.description ?? "",
  });
  const [items, setItems] = useState<InvoiceLineItem[]>(
    invoice?.items?.length ? invoice.items : [{ description: "", qty: 1, rate: 0 }]
  );

  const setField = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, k: keyof InvoiceLineItem, v: string | number) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => setItems((p) => [...p, { description: "", qty: 1, rate: 0 }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems((p) => p.filter((_, idx) => idx !== i)); };

  const subtotal = items.reduce((s, item) => s + item.qty * item.rate, 0);
  const tax = subtotal * (form.taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.description.trim() && i.rate > 0);
    if (!validItems.length) return;
    const id = invoice?.id ?? generateInvoiceNumber();
    onSave({
      id,
      customer: form.customer,
      email: form.email,
      amount: parseFloat(total.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      status: invoice?.status ?? "draft",
      dueDate: form.dueDate,
      issueDate: form.issueDate,
      paidAt: invoice?.paidAt ?? null,
      description: form.description,
      items: validItems,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">{invoice ? `Edit Invoice ${invoice.id}` : "New Invoice"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Customer Name *</label>
              <input required value={form.customer} onChange={(e) => setField("customer", e.target.value)} placeholder="Company or person name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Customer Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Issue Date *</label>
              <input required type="date" value={form.issueDate} onChange={(e) => setField("issueDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Due Date *</label>
              <input required type="date" value={form.dueDate} min={form.issueDate} onChange={(e) => setField("dueDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Line Items</p>
              <button type="button" onClick={addItem} className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"><Plus size={12} /> Add Line</button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 border-b text-xs font-medium text-gray-500 px-3 py-2">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-3 text-right">Rate ($)</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 border-b last:border-0 items-center">
                  <input
                    required={i === 0}
                    value={item.description}
                    onChange={(e) => setItem(i, "description", e.target.value)}
                    placeholder={`Item ${i + 1}`}
                    className="col-span-6 px-2 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-orange-400 outline-none"
                  />
                  <input
                    type="number" min="0.01" step="0.01"
                    value={item.qty}
                    onChange={(e) => setItem(i, "qty", parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-1 focus:ring-orange-400 outline-none"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={item.rate}
                    onChange={(e) => setItem(i, "rate", parseFloat(e.target.value) || 0)}
                    className="col-span-3 px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-1 focus:ring-orange-400 outline-none"
                  />
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Notes / Terms (optional)</label>
              <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Payment terms, delivery notes, etc." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
            </div>
            <div className="w-52 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={form.taxRate} onChange={(e) => setField("taxRate", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-1 focus:ring-orange-400 outline-none" />
              </div>
              <div className="bg-orange-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax ({form.taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1.5 text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm">
            {invoice ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SendInvoiceModal({ invoice, onClose, onSend }: {
  invoice: Invoice;
  onClose: () => void;
  onSend: (id: string) => void;
}) {
  const [message, setMessage] = useState(
    `Dear ${invoice.customer},\n\nPlease find attached invoice ${invoice.id} for ${formatCurrency(invoice.amount)}, due on ${invoice.dueDate}.\n\nThank you for your business.\n\nBest regards,\nOneApp Team`
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Send Invoice</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
          <p className="font-semibold text-orange-800">{invoice.id} · {invoice.customer}</p>
          <p className="text-orange-600 text-xs mt-0.5">{invoice.email} · Due {invoice.dueDate}</p>
          <p className="font-bold text-orange-900 mt-1">{formatCurrency(invoice.amount)}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><Mail size={11} /> To</label>
          <input value={invoice.email} readOnly className="w-full px-3 py-2 border bg-gray-50 rounded-lg text-sm text-gray-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Email Message</label>
          <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSend(invoice.id)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
            <Send size={13} /> Send Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordPaymentModal({ invoice, onClose, onRecord }: {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (id: string, date: string, method: string, notes: string) => void;
}) {
  const methods = ["Bank Transfer", "Cash", "Credit Card", "Check", "Online Payment", "Other"];
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    method: "Bank Transfer",
    amount: invoice.amount.toFixed(2),
    notes: "",
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Record Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm">
          <p className="font-semibold text-green-800">{invoice.id} · {invoice.customer}</p>
          <p className="font-bold text-green-900 text-base mt-0.5">{formatCurrency(invoice.amount)}</p>
          <p className="text-green-600 text-xs">Due {invoice.dueDate}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date *</label>
          <input type="date" required value={form.date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Amount Received ($)</label>
          <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Payment Method</label>
          <select value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            {methods.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Reference / Notes (optional)</label>
          <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Bank ref, cheque number, etc." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onRecord(invoice.id, form.date, form.method, form.notes)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle size={14} /> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}


function ExpenseDetailModal({ expense: exp, onClose, onApprove, onReject, onEdit, onDelete, onResubmit }: {
  expense: Expense;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
  onResubmit: () => void;
}) {
  const statusBg =
    exp.status === "approved" ? "bg-green-50 text-green-700 border-green-200" :
    exp.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
    "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{exp.description}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{exp.id} · {exp.date}</p>
          </div>
          <div className="flex items-center gap-1">
            {(exp.status === "pending" || exp.status === "rejected") && (
              <button onClick={() => onEdit(exp)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Edit"><Edit3 size={15} /></button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 ml-1"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className={`flex items-center justify-center px-4 py-2.5 rounded-xl border font-semibold text-sm ${statusBg}`}>
            {exp.status.toUpperCase()}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-white border rounded-full text-gray-700"><Tag size={10} />{exp.category}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Vendor</p>
              <p className="font-semibold text-gray-800">{exp.vendor}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <p className="font-semibold text-gray-800">{exp.date}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Amount</p>
              <p className="font-bold text-red-700 text-base">-{formatCurrency(exp.amount)}</p>
            </div>
          </div>

          {exp.receipt && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Receipt / Reference</p>
              <p className="text-sm font-medium text-gray-700 font-mono">{exp.receipt}</p>
            </div>
          )}

          {exp.notes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-600">{exp.notes}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-1 border-t">
            {exp.status === "pending" && (
              <>
                <button onClick={onApprove} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-w-[100px]">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={onReject} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-w-[100px]">
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {exp.status === "rejected" && (
              <button onClick={onResubmit} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                <RotateCcw size={14} /> Resubmit
              </button>
            )}
            <button onClick={() => { if (confirm(`Delete "${exp.description}"? This cannot be undone.`)) { onDelete(exp.id); } }} className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseFormModal({ expense, onClose, onSave }: {
  expense: Expense | null;
  onClose: () => void;
  onSave: (exp: Expense) => void;
}) {
  const CATEGORIES = ["Office Supplies", "Software", "Travel", "Marketing", "Utilities", "Maintenance", "Salaries", "Rent", "Other"];
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    category: expense?.category ?? "Office Supplies",
    description: expense?.description ?? "",
    amount: expense?.amount.toString() ?? "",
    vendor: expense?.vendor ?? "",
    date: expense?.date ?? today,
    receipt: expense?.receipt ?? "",
    notes: expense?.notes ?? "",
  });
  const sf = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = expense?.id ?? crypto.randomUUID();
    onSave({
      id,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      vendor: form.vendor,
      status: expense?.status === "rejected" ? "pending" : (expense?.status ?? "pending"),
      notes: form.notes || undefined,
      receipt: form.receipt || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{expense ? "Edit Expense" : "Add Expense"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
          <select value={form.category} onChange={(e) => sf("category", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
          <input required value={form.description} onChange={(e) => sf("description", e.target.value)} placeholder="What was purchased?" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Amount ($) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => sf("amount", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
            <input required type="date" value={form.date} max={today} onChange={(e) => sf("date", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Vendor / Supplier *</label>
          <input required value={form.vendor} onChange={(e) => sf("vendor", e.target.value)} placeholder="Vendor or supplier name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Receipt / Reference # (optional)</label>
          <input value={form.receipt} onChange={(e) => sf("receipt", e.target.value)} placeholder="e.g. REC-20001 or INV#1234" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Notes (optional)</label>
          <textarea rows={2} value={form.notes} onChange={(e) => sf("notes", e.target.value)} placeholder="Additional details, purpose, project code, etc." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
        </div>

        {expense?.status === "rejected" && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            Saving changes will resubmit this expense for approval.
          </p>
        )}
        {!expense && (
          <p className="text-xs text-gray-400">Expense will be submitted for manager approval.</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm">
            {expense ? (expense.status === "rejected" ? "Save & Resubmit" : "Save Changes") : "Submit Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}


function AccountDetailModal({ account: acc, onClose, onEdit, onDelete, journalEntries, onAdjustBalance, onToggleActive }: {
  account: Account;
  onClose: () => void;
  onEdit: (acc: Account) => void;
  onDelete: (code: string) => void;
  journalEntries: JournalEntry[];
  onAdjustBalance: (code: string, newBalance: number, memo: string) => void;
  onToggleActive: (code: string) => void;
}) {
  const [tab, setTab] = useState<"details" | "ledger">("details");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustBalance, setAdjustBalance] = useState(acc.balance.toFixed(2));
  const [adjustMemo, setAdjustMemo] = useState("");

  const typeColors: Record<string, string> = {
    Asset: "bg-blue-50 text-blue-700 border-blue-200",
    Liability: "bg-red-50 text-red-700 border-red-200",
    Equity: "bg-purple-50 text-purple-700 border-purple-200",
    Revenue: "bg-green-50 text-green-700 border-green-200",
    Expense: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const ledgerEntries = journalEntries
    .filter((je) => je.debit === acc.name || je.credit === acc.name)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalDebits = ledgerEntries.filter((je) => je.debit === acc.name).reduce((s, je) => s + je.amount, 0);
  const totalCredits = ledgerEntries.filter((je) => je.credit === acc.name).reduce((s, je) => s + je.amount, 0);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBal = parseFloat(adjustBalance);
    if (isNaN(newBal)) return;
    onAdjustBalance(acc.code, newBal, adjustMemo);
    setShowAdjust(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <p className="font-mono text-xs text-gray-400 mb-0.5">{acc.code}</p>
            <h3 className="text-lg font-bold text-gray-800">{acc.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(acc)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Edit"><Edit3 size={15} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 ml-1"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5 gap-1">
          {(["details", "ledger"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-orange-500 text-orange-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t === "ledger" ? `Ledger (${ledgerEntries.length})` : "Details"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "details" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${typeColors[acc.type]}`}>{acc.type}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${acc.isActive === false ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                    {acc.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
                <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                  <p className={`text-2xl font-bold ${acc.balance < 0 ? "text-red-600" : "text-gray-900"}`}>{formatCurrency(acc.balance)}</p>
                </div>
              </div>
              {acc.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{acc.description}</p>
                </div>
              )}
              {ledgerEntries.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Total Debits</p>
                    <p className="font-semibold text-green-700 text-sm mt-0.5">{formatCurrency(totalDebits)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Total Credits</p>
                    <p className="font-semibold text-red-700 text-sm mt-0.5">{formatCurrency(totalCredits)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Transactions</p>
                    <p className="font-semibold text-blue-700 text-sm mt-0.5">{ledgerEntries.length}</p>
                  </div>
                </div>
              )}

              {/* Adjust Balance */}
              {showAdjust ? (
                <form onSubmit={handleAdjustSubmit} className="border border-orange-200 rounded-xl p-4 space-y-3 bg-orange-50">
                  <p className="text-sm font-semibold text-orange-800">Adjust Balance</p>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">New Balance ($)</label>
                    <input
                      type="number" step="0.01" required
                      value={adjustBalance}
                      onChange={(e) => setAdjustBalance(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Difference:{" "}
                      <span className={`font-semibold ${parseFloat(adjustBalance) - acc.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {!isNaN(parseFloat(adjustBalance)) ? (parseFloat(adjustBalance) - acc.balance >= 0 ? "+" : "") + formatCurrency(parseFloat(adjustBalance) - acc.balance) : "—"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Memo (optional)</label>
                    <input value={adjustMemo} onChange={(e) => setAdjustMemo(e.target.value)} placeholder="Reason for adjustment…" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAdjust(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-white">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">Apply Adjustment</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setAdjustBalance(acc.balance.toFixed(2)); setShowAdjust(true); }} className="w-full py-2 border border-dashed border-orange-300 text-orange-600 rounded-xl text-sm hover:bg-orange-50 flex items-center justify-center gap-1.5">
                  <Calculator size={14} /> Adjust Balance
                </button>
              )}
            </>
          )}

          {tab === "ledger" && (
            <>
              {ledgerEntries.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                  No journal entries reference this account yet
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Total Debits</p>
                      <p className="font-semibold text-green-700 text-sm mt-0.5">{formatCurrency(totalDebits)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Total Credits</p>
                      <p className="font-semibold text-red-700 text-sm mt-0.5">{formatCurrency(totalCredits)}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${totalDebits - totalCredits >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                      <p className="text-xs text-gray-500">Net</p>
                      <p className={`font-semibold text-sm mt-0.5 ${totalDebits - totalCredits >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(Math.abs(totalDebits - totalCredits))}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Description</th>
                          <th className="text-right px-3 py-2 font-medium text-green-600">DR</th>
                          <th className="text-right px-3 py-2 font-medium text-red-500">CR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerEntries.map((je) => {
                          const isDr = je.debit === acc.name;
                          return (
                            <tr key={je.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{je.date}</td>
                              <td className="px-3 py-2">
                                <p className="text-gray-800">{je.description}</p>
                                {je.reference !== "—" && <p className="text-gray-400 font-mono">{je.reference}</p>}
                              </td>
                              <td className="px-3 py-2 text-right text-green-700 font-medium">{isDr ? formatCurrency(je.amount) : "—"}</td>
                              <td className="px-3 py-2 text-right text-red-600 font-medium">{!isDr ? formatCurrency(je.amount) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">Totals</td>
                          <td className="px-3 py-2 text-right text-green-700">{formatCurrency(totalDebits)}</td>
                          <td className="px-3 py-2 text-right text-red-600">{formatCurrency(totalCredits)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-2">
          <button
            onClick={() => { onToggleActive(acc.code); onClose(); }}
            className={`flex-1 py-2.5 border rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 ${acc.isActive === false ? "text-green-700 border-green-200 hover:bg-green-50" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {acc.isActive === false ? <><CheckCircle size={14} /> Activate</> : <><XCircle size={14} /> Deactivate</>}
          </button>
          <button onClick={() => onEdit(acc)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={() => { if (confirm(`Remove "${acc.name}" (${acc.code})? This cannot be undone.`)) { onDelete(acc.code); onClose(); } }}
            className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountFormModal({ account, onClose, onSave, existing }: {
  account: Account | null;
  onClose: () => void;
  onSave: (acc: Account) => void;
  existing: Account[];
}) {
  const typeHelp: Record<string, string> = {
    Asset: "Resources the business owns (cash, receivables, equipment)",
    Liability: "Obligations the business owes (payables, loans)",
    Equity: "Owner's interest in the business",
    Revenue: "Income earned from operations",
    Expense: "Costs incurred in running the business",
  };
  const [form, setForm] = useState({
    code: account?.code ?? "",
    name: account?.name ?? "",
    type: account?.type ?? "Asset" as Account["type"],
    balance: account?.balance.toString() ?? "",
    description: account?.description ?? "",
    isActive: account?.isActive !== false,
  });
  const sf = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const [codeManual, setCodeManual] = useState(!!account);

  const suggestCode = useCallback((type: Account["type"]) => {
    const ranges: Record<string, [number, number]> = {
      Asset: [1000, 1999], Liability: [2000, 2999], Equity: [3000, 3999], Revenue: [4000, 4999], Expense: [5000, 5999],
    };
    const [min, max] = ranges[type];
    const used = existing.map((a) => parseInt(a.code)).filter((n) => !isNaN(n) && n >= min && n <= max).sort((a, b) => b - a);
    const next = used.length === 0 ? min + 100 : used[0] + 100;
    return next <= max ? String(next) : "";
  }, [existing]);

  useEffect(() => {
    if (!account && !codeManual) {
      setForm((p) => ({ ...p, code: suggestCode(p.type) }));
    }
  }, [form.type, account, codeManual, suggestCode]);

  const codeExists = existing.some((a) => a.code === form.code && (!account || a.code !== account.code));
  const codeFormatOk = /^\d{4,6}$/.test(form.code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeExists || !codeFormatOk) return;
    onSave({
      code: form.code,
      name: form.name,
      type: form.type as Account["type"],
      balance: parseFloat(form.balance) || 0,
      description: form.description || undefined,
      isActive: form.isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{account ? "Edit Account" : "New Account"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Account Code * {!account && !codeManual && form.code && <span className="text-orange-500 font-normal">(auto-suggested)</span>}
            </label>
            <input
              required
              value={form.code}
              onChange={(e) => { setCodeManual(true); sf("code", e.target.value.replace(/\D/g, "").slice(0, 6)); }}
              placeholder="e.g. 1150"
              readOnly={!!account}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-orange-400 outline-none ${codeExists ? "border-red-400 bg-red-50" : account ? "bg-gray-50 text-gray-500" : ""}`}
            />
            {codeExists && <p className="text-xs text-red-500 mt-1">Code already in use</p>}
            {!codeExists && form.code && !codeFormatOk && <p className="text-xs text-yellow-600 mt-1">Use 4–6 digits</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Account Type *</label>
            <select value={form.type} onChange={(e) => sf("type", e.target.value as Account["type"])} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
              {(["Asset", "Liability", "Equity", "Revenue", "Expense"] as const).map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {form.type && (
          <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg -mt-1">{typeHelp[form.type]}</p>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Account Name *</label>
          <input required value={form.name} onChange={(e) => sf("name", e.target.value)} placeholder="e.g. Prepaid Expenses" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description (optional)</label>
          <input value={form.description} onChange={(e) => sf("description", e.target.value)} placeholder="Brief description of this account" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{account ? "Current Balance ($)" : "Opening Balance ($)"}</label>
          <input type="number" step="0.01" value={form.balance} onChange={(e) => sf("balance", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => sf("isActive", e.target.checked)} className="w-4 h-4 accent-orange-600 rounded" />
          <span className="text-sm text-gray-700">Account is active</span>
        </label>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={codeExists || (!!form.code && !codeFormatOk)} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm">
            {account ? "Save Changes" : "Add Account"}
          </button>
        </div>
      </form>
    </div>
  );
}


function JournalEntryDetailModal({ entry: je, onClose, onEdit, onDelete, onTogglePost }: {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (je: JournalEntry) => void;
  onDelete: (id: string) => void;
  onTogglePost: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <p className="font-mono text-xs text-gray-400 mb-0.5">{je.id}</p>
            <h3 className="text-lg font-bold text-gray-800">{je.description}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(je)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Edit"><Edit3 size={15} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 ml-1"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <p className="text-sm font-semibold">{je.date}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Reference</p>
              <p className="text-sm font-mono">{je.reference}</p>
            </div>
            <div className="col-span-2 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(je.amount)}</p>
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b">
              <span className="text-xs font-semibold text-green-600 uppercase">Debit Account</span>
              <span className="text-sm font-semibold text-green-700">{je.debit}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-red-50">
              <span className="text-xs font-semibold text-red-600 uppercase">Credit Account</span>
              <span className="text-sm font-semibold text-red-700">{je.credit}</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${je.posted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {je.posted ? "Posted" : "Pending / Draft"}
            </span>
          </div>
          <div className="flex gap-2 pt-1 border-t">
            <button
              onClick={() => { onTogglePost(je.id); onClose(); }}
              className={`flex-1 py-2.5 border rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 ${je.posted ? "text-yellow-700 border-yellow-200 hover:bg-yellow-50" : "text-green-700 border-green-200 hover:bg-green-50"}`}
            >
              {je.posted ? <><XCircle size={14} /> Unpost</> : <><CheckCircle size={14} /> Post</>}
            </button>
            <button onClick={() => onEdit(je)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={() => { if (confirm(`Delete journal entry ${je.id}?`)) { onDelete(je.id); onClose(); } }}
              className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalEntryFormModal({ entry, onClose, onSave, accounts }: {
  entry: JournalEntry | null;
  onClose: () => void;
  onSave: (je: JournalEntry) => void;
  accounts: Account[];
}) {
  const [form, setForm] = useState({
    date: entry?.date ?? new Date().toISOString().slice(0, 10),
    description: entry?.description ?? "",
    reference: entry?.reference === "—" ? "" : (entry?.reference ?? ""),
    debit: entry?.debit ?? "",
    credit: entry?.credit ?? "",
    amount: entry?.amount.toString() ?? "",
    posted: entry?.posted ?? true,
  });
  const sf = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const sameAccount = form.debit && form.credit && form.debit === form.credit;
  const activeAccounts = accounts.filter((a) => a.isActive !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sameAccount || !form.amount) return;
    onSave({
      id: entry?.id ?? crypto.randomUUID(),
      date: form.date,
      description: form.description,
      reference: form.reference || "—",
      debit: form.debit,
      credit: form.credit,
      amount: parseFloat(form.amount),
      posted: form.posted,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{entry ? `Edit Entry ${entry.id}` : "New Journal Entry"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
            <input required type="date" value={form.date} onChange={(e) => sf("date", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Reference</label>
            <input value={form.reference} onChange={(e) => sf("reference", e.target.value)} placeholder="INV-xxx / EXP-xxx" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
          <input required value={form.description} onChange={(e) => sf("description", e.target.value)} placeholder="Transaction description" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>

        <div className="border rounded-xl p-3 space-y-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase">Double Entry</p>
          <div>
            <label className="text-xs font-semibold text-green-700 block mb-1">Debit Account *</label>
            <select required value={form.debit} onChange={(e) => sf("debit", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-400 outline-none">
              <option value="">Select account…</option>
              {activeAccounts.map((a) => <option key={a.code} value={a.name}>{a.code} · {a.name} ({a.type})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-red-700 block mb-1">Credit Account *</label>
            <select required value={form.credit} onChange={(e) => sf("credit", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-400 outline-none">
              <option value="">Select account…</option>
              {activeAccounts.map((a) => <option key={a.code} value={a.name}>{a.code} · {a.name} ({a.type})</option>)}
            </select>
          </div>
          {sameAccount && <p className="text-xs text-red-500">Debit and credit accounts must differ</p>}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Amount ($) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => sf("amount", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.posted} onChange={(e) => sf("posted", e.target.checked)} className="w-4 h-4 accent-orange-600 rounded" />
          <span className="text-sm text-gray-700">Post immediately <span className="text-xs text-gray-400">(uncheck to save as draft)</span></span>
        </label>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={!!sameAccount} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm">
            {entry ? "Save Changes" : (form.posted ? "Post Entry" : "Save as Draft")}
          </button>
        </div>
      </form>
    </div>
  );
}

