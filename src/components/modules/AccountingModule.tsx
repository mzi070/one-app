"use client";

import { useState } from "react";
import {
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3,
  Plus,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Building,
  Calculator,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type AccView = "overview" | "invoices" | "expenses" | "accounts" | "journal" | "reports";

const chartOfAccounts = [
  { code: "1000", name: "Cash", type: "Asset", balance: 45230.00 },
  { code: "1100", name: "Accounts Receivable", type: "Asset", balance: 18450.00 },
  { code: "1200", name: "Inventory", type: "Asset", balance: 32100.00 },
  { code: "1500", name: "Equipment", type: "Asset", balance: 15000.00 },
  { code: "2000", name: "Accounts Payable", type: "Liability", balance: 12340.00 },
  { code: "2100", name: "Taxes Payable", type: "Liability", balance: 3450.00 },
  { code: "2500", name: "Loans Payable", type: "Liability", balance: 25000.00 },
  { code: "3000", name: "Owner's Equity", type: "Equity", balance: 50000.00 },
  { code: "4000", name: "Sales Revenue", type: "Revenue", balance: 128450.00 },
  { code: "4100", name: "Service Revenue", type: "Revenue", balance: 34200.00 },
  { code: "5000", name: "Cost of Goods Sold", type: "Expense", balance: 64225.00 },
  { code: "5100", name: "Salaries Expense", type: "Expense", balance: 42000.00 },
  { code: "5200", name: "Rent Expense", type: "Expense", balance: 8400.00 },
  { code: "5300", name: "Utilities Expense", type: "Expense", balance: 2100.00 },
];

const invoices = [
  { id: "INV-2026-001", customer: "Acme Corp", amount: 12500.00, status: "paid", dueDate: "2026-03-15", paidAt: "2026-03-12" },
  { id: "INV-2026-002", customer: "Tech Solutions", amount: 8750.00, status: "paid", dueDate: "2026-03-20", paidAt: "2026-03-18" },
  { id: "INV-2026-003", customer: "Global Inc", amount: 15200.00, status: "sent", dueDate: "2026-04-15", paidAt: null },
  { id: "INV-2026-004", customer: "StartUp Co", amount: 3400.00, status: "overdue", dueDate: "2026-04-01", paidAt: null },
  { id: "INV-2026-005", customer: "Design Studio", amount: 6800.00, status: "draft", dueDate: "2026-04-20", paidAt: null },
  { id: "INV-2026-006", customer: "Cloud Services", amount: 22000.00, status: "sent", dueDate: "2026-04-25", paidAt: null },
  { id: "INV-2026-007", customer: "Alpha LLC", amount: 4500.00, status: "paid", dueDate: "2026-03-28", paidAt: "2026-03-25" },
];

const expenses = [
  { id: "EXP-001", category: "Office Supplies", description: "Printer paper and toner", amount: 245.00, date: "2026-04-05", vendor: "OfficeMax", status: "approved" },
  { id: "EXP-002", category: "Software", description: "Monthly SaaS subscriptions", amount: 1200.00, date: "2026-04-01", vendor: "Various", status: "approved" },
  { id: "EXP-003", category: "Travel", description: "Client meeting - flight & hotel", amount: 890.00, date: "2026-04-03", vendor: "Delta Airlines", status: "pending" },
  { id: "EXP-004", category: "Marketing", description: "Google Ads campaign", amount: 2500.00, date: "2026-04-01", vendor: "Google", status: "approved" },
  { id: "EXP-005", category: "Utilities", description: "Electricity bill - March", amount: 680.00, date: "2026-04-02", vendor: "Power Co", status: "approved" },
  { id: "EXP-006", category: "Maintenance", description: "Office AC repair", amount: 350.00, date: "2026-04-06", vendor: "Cool Fix", status: "pending" },
];

const journalEntries = [
  { id: "JE-001", date: "2026-04-08", description: "Sales revenue - Acme Corp", debit: "Cash", credit: "Sales Revenue", amount: 12500.00 },
  { id: "JE-002", date: "2026-04-07", description: "Monthly rent payment", debit: "Rent Expense", credit: "Cash", amount: 2800.00 },
  { id: "JE-003", date: "2026-04-06", description: "Inventory purchase", debit: "Inventory", credit: "Accounts Payable", amount: 5400.00 },
  { id: "JE-004", date: "2026-04-05", description: "Office supplies", debit: "Office Supplies", credit: "Cash", amount: 245.00 },
  { id: "JE-005", date: "2026-04-04", description: "Client payment received", debit: "Cash", credit: "Accounts Receivable", amount: 8750.00 },
  { id: "JE-006", date: "2026-04-03", description: "Salary payment", debit: "Salaries Expense", credit: "Cash", amount: 14000.00 },
];

export default function AccountingModule() {
  const [view, setView] = useState<AccView>("overview");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const navItems: { id: AccView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: PieChart },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "accounts", label: "Chart of Accounts", icon: Building },
    { id: "journal", label: "Journal Entries", icon: Calculator },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto">
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
        {view === "overview" && <AccOverview onNavigate={setView} />}
        {view === "invoices" && <InvoicesView onCreateNew={() => setShowCreateInvoice(true)} />}
        {view === "expenses" && <ExpensesView onAddNew={() => setShowAddExpense(true)} />}
        {view === "accounts" && <ChartOfAccountsView />}
        {view === "journal" && <JournalView />}
        {view === "reports" && <ReportsView />}
      </div>

      {showCreateInvoice && <CreateInvoiceModal onClose={() => setShowCreateInvoice(false)} />}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} />}
    </div>
  );
}

