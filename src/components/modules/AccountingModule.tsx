"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type AccView = "overview" | "invoices" | "expenses" | "accounts" | "journal" | "reports";

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
}

interface Account {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  balance: number;
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

// ── Initial Data ──────────────────────────────────────────────────────────────
const initialInvoices: Invoice[] = [
  { id: "INV-2026-001", customer: "Acme Corp", email: "billing@acme.com", amount: 12500, subtotal: 11905, tax: 595, status: "paid", dueDate: "2026-03-15", issueDate: "2026-03-01", paidAt: "2026-03-12", description: "Software development services", items: [{ description: "Development Hours", qty: 100, rate: 119.05 }] },
  { id: "INV-2026-002", customer: "Tech Solutions", email: "ap@techsolutions.io", amount: 8750, subtotal: 8333, tax: 417, status: "paid", dueDate: "2026-03-20", issueDate: "2026-03-05", paidAt: "2026-03-18", description: "Consulting services Q1", items: [{ description: "Consulting", qty: 70, rate: 119.04 }] },
  { id: "INV-2026-003", customer: "Global Inc", email: "finance@global.com", amount: 15200, subtotal: 14476, tax: 724, status: "sent", dueDate: "2026-04-15", issueDate: "2026-03-20", paidAt: null, description: "Platform subscription - Annual", items: [{ description: "Annual License", qty: 1, rate: 14476 }] },
  { id: "INV-2026-004", customer: "StartUp Co", email: "cfo@startup.co", amount: 3400, subtotal: 3238, tax: 162, status: "overdue", dueDate: "2026-04-01", issueDate: "2026-03-10", paidAt: null, description: "Design services", items: [{ description: "UI/UX Design", qty: 20, rate: 161.9 }] },
  { id: "INV-2026-005", customer: "Design Studio", email: "accounts@designstudio.com", amount: 6800, subtotal: 6476, tax: 324, status: "draft", dueDate: "2026-04-20", issueDate: "2026-04-01", paidAt: null, description: "Brand identity package", items: [{ description: "Branding Package", qty: 1, rate: 6476 }] },
  { id: "INV-2026-006", customer: "Cloud Services", email: "billing@cloudsvcs.net", amount: 22000, subtotal: 20952, tax: 1048, status: "sent", dueDate: "2026-04-25", issueDate: "2026-04-01", paidAt: null, description: "Infrastructure setup & support", items: [{ description: "Infrastructure", qty: 1, rate: 20952 }] },
  { id: "INV-2026-007", customer: "Alpha LLC", email: "accounts@alphallc.com", amount: 4500, subtotal: 4286, tax: 214, status: "paid", dueDate: "2026-03-28", issueDate: "2026-03-15", paidAt: "2026-03-25", description: "Monthly retainer", items: [{ description: "Retainer", qty: 1, rate: 4286 }] },
];

const initialExpenses: Expense[] = [
  { id: "EXP-001", category: "Office Supplies", description: "Printer paper and toner", amount: 245, date: "2026-04-05", vendor: "OfficeMax", status: "approved" },
  { id: "EXP-002", category: "Software", description: "Monthly SaaS subscriptions", amount: 1200, date: "2026-04-01", vendor: "Various", status: "approved" },
  { id: "EXP-003", category: "Travel", description: "Client meeting - flight & hotel", amount: 890, date: "2026-04-03", vendor: "Delta Airlines", status: "pending" },
  { id: "EXP-004", category: "Marketing", description: "Google Ads campaign", amount: 2500, date: "2026-04-01", vendor: "Google", status: "approved" },
  { id: "EXP-005", category: "Utilities", description: "Electricity bill - March", amount: 680, date: "2026-04-02", vendor: "Power Co", status: "approved" },
  { id: "EXP-006", category: "Maintenance", description: "Office AC repair", amount: 350, date: "2026-04-06", vendor: "Cool Fix", status: "pending" },
  { id: "EXP-007", category: "Travel", description: "Team lunch - Q1 review", amount: 420, date: "2026-03-31", vendor: "The Prime Rib", status: "approved" },
  { id: "EXP-008", category: "Software", description: "Adobe Creative Cloud", amount: 599, date: "2026-03-28", vendor: "Adobe", status: "approved" },
];

const initialAccounts: Account[] = [
  { code: "1000", name: "Cash", type: "Asset", balance: 45230 },
  { code: "1100", name: "Accounts Receivable", type: "Asset", balance: 18450 },
  { code: "1200", name: "Inventory", type: "Asset", balance: 32100 },
  { code: "1500", name: "Equipment", type: "Asset", balance: 15000 },
  { code: "2000", name: "Accounts Payable", type: "Liability", balance: 12340 },
  { code: "2100", name: "Taxes Payable", type: "Liability", balance: 3450 },
  { code: "2500", name: "Loans Payable", type: "Liability", balance: 25000 },
  { code: "3000", name: "Owner's Equity", type: "Equity", balance: 50000 },
  { code: "4000", name: "Sales Revenue", type: "Revenue", balance: 128450 },
  { code: "4100", name: "Service Revenue", type: "Revenue", balance: 34200 },
  { code: "5000", name: "Cost of Goods Sold", type: "Expense", balance: 64225 },
  { code: "5100", name: "Salaries Expense", type: "Expense", balance: 42000 },
  { code: "5200", name: "Rent Expense", type: "Expense", balance: 8400 },
  { code: "5300", name: "Utilities Expense", type: "Expense", balance: 2100 },
];

const initialJournalEntries: JournalEntry[] = [
  { id: "JE-001", date: "2026-04-08", description: "Sales revenue - Acme Corp", reference: "INV-2026-001", debit: "Cash", credit: "Sales Revenue", amount: 12500, posted: true },
  { id: "JE-002", date: "2026-04-07", description: "Monthly rent payment", reference: "EXP-RENT", debit: "Rent Expense", credit: "Cash", amount: 2800, posted: true },
  { id: "JE-003", date: "2026-04-06", description: "Inventory purchase", reference: "PO-2026-012", debit: "Inventory", credit: "Accounts Payable", amount: 5400, posted: true },
  { id: "JE-004", date: "2026-04-05", description: "Office supplies", reference: "EXP-001", debit: "Office Supplies Expense", credit: "Cash", amount: 245, posted: true },
  { id: "JE-005", date: "2026-04-04", description: "Client payment received", reference: "INV-2026-002", debit: "Cash", credit: "Accounts Receivable", amount: 8750, posted: true },
  { id: "JE-006", date: "2026-04-03", description: "Salary payment", reference: "PAY-APR-2026", debit: "Salaries Expense", credit: "Cash", amount: 14000, posted: true },
  { id: "JE-007", date: "2026-04-02", description: "Loan repayment", reference: "LOAN-2026-04", debit: "Loans Payable", credit: "Cash", amount: 1500, posted: true },
  { id: "JE-008", date: "2026-04-01", description: "Google Ads payment", reference: "EXP-004", debit: "Marketing Expense", credit: "Cash", amount: 2500, posted: false },
];

const monthlyData = [
  { month: "Oct", revenue: 85000, expenses: 62000 },
  { month: "Nov", revenue: 92000, expenses: 68000 },
  { month: "Dec", revenue: 118000, expenses: 74000 },
  { month: "Jan", revenue: 95000, expenses: 71000 },
  { month: "Feb", revenue: 108000, expenses: 78000 },
  { month: "Mar", revenue: 127000, expenses: 82000 },
  { month: "Apr", revenue: 134000, expenses: 87000 },
];

let journalNextNum = 9;

// ── Root Component ────────────────────────────────────────────────────────────
export default function AccountingModule() {
  const [view, setView] = useState<AccView>("overview");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries);

