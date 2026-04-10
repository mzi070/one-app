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

let invoiceNextNum = 8;
let expenseNextNum = 9;
let journalNextNum = 9;

// ── Root Component ────────────────────────────────────────────────────────────
export default function AccountingModule() {
  const [view, setView] = useState<AccView>("overview");
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

  const handleMarkPaid = (id: string, date?: string, method?: string, notes?: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "paid", paidAt: date ?? new Date().toISOString().slice(0, 10) } : i));
    notify({ title: "Payment Recorded", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) paid${method ? ` via ${method}` : ""}.${notes ? ` Ref: ${notes}` : ""}`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleVoidInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "void" } : i));
    notify({ title: "Invoice Voided", message: `Invoice ${inv.id} has been voided.`, category: "accounting", priority: "warning", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleInvoiceCreated = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
    notify({ title: "Invoice Created", message: `Invoice ${inv.id} for ${inv.customer} (${formatCurrency(inv.amount)}) created.`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleEditInvoice = (inv: Invoice) => {
    setInvoices((prev) => prev.map((i) => i.id === inv.id ? inv : i));
    notify({ title: "Invoice Updated", message: `Invoice ${inv.id} for ${inv.customer} updated.`, category: "accounting", priority: "success", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    notify({ title: "Invoice Deleted", message: `Invoice ${id} has been deleted.`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
  };

  const handleDuplicateInvoice = (inv: Invoice) => {
    const newInv: Invoice = { ...inv, id: `INV-${new Date().getFullYear()}-${String(invoiceNextNum++).padStart(3, "0")}`, status: "draft", issueDate: new Date().toISOString().slice(0, 10), paidAt: null };
    setInvoices((prev) => [newInv, ...prev]);
    notify({ title: "Invoice Duplicated", message: `${inv.id} duplicated as ${newInv.id} (draft).`, category: "accounting", priority: "info", actionLabel: "View Invoices", actionModule: "accounting" });
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
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (exp) notify({ title: "Expense Deleted", message: `${exp.description} (${formatCurrency(exp.amount)}) deleted.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleEditExpense = (exp: Expense) => {
    setExpenses((prev) => prev.map((e) => e.id === exp.id ? exp : e));
    notify({ title: "Expense Updated", message: `${exp.description} (${formatCurrency(exp.amount)}) updated and resubmitted for approval.`, category: "accounting", priority: "success", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleResubmitExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "pending" } : e));
    notify({ title: "Expense Resubmitted", message: `${exp.description} (${formatCurrency(exp.amount)}) resubmitted for approval.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleExpenseAdded = (exp: Expense) => {
    setExpenses((prev) => [exp, ...prev]);
    notify({ title: "Expense Submitted", message: `${exp.description} (${formatCurrency(exp.amount)}) submitted for approval.`, category: "accounting", priority: "info", actionLabel: "View Expenses", actionModule: "accounting" });
  };

  const handleAccountAdded = (acc: Account) => {
    setAccounts((prev) => [...prev, acc].sort((a, b) => a.code.localeCompare(b.code)));
    notify({ title: "Account Added", message: `${acc.name} (${acc.code}) added to chart of accounts.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleEditAccount = (acc: Account) => {
    setAccounts((prev) => prev.map((a) => a.code === acc.code ? acc : a).sort((a, b) => a.code.localeCompare(b.code)));
    notify({ title: "Account Updated", message: `${acc.name} (${acc.code}) has been updated.`, category: "accounting", priority: "success", actionLabel: "View Accounts", actionModule: "accounting" });
  };

  const handleDeleteAccount = (code: string) => {
    const acc = accounts.find((a) => a.code === code);
    setAccounts((prev) => prev.filter((a) => a.code !== code));
    if (acc) notify({ title: "Account Removed", message: `${acc.name} (${acc.code}) removed from chart of accounts.`, category: "accounting", priority: "info", actionLabel: "View Accounts", actionModule: "accounting" });
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
          />}
        {view === "journal" && <JournalView entries={journalEntries} onAddEntry={() => setShowAddJournal(true)} accounts={accounts} />}
        {view === "reports" && <ReportsView invoices={invoices} expenses={expenses} accounts={accounts} />}
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
      {showViewAccount && <AccountDetailModal account={showViewAccount} onClose={() => setShowViewAccount(null)} onEdit={(acc) => { setShowViewAccount(null); setShowEditAccount(acc); }} onDelete={(code) => { handleDeleteAccount(code); setShowViewAccount(null); }} />}
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
function ChartOfAccountsView({ accounts, onAddNew, onEdit, onView, onDelete }: {
  accounts: Account[];
  onAddNew: () => void;
  onEdit: (acc: Account) => void;
  onView: (acc: Account) => void;
  onDelete: (code: string) => void;
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
          <button onClick={onAddNew} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>

      {/* Grouped Tables */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border py-16 text-center text-gray-400">No accounts match your search</div>
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
    const id = invoice?.id ?? `INV-${new Date().getFullYear()}-${String(invoiceNextNum++).padStart(3, "0")}`;
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
    const id = expense?.id ?? `EXP-${String(expenseNextNum++).padStart(3, "0")}`;
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


function AccountDetailModal({ account: acc, onClose, onEdit, onDelete }: {
  account: Account;
  onClose: () => void;
  onEdit: (acc: Account) => void;
  onDelete: (code: string) => void;
}) {
  const typeColors: Record<string, string> = {
    Asset: "bg-blue-50 text-blue-700 border-blue-200",
    Liability: "bg-red-50 text-red-700 border-red-200",
    Equity: "bg-purple-50 text-purple-700 border-purple-200",
    Revenue: "bg-green-50 text-green-700 border-green-200",
    Expense: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
        <div className="p-5 space-y-4">
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
          <div className="flex gap-2 pt-1 border-t">
            <button onClick={() => onEdit(acc)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Edit Account
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
            <label className="text-xs font-medium text-gray-600 block mb-1">Account Code *</label>
            <input
              required
              value={form.code}
              onChange={(e) => sf("code", e.target.value.replace(/\D/g, "").slice(0, 6))}
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