function AccOverview({ onNavigate }: { onNavigate: (view: AccView) => void }) {
  const totalRevenue = 162650;
  const totalExpenses = 116725;
  const netIncome = totalRevenue - totalExpenses;
  const receivables = 18450;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600", change: "+8.2%" },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "bg-red-50 text-red-600", change: "+3.1%" },
          { label: "Net Income", value: formatCurrency(netIncome), icon: DollarSign, color: "bg-blue-50 text-blue-600", change: "+15.4%" },
          { label: "Receivables", value: formatCurrency(receivables), icon: Wallet, color: "bg-orange-50 text-orange-600", change: "4 pending" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}><Icon size={20} /></div>
                <span className="text-xs font-medium text-gray-500">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
            <button onClick={() => onNavigate("invoices")} className="text-sm text-orange-600 hover:text-orange-700">View All</button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{inv.customer}</p>
                  <p className="text-xs text-gray-500">{inv.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(inv.amount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Expenses</h3>
            <button onClick={() => onNavigate("expenses")} className="text-sm text-orange-600 hover:text-orange-700">View All</button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-gray-500">{exp.category} • {exp.vendor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">-{formatCurrency(exp.amount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    exp.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {exp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Profit & Loss Summary (YTD)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 mb-1">Sales Revenue</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(128450)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 mb-1">Service Revenue</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(34200)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(116725)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600 mb-1">Net Profit</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(45925)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoicesView({ onCreateNew }: { onCreateNew: () => void }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                filter === f ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={onCreateNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{inv.id}</td>
                <td className="px-4 py-3">{inv.customer}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3 text-center text-gray-500">{inv.dueDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" :
                    inv.status === "sent" ? "bg-blue-100 text-blue-700" :
                    inv.status === "overdue" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {inv.status === "draft" && (
                      <button className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200" title="Send"><Send size={14} /></button>
                    )}
                    <button className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200" title="Download"><Download size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpensesView({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <button onClick={onAddNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(5865)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(1240)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Top Category</p>
          <p className="text-2xl font-bold text-gray-900">Marketing</p>
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
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{exp.description}</td>
                <td className="px-4 py-3 text-gray-500">{exp.category}</td>
                <td className="px-4 py-3 text-gray-500">{exp.vendor}</td>
                <td className="px-4 py-3 text-center text-gray-500">{exp.date}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">-{formatCurrency(exp.amount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    exp.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartOfAccountsView() {
  const groupedAccounts: Record<string, typeof chartOfAccounts> = {};
  chartOfAccounts.forEach((acc) => {
    if (!groupedAccounts[acc.type]) groupedAccounts[acc.type] = [];
    groupedAccounts[acc.type].push(acc);
  });

  const typeColors: Record<string, string> = {
    Asset: "bg-blue-100 text-blue-700",
    Liability: "bg-red-100 text-red-700",
    Equity: "bg-purple-100 text-purple-700",
    Revenue: "bg-green-100 text-green-700",
    Expense: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Chart of Accounts</h3>
      <div className="space-y-4">
        {Object.entries(groupedAccounts).map(([type, accounts]) => (
          <div key={type} className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}>{type}</span>
              <span className="text-sm font-medium text-gray-600">
                Total: {formatCurrency(accounts.reduce((s, a) => s + a.balance, 0))}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.code} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 w-20">{acc.code}</td>
                    <td className="px-4 py-2.5 font-medium">{acc.name}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(acc.balance)}</td>
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

function JournalView() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Journal Entries</h3>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> New Entry
        </button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Debit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Credit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {journalEntries.map((je) => (
              <tr key={je.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{je.id}</td>
                <td className="px-4 py-3 text-gray-500">{je.date}</td>
                <td className="px-4 py-3 font-medium">{je.description}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">{je.debit}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs">{je.credit}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(je.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView() {
  const totalAssets = chartOfAccounts.filter(a => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = chartOfAccounts.filter(a => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = chartOfAccounts.filter(a => a.type === "Equity").reduce((s, a) => s + a.balance, 0);
  const totalRevenue = chartOfAccounts.filter(a => a.type === "Revenue").reduce((s, a) => s + a.balance, 0);
  const totalExpenseAmt = chartOfAccounts.filter(a => a.type === "Expense").reduce((s, a) => s + a.balance, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h3 className="text-lg font-semibold">Financial Reports</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Sheet */}
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Balance Sheet
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Total Assets</span>
              <span className="text-sm font-bold text-blue-700">{formatCurrency(totalAssets)}</span>
            </div>
            <div className="flex justify-between p-2 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-700">Total Liabilities</span>
              <span className="text-sm font-bold text-red-700">{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="flex justify-between p-2 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Owner&apos;s Equity</span>
              <span className="text-sm font-bold text-purple-700">{formatCurrency(totalEquity)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between p-2">
                <span className="text-sm font-bold">Liabilities + Equity</span>
                <span className="text-sm font-bold">{formatCurrency(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Income Statement */}
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Income Statement
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Total Revenue</span>
              <span className="text-sm font-bold text-green-700">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between p-2 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-700">Total Expenses</span>
              <span className="text-sm font-bold text-orange-700">{formatCurrency(totalExpenseAmt)}</span>
            </div>
            <div className="border-t pt-2">
              <div className={`flex justify-between p-2 rounded-lg ${totalRevenue - totalExpenseAmt >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <span className="text-sm font-bold">Net Income</span>
                <span className={`text-sm font-bold ${totalRevenue - totalExpenseAmt >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {formatCurrency(totalRevenue - totalExpenseAmt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="bg-white rounded-xl border p-5">
        <h4 className="font-semibold text-gray-800 mb-4">Cash Flow Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">Cash In</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(21250)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight size={16} className="text-red-600" />
              <span className="text-sm text-gray-600">Cash Out</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(17045)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-blue-600" />
              <span className="text-sm text-gray-600">Net Flow</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(4205)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ customer: "", email: "", amount: "", dueDate: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
    } catch { /* demo mode */ }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Create Invoice</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        {[
          { name: "customer", label: "Customer Name", type: "text" },
          { name: "email", label: "Customer Email", type: "email" },
          { name: "amount", label: "Amount", type: "number" },
          { name: "dueDate", label: "Due Date", type: "date" },
        ].map((field) => (
          <div key={field.name}>
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type={field.type}
              required
              step={field.type === "number" ? "0.01" : undefined}
              value={form[field.name as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            rows={3}
          />
        </div>
        <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
          Create Invoice
        </button>
      </form>
    </div>
  );
}

function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ category: "Office Supplies", description: "", amount: "", vendor: "", date: "" });
  const expenseCategories = ["Office Supplies", "Software", "Travel", "Marketing", "Utilities", "Maintenance", "Other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
    } catch { /* demo mode */ }
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
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
            {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {[
          { name: "description", label: "Description", type: "text" },
          { name: "amount", label: "Amount", type: "number" },
          { name: "vendor", label: "Vendor", type: "text" },
          { name: "date", label: "Date", type: "date" },
        ].map((field) => (
          <div key={field.name}>
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type={field.type}
              required
              step={field.type === "number" ? "0.01" : undefined}
              value={form[field.name as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        ))}
        <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
          Add Expense
        </button>
      </form>
    </div>
  );
}