  const handleSendInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "sent" } : i));
    notify({ title: "Invoice Sent", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) has been sent.`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleMarkPaid = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "paid", paidAt: new Date().toISOString().slice(0, 10) } : i));
    notify({ title: "Payment Recorded", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) marked as paid.`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleVoidInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "void" } : i));
    notify({ title: "Invoice Voided", message: `Invoice ${inv.id} has been voided.`, category: "accounting", priority: "warning", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleInvoiceCreated = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
    notify({ title: "Invoice Created", message: `New invoice for ${inv.customer} (${formatCurrency(inv.amount)}) created as a draft.`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleApproveExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "approved" } : e));
    notify({ title: "Expense Approved", message: `${exp.description} (${formatCurrency(exp.amount)}) from ${exp.vendor} approved.`, category: "accounting", priority: "success", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleRejectExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "rejected" } : e));
    notify({ title: "Expense Rejected", message: `${exp.description} (${formatCurrency(exp.amount)}) has been rejected.`, category: "accounting", priority: "error", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleExpenseAdded = (exp: Expense) => {
    setExpenses((prev) => [exp, ...prev]);
    notify({ title: "Expense Submitted", message: `${exp.description} (${formatCurrency(exp.amount)}) submitted for approval.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleAccountAdded = (acc: Account) => {
    setAccounts((prev) => [...prev, acc].sort((a, b) => a.code.localeCompare(b.code)));
    notify({ title: "Account Added", message: `${acc.name} (${acc.code}) added to chart of accounts.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleJournalAdded = (je: JournalEntry) => {
    setJournalEntries((prev) => [je, ...prev]);
    notify({ title: "Journal Entry Posted", message: `${je.description} — Dr. ${je.debit} / Cr. ${je.credit} (${formatCurrency(je.amount)}).`, category: "accounting", priority: "success", actionLabel: "View Journal", actionModule: "accounting" });
  };

  const navItems: { id: AccView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: PieChart },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "accounts", label: "Chart of Accounts", icon: Building },
    { id: "journal", label: "Journal", icon: Calculator },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

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
            onSend={handleSendInvoice}
            onMarkPaid={handleMarkPaid}
            onVoid={handleVoidInvoice}
          />
        )}
        {view === "expenses" && (
          <ExpensesView
            expenses={expenses}
            onAddNew={() => setShowAddExpense(true)}
            onApprove={handleApproveExpense}
            onReject={handleRejectExpense}
            onDelete={handleDeleteExpense}
          />
        )}
        {view === "accounts" && <ChartOfAccountsView accounts={accounts} onAddAccount={() => setShowAddAccount(true)} />}
        {view === "journal" && <JournalView entries={journalEntries} onAddEntry={() => setShowAddJournal(true)} accounts={accounts} />}
        {view === "reports" && <ReportsView invoices={invoices} expenses={expenses} accounts={accounts} />}
      </div>

      {showCreateInvoice && <CreateInvoiceModal onClose={() => setShowCreateInvoice(false)} onCreated={handleInvoiceCreated} />}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} onAdded={handleExpenseAdded} />}
      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} onAdded={handleAccountAdded} existing={accounts} />}
      {showAddJournal && <AddJournalModal onClose={() => setShowAddJournal(false)} onAdded={handleJournalAdded} accounts={accounts} />}
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
          { label: "Revenue (Paid)", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600", note: "+8.2% vs last month" },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "bg-red-50 text-red-600", note: "+3.1% vs last month" },
          { label: "Net Income", value: formatCurrency(totalRevenue - totalExpenses), icon: DollarSign, color: "bg-blue-50 text-blue-600", note: "+15.4% vs last month" },
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
        <h3 className="font-semibold text-gray-800 mb-4">Profit & Loss — April 2026</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Sales Revenue", value: 128450, color: "text-green-700", bg: "bg-green-50" },
            { label: "Service Revenue", value: 34200, color: "text-teal-700", bg: "bg-teal-50" },
            { label: "Total Expenses", value: 116725, color: "text-red-700", bg: "bg-red-50" },
            { label: "Net Profit", value: 45925, color: "text-blue-700", bg: "bg-blue-50" },
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
function InvoicesView({ invoices, onCreateNew, onSend, onMarkPaid, onVoid }: {
  invoices: Invoice[];
  onCreateNew: () => void;
  onSend: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onVoid: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    let list = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
    if (search) list = list.filter((i) => i.customer.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [invoices, filter, search]);

  const summary = useMemo(() => ({
    paid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    outstanding: invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    draft: invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.amount, 0),
  }), [invoices]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Paid", value: formatCurrency(summary.paid), color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "Outstanding", value: formatCurrency(summary.outstanding), color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Overdue", value: formatCurrency(summary.overdue), color: "text-red-700", bg: "bg-red-50 border-red-100" },
          { label: "Draft", value: formatCurrency(summary.draft), color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {["all", "draft", "sent", "paid", "overdue", "void"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {f} <span className="text-gray-400">({invoices.filter((i) => f === "all" || i.status === f).length})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-44 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={onCreateNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Issued</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No invoices match your filter</td></tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-orange-700 whitespace-nowrap">{inv.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{inv.customer}</p>
                  <p className="text-xs text-gray-400">{inv.email}</p>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">{inv.issueDate}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">{inv.dueDate}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    inv.status === "void" ? "bg-gray-200 text-gray-500" :
                    "bg-gray-100 text-gray-700"
                  }`}>{inv.status.toUpperCase()}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View Details"><Eye size={14} /></button>
                    {inv.status === "draft" && (
                      <button onClick={() => onSend(inv.id)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100" title="Send Invoice"><Send size={14} /></button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <button onClick={() => onMarkPaid(inv.id)} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Mark as Paid"><CheckCircle size={14} /></button>
                    )}
                    {(inv.status === "draft" || inv.status === "sent") && (
                      <button onClick={() => onVoid(inv.id)} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100" title="Void Invoice"><XCircle size={14} /></button>
                    )}
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Download PDF"><Download size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSend={onSend}
          onMarkPaid={onMarkPaid}
        />
      )}
    </div>
  );
}

function InvoiceDetailModal({ invoice: inv, onClose, onSend, onMarkPaid }: {
  invoice: Invoice;
  onClose: () => void;
  onSend: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-bold">{inv.id}</h3>
            <p className="text-sm text-gray-500">Issued {inv.issueDate} · Due {inv.dueDate}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 mt-0.5"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className={`rounded-xl p-3 text-center text-sm font-semibold ${
            inv.status === "paid" ? "bg-green-50 text-green-700" :
            inv.status === "overdue" ? "bg-red-50 text-red-700" :
            inv.status === "sent" ? "bg-blue-50 text-blue-700" :
            "bg-gray-50 text-gray-600"
          }`}>
            {inv.status.toUpperCase()}
            {inv.paidAt && <span className="ml-2 font-normal text-xs">· Paid on {inv.paidAt}</span>}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Bill To</p>
            <p className="font-semibold">{inv.customer}</p>
            <p className="text-sm text-gray-500">{inv.email}</p>
          </div>

          {inv.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</p>
              <p className="text-sm text-gray-600">{inv.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Line Items</p>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Rate</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-right">{item.qty}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.qty * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (5%)</span><span>{formatCurrency(inv.tax)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(inv.amount)}</span></div>
          </div>

          <div className="flex gap-2 pt-1">
            {inv.status === "draft" && (
              <button onClick={() => { onSend(inv.id); onClose(); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Send Invoice
              </button>
            )}
            {(inv.status === "sent" || inv.status === "overdue") && (
              <button onClick={() => { onMarkPaid(inv.id); onClose(); }} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                Mark as Paid
              </button>
            )}
            <button className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expenses ──────────────────────────────────────────────────────────────────
function ExpensesView({ expenses, onAddNew, onApprove, onReject, onDelete }: {
  expenses: Expense[];
  onAddNew: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = useMemo(() => ["all", ...Array.from(new Set(expenses.map((e) => e.category)))], [expenses]);

  const filtered = useMemo(() =>
    expenses.filter((e) =>
      (catFilter === "all" || e.category === catFilter) &&
      (statusFilter === "all" || e.status === statusFilter) &&
      (e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase()))
    ), [expenses, catFilter, statusFilter, search]);

  const totalApproved = useMemo(() => expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalPending = useMemo(() => expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalRejected = useMemo(() => expenses.filter((e) => e.status === "rejected").reduce((s, e) => s + e.amount, 0), [expenses]);
  const topCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses.filter((e) => e.status === "approved").forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";
  }, [expenses]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Approved", value: formatCurrency(totalApproved), color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "Pending Approval", value: formatCurrency(totalPending), color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-100" },
          { label: "Rejected", value: formatCurrency(totalRejected), color: "text-red-700", bg: "bg-red-50 border-red-100" },
          { label: "Top Category", value: topCategory, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 truncate ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {["all", "approved", "pending", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"}`}>
              {s} <span className="text-gray-400">({expenses.filter((e) => s === "all" || e.status === s).length})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-36 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={onAddNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No expenses match your filter</td></tr>
            )}
            {filtered.map((exp) => (
              <tr key={exp.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{exp.description}</td>
                <td className="px-4 py-3 text-gray-500">{exp.category}</td>
                <td className="px-4 py-3 text-gray-500">{exp.vendor}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">{exp.date}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">-{formatCurrency(exp.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    exp.status === "approved" ? "bg-green-100 text-green-700" :
                    exp.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>{exp.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {exp.status === "pending" && (
                      <>
                        <button onClick={() => onApprove(exp.id)} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Approve"><CheckCircle size={14} /></button>
                        <button onClick={() => onReject(exp.id)} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100" title="Reject"><XCircle size={14} /></button>
                      </>
                    )}
                    {exp.status !== "pending" && (
                      <button onClick={() => onDelete(exp.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-gray-500 text-right">Total filtered:</td>
                <td className="px-4 py-2.5 text-right font-bold text-red-600">-{formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}</td>
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
function ChartOfAccountsView({ accounts, onAddAccount }: { accounts: Account[]; onAddAccount: () => void }) {
  const grouped: Record<string, Account[]> = {};
  accounts.forEach((a) => { if (!grouped[a.type]) grouped[a.type] = []; grouped[a.type].push(a); });

  const typeColors: Record<string, string> = {
    Asset: "bg-blue-100 text-blue-700",
    Liability: "bg-red-100 text-red-700",
    Equity: "bg-purple-100 text-purple-700",
    Revenue: "bg-green-100 text-green-700",
    Expense: "bg-orange-100 text-orange-700",
  };

  const totalAssets = accounts.filter((a) => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.filter((a) => a.type === "Equity").reduce((s, a) => s + a.balance, 0);
  const isBalanced = Math.abs(totalAssets - totalLiabilities - totalEquity) < 1;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chart of Accounts</h3>
        <button onClick={onAddAccount} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Accounting Equation</p>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <span className="font-semibold text-blue-700">Assets: {formatCurrency(totalAssets)}</span>
          <span className="text-gray-400 font-bold">=</span>
          <span className="font-semibold text-red-700">Liabilities: {formatCurrency(totalLiabilities)}</span>
          <span className="text-gray-400 font-bold">+</span>
          <span className="font-semibold text-purple-700">Equity: {formatCurrency(totalEquity)}</span>
          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([type, accs]) => (
          <div key={type} className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}>{type}</span>
              <span className="text-sm font-semibold text-gray-700">{formatCurrency(accs.reduce((s, a) => s + a.balance, 0))}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {accs.map((acc) => (
                  <tr key={acc.code} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-400 w-20 font-mono text-xs">{acc.code}</td>
                    <td className="px-4 py-2.5 font-medium">{acc.name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(acc.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Journal Entries ───────────────────────────────────────────────────────────
function JournalView({ entries, onAddEntry }: { entries: JournalEntry[]; onAddEntry: () => void; accounts: Account[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    entries.filter((je) =>
      je.description.toLowerCase().includes(search.toLowerCase()) ||
      je.reference.toLowerCase().includes(search.toLowerCase()) ||
      je.debit.toLowerCase().includes(search.toLowerCase()) ||
      je.credit.toLowerCase().includes(search.toLowerCase())
    ), [entries, search]);

  const postedTotal = entries.filter((e) => e.posted).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Journal Entries</h3>
          <p className="text-xs text-gray-400 mt-0.5">{entries.filter((e) => e.posted).length} posted · {entries.filter((e) => !e.posted).length} pending</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-48 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <button onClick={onAddEntry} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Trial Balance</p>
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <span>Total Debits: <span className="font-bold">{formatCurrency(postedTotal)}</span></span>
          <span>Total Credits: <span className="font-bold">{formatCurrency(postedTotal)}</span></span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">✓ Balanced</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Debit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Credit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No entries found</td></tr>
            )}
            {filtered.map((je) => (
              <tr key={je.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{je.id}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{je.date}</td>
                <td className="px-4 py-3 font-medium">{je.description}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{je.reference}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">{je.debit}</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium">{je.credit}</span></td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(je.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${je.posted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {je.posted ? "Posted" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={6} className="px-4 py-2.5 text-sm font-semibold text-gray-500 text-right">Total:</td>
                <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(filtered.reduce((s, je) => s + je.amount, 0))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function ReportsView({ invoices, expenses, accounts }: { invoices: Invoice[]; expenses: Expense[]; accounts: Account[] }) {
  const [activeReport, setActiveReport] = useState<"pl" | "balance" | "cashflow" | "aging">("pl");

  // expenses reserved for future enhancement
  void expenses;

  const totalAssets = accounts.filter((a) => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.filter((a) => a.type === "Equity").reduce((s, a) => s + a.balance, 0);
  const totalRevenue = accounts.filter((a) => a.type === "Revenue").reduce((s, a) => s + a.balance, 0);
  const totalExpenseAmt = accounts.filter((a) => a.type === "Expense").reduce((s, a) => s + a.balance, 0);
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.revenue, m.expenses)));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financial Reports</h3>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Download size={16} /> Export All
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: "pl", label: "Profit & Loss" },
          { id: "balance", label: "Balance Sheet" },
          { id: "cashflow", label: "Cash Flow" },
          { id: "aging", label: "AR Aging" },
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

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">Income Statement (YTD)</h4>
              <button className="text-sm text-orange-600 flex items-center gap-1 hover:text-orange-700"><Download size={14} /> PDF</button>
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
              <div className={`flex justify-between py-3 px-3 rounded-xl font-bold text-base mt-2 ${totalRevenue - totalExpenseAmt >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <span>Net Income</span>
                <span className={totalRevenue - totalExpenseAmt >= 0 ? "text-green-700" : "text-red-700"}>{formatCurrency(totalRevenue - totalExpenseAmt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {activeReport === "balance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">Assets</h4>
              <button className="text-sm text-orange-600 flex items-center gap-1"><Download size={14} /> PDF</button>
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
      {activeReport === "cashflow" && (
        <div className="bg-white rounded-xl border p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Cash Flow Statement</h4>
            <button className="text-sm text-orange-600 flex items-center gap-1"><Download size={14} /> PDF</button>
          </div>
          {[
            {
              title: "Operating Activities", color: "text-green-700", bg: "bg-green-50",
              items: [
                { label: "Cash received from customers", amount: 25750, positive: true },
                { label: "Cash paid to suppliers", amount: 8400, positive: false },
                { label: "Cash paid for salaries", amount: 14000, positive: false },
                { label: "Cash paid for operating expenses", amount: 3645, positive: false },
              ],
            },
            {
              title: "Investing Activities", color: "text-blue-700", bg: "bg-blue-50",
              items: [
                { label: "Purchase of equipment", amount: 5000, positive: false },
                { label: "Sale of investments", amount: 2000, positive: true },
              ],
            },
            {
              title: "Financing Activities", color: "text-purple-700", bg: "bg-purple-50",
              items: [
                { label: "Loan repayment", amount: 1500, positive: false },
                { label: "Owner contribution", amount: 0, positive: true },
              ],
            },
          ].map((section) => {
            const net = section.items.reduce((s, i) => i.positive ? s + i.amount : s - i.amount, 0);
            return (
              <div key={section.title}>
                <h5 className="font-semibold text-gray-700 mb-2">{section.title}</h5>
                <div className="rounded-xl border overflow-hidden">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex justify-between px-4 py-2.5 border-b last:border-0 text-sm hover:bg-gray-50">
                      <span className="text-gray-600">{item.label}</span>
                      <span className={item.positive ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                        {item.positive ? "+" : "-"}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className={`flex justify-between px-4 py-2.5 font-semibold text-sm ${section.bg}`}>
                    <span className={section.color}>Net {section.title}</span>
                    <span className={net >= 0 ? "text-green-700" : "text-red-600"}>{net >= 0 ? "+" : ""}{formatCurrency(net)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between px-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
            <span>Net Change in Cash</span>
            <span className="text-green-400">+{formatCurrency(5205)}</span>
          </div>
        </div>
      )}

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
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (inv: Invoice) => void }) {
  const [form, setForm] = useState({ customer: "", email: "", dueDate: "", description: "", itemDesc: "", qty: "1", rate: "" });
  const subtotal = parseFloat(form.rate || "0") * parseInt(form.qty || "1");
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    onCreated({
      id: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      customer: form.customer,
      email: form.email,
      amount: parseFloat(total.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      status: "draft",
      dueDate: form.dueDate,
      issueDate: today,
      paidAt: null,
      description: form.description,
      items: [{ description: form.itemDesc || form.description, qty: parseInt(form.qty), rate: parseFloat(form.rate) }],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">New Invoice</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Customer Name *</label>
          <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Company or person name" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Customer Email *</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Due Date *</label>
          <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div className="border rounded-xl p-3 space-y-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase">Line Item</p>
          <div>
            <label className="text-xs font-medium text-gray-600">Description *</label>
            <input required value={form.itemDesc} onChange={(e) => setForm({ ...form, itemDesc: e.target.value })} placeholder="Service or product description" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Quantity *</label>
              <input required type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Rate ($) *</label>
              <input required type="number" step="0.01" min="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span className="font-medium">{formatCurrency(tax)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1.5 text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm">
          Create Invoice
        </button>
      </form>
    </div>
  );
}

function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: (exp: Expense) => void }) {
  const [form, setForm] = useState({ category: "Office Supplies", description: "", amount: "", vendor: "", date: new Date().toISOString().slice(0, 10) });
  const categories = ["Office Supplies", "Software", "Travel", "Marketing", "Utilities", "Maintenance", "Other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdded({
      id: `EXP-${String(Date.now()).slice(-5)}`,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      vendor: form.vendor,
      status: "pending",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Expense</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {[
          { key: "description", label: "Description", type: "text", placeholder: "What was purchased?" },
          { key: "amount", label: "Amount ($)", type: "number", placeholder: "0.00" },
          { key: "vendor", label: "Vendor", type: "text", placeholder: "Vendor or supplier name" },
          { key: "date", label: "Date", type: "date", placeholder: "" },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-gray-600">{f.label} *</label>
            <input
              required type={f.type} placeholder={f.placeholder}
              step={f.type === "number" ? "0.01" : undefined}
              min={f.type === "number" ? "0.01" : undefined}
              value={form[f.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
        ))}
        <p className="text-xs text-gray-400">Expense will be submitted for approval.</p>
        <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm">
          Submit Expense
        </button>
      </form>
    </div>
  );
}

function AddAccountModal({ onClose, onAdded, existing }: { onClose: () => void; onAdded: (a: Account) => void; existing: Account[] }) {
  const [form, setForm] = useState({ code: "", name: "", type: "Asset" as Account["type"], balance: "" });
  const codeExists = existing.some((a) => a.code === form.code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeExists) return;
    onAdded({ code: form.code, name: form.name, type: form.type, balance: parseFloat(form.balance) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Account</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Account Code *</label>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1150" className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none ${codeExists ? "border-red-400" : ""}`} />
          {codeExists && <p className="text-xs text-red-500 mt-1">Account code already exists</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Account Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Prepaid Expenses" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Account Type *</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Account["type"] })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            {(["Asset", "Liability", "Equity", "Revenue", "Expense"] as const).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Opening Balance ($)</label>
          <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <button type="submit" disabled={codeExists} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm">
          Add Account
        </button>
      </form>
    </div>
  );
}

function AddJournalModal({ onClose, onAdded, accounts }: { onClose: () => void; onAdded: (je: JournalEntry) => void; accounts: Account[] }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: "", reference: "", debit: "", credit: "", amount: "" });
  const sameAccount = form.debit && form.credit && form.debit === form.credit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sameAccount) return;
    onAdded({
      id: `JE-${String(journalNextNum++).padStart(3, "0")}`,
      date: form.date,
      description: form.description,
      reference: form.reference || "—",
      debit: form.debit,
      credit: form.credit,
      amount: parseFloat(form.amount),
      posted: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">New Journal Entry</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Date *</label>
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Reference</label>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="INV-xxx" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Description *</label>
          <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transaction description" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
        </div>
        <div className="border rounded-xl p-3 space-y-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase">Double Entry</p>
          <div>
            <label className="text-xs font-medium text-green-700">Debit Account *</label>
            <select required value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-400 outline-none">
              <option value="">Select account…</option>
              {accounts.map((a) => <option key={a.code} value={a.name}>{a.code} · {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-red-700">Credit Account *</label>
            <select required value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-400 outline-none">
              <option value="">Select account…</option>
              {accounts.map((a) => <option key={a.code} value={a.name}>{a.code} · {a.name}</option>)}
            </select>
          </div>
          {sameAccount && <p className="text-xs text-red-500">Debit and credit accounts must be different</p>}
          <div>
            <label className="text-xs font-medium text-gray-600">Amount ($) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>
        </div>
        <button type="submit" disabled={!!sameAccount} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm">
          Post Journal Entry
        </button>
      </form>
    </div>
  );
}
