// ─── Accounting Types ───────────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  currency: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  amount: number;
}

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partial" | "overdue" | "void" | "refunded";

export interface Expense {
  id: string;
  category: string;
  subcategory?: string;
  vendorId?: string;
  vendorName: string;
  description: string;
  amount: number;
  taxAmount: number;
  date: string;
  dueDate?: string;
  paidAt?: string;
  status: ExpenseStatus;
  paymentMethod?: string;
  reference?: string;
  attachments?: string[];
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  projectId?: string;
  tags?: string[];
}

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid" | "void";

export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType?: string;
  balance: number;
  availableBalance?: number;
  bankName?: string;
  accountNumber?: string;
  currency: string;
  description?: string;
  isActive: boolean;
  isBankAccount: boolean;
  reconciledBalance?: number;
}

export type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" | "Cost of Goods Sold";

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  status: JournalStatus;
  createdAt: string;
  createdBy?: string;
  postedAt?: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export type JournalStatus = "draft" | "posted" | "void";

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  statementId?: string;
}

export interface BankReconciliation {
  id: string;
  accountId: string;
  statementDate: string;
  endingBalance: number;
  clearedBalance: number;
  difference: number;
  status: "draft" | "completed";
  transactions: BankTransaction[];
}

export interface Budget {
  id: string;
  name: string;
  fiscalYear: number;
  period: "monthly" | "quarterly" | "annually";
  startsAt: string;
  endsAt: string;
  categories: BudgetCategory[];
  status: "draft" | "approved" | "closed";
}

export interface BudgetCategory {
  accountCode: string;
  accountName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  appliesTo: string[];
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  usefulLife: number;
  salvageValue: number;
  depreciationMethod: "straight-line" | "declining-balance" | "units-of-production";
  currentValue: number;
  accumulatedDepreciation: number;
  status: "active" | "disposed" | "fully-depreciated";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  balance: number;
  creditLimit?: number;
  paymentTerms?: number;
}

// ─── Account Categories ────────────────────────────────────────────────────────────────
export const ACCOUNT_TYPES = [
  { id: "Asset", label: "Assets", baseType: "debit" },
  { id: "Liability", label: "Liabilities", baseType: "credit" },
  { id: "Equity", label: "Equity", baseType: "credit" },
  { id: "Revenue", label: "Revenue", baseType: "credit" },
  { id: "Expense", label: "Expenses", baseType: "debit" },
  { id: "Cost of Goods Sold", label: "Cost of Goods Sold", baseType: "debit" },
] as const;

export const ACCOUNT_SUBTYPES: Record<string, { id: string; label: string }[]> = {
  Asset: [
    { id: "current", label: "Current Assets" },
    { id: "fixed", label: "Fixed Assets" },
    { id: "intangible", label: "Intangible Assets" },
    { id: "investment", label: "Investments" },
    { id: "other", label: "Other Assets" },
  ],
  Liability: [
    { id: "current", label: "Current Liabilities" },
    { id: "long-term", label: "Long-term Liabilities" },
    { id: "contingent", label: "Contingent Liabilities" },
  ],
  Equity: [
    { id: "paid-in", label: "Paid-in Capital" },
    { id: "retained", label: "Retained Earnings" },
    { id: "treasury", label: "Treasury Stock" },
  ],
  Revenue: [
    { id: "operating", label: "Operating Revenue" },
    { id: "non-operating", label: "Non-operating Revenue" },
  ],
  Expense: [
    { id: "operating", label: "Operating Expenses" },
    { id: "non-operating", label: "Non-operating Expenses" },
  ],
};

export const EXPENSE_CATEGORIES = [
  "Advertising",
  "Bank Fees",
  "Consulting",
  "Contract Labor",
  "Insurance",
  "Interest",
  "Legal & Professional",
  "Office Supplies",
  "Rent",
  "Software",
  "Taxes & Licenses",
  "Travel",
  "Utilities",
  "Wages & Benefits",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "check", label: "Check" },
  { id: "bank-transfer", label: "Bank Transfer" },
  { id: "credit-card", label: "Credit Card" },
  { id: "debit-card", label: "Debit Card" },
  { id: "online", label: "Online Payment" },
] as const;

// ─── Default Chart of Accounts ────────────────────────────────────────────
export function getDefaultAccounts(): Account[] {
  return [
    // Assets (1000-1999)
    { id: "1", code: "1000", name: "Cash", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: true },
    { id: "2", code: "1100", name: "Accounts Receivable", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "3", code: "1200", name: "Inventory", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "4", code: "1300", name: "Prepaid Expenses", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "5", code: "1500", name: "Equipment", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "6", code: "1600", name: "Accumulated Depreciation", type: "Asset", balance: 0, currency: "USD", isActive: true, isBankAccount: false },

    // Liabilities (2000-2999)
    { id: "7", code: "2000", name: "Accounts Payable", type: "Liability", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "8", code: "2100", name: "Accrued Expenses", type: "Liability", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "9", code: "2200", name: "Sales Tax Payable", type: "Liability", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "10", code: "2300", name: "Notes Payable", type: "Liability", balance: 0, currency: "USD", isActive: true, isBankAccount: false },

    // Equity (3000-3999)
    { id: "11", code: "3000", name: "Owner's Capital", type: "Equity", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "12", code: "3100", name: "Retained Earnings", type: "Equity", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "13", code: "3200", name: "Drawing", type: "Equity", balance: 0, currency: "USD", isActive: true, isBankAccount: false },

    // Revenue (4000-4999)
    { id: "14", code: "4000", name: "Sales Revenue", type: "Revenue", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "15", code: "4100", name: "Service Revenue", type: "Revenue", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "16", code: "4200", name: "Interest Income", type: "Revenue", balance: 0, currency: "USD", isActive: true, isBankAccount: false },

    // Expenses (5000-5999)
    { id: "17", code: "5000", name: "Cost of Goods Sold", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "18", code: "5100", name: "Advertising", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "19", code: "5200", name: "Bank Fees", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "20", code: "5300", name: "Insurance", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "21", code: "5400", name: "Professional Fees", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "22", code: "5500", name: "Rent Expense", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "23", code: "5600", name: "Supplies", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "24", code: "5700", name: "Utilities", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "25", code: "5800", name: "Wages", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
    { id: "26", code: "5900", name: "Depreciation", type: "Expense", balance: 0, currency: "USD", isActive: true, isBankAccount: false },
  ];
}

// ─── Helper Functions ────────────────────────────────────────────────────────
export function calculateInvoiceBalance(invoice: Invoice): number {
  return invoice.total - invoice.amountPaid;
}

export function getInvoiceAge(invoice: Invoice): number {
  const issued = new Date(invoice.issueDate);
  const now = new Date();
  return Math.floor((now.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateDepreciation(
  asset: Asset,
  currentDate: Date
): { year: number; expense: number; accumulated: number; value: number } {
  const purchaseDate = new Date(asset.purchaseDate);
  const yearsOwned = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const yearlyDepreciation = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;

  let expense: number;
  if (asset.depreciationMethod === "straight-line") {
    expense = yearlyDepreciation;
  } else if (asset.depreciationMethod === "declining-balance") {
    const rate = 2 / asset.usefulLife;
    const currentBookValue = asset.purchasePrice - asset.accumulatedDepreciation;
    expense = Math.min(currentBookValue * rate, yearlyDepreciation);
  } else {
    expense = 0;
  }

  const accumulated = Math.min(
    asset.accumulatedDepreciation + expense * yearsOwned,
    asset.purchasePrice - asset.salvageValue
  );
  const value = asset.purchasePrice - accumulated;

  return {
    year: Math.floor(yearsOwned),
    expense: Math.round(expense * 100) / 100,
    accumulated: Math.round(accumulated * 100) / 100,
    value: Math.round(value * 100) / 100,
  };
}

export function calculateProfitLoss(
  revenue: number,
  cogs: number,
  expenses: number
): { gross: number; operating: number; net: number } {
  const gross = revenue - cogs;
  const operating = gross - expenses;
  const net = operating;
  return { gross, operating, net };
}

export function calculateWorkingCapital(
  currentAssets: number,
  currentLiabilities: number
): { workingCapital: number; ratio: number } {
  const workingCapital = currentAssets - currentLiabilities;
  const ratio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  return { workingCapital, ratio };
}

export function formatAccountCode(code: string | number): string {
  const num = typeof code === "string" ? parseInt(code) : code;
  return num.toString().padStart(4, "0");
}

export function validateJournalEntry(lines: JournalLine[]): {
  isValid: boolean;
  errors: string[];
  debits: number;
  credits: number;
} {
  const debits = lines.reduce((sum, l) => sum + l.debit, 0);
  const credits = lines.reduce((sum, l) => sum + l.credit, 0);
  const tolerance = 0.01;
  const isBalanced = Math.abs(debits - credits) < tolerance;

  const errors: string[] = [];
  if (lines.length < 2) errors.push("At least two lines are required");
  if (!isBalanced) errors.push("Debits must equal credits");
  lines.forEach((line, i) => {
    if (!line.accountCode) errors.push(`Line ${i + 1}: Account code is required`);
    if (line.debit === 0 && line.credit === 0) errors.push(`Line ${i + 1}: Must have debit or credit`);
    if (line.debit > 0 && line.credit > 0) errors.push(`Line ${i + 1}: Cannot have both debit and credit`);
  });

  return { isValid: errors.length === 0, errors, debits, credits };
}

// ─── Report Generators ─��────────────────────────────────────────────────
export interface FinancialReport {
  title: string;
  date: string;
  sections: ReportSection[];
  summary: Record<string, number>;
}

export interface ReportSection {
  title: string;
  rows: ReportRow[];
  total: number;
  totalLabel?: string;
}

export interface ReportRow {
  account: string;
  code: string;
  balance: number;
  type: "debit" | "credit";
}

export function generateBalanceSheet(
  accounts: Account[],
  date: Date = new Date()
): FinancialReport {
  const assets = accounts.filter((a) => a.type === "Asset");
  const liabilities = accounts.filter((a) => a.type === "Liability");
  const equity = accounts.filter((a) => a.type === "Equity");

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  return {
    title: "Balance Sheet",
    date: date.toISOString(),
    summary: {
      totalAssets,
      totalLiabilities,
      totalEquity,
    },
    sections: [
      {
        title: "Assets",
        rows: assets.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "debit" as const })),
        total: totalAssets,
        totalLabel: "Total Assets",
      },
      {
        title: "Liabilities",
        rows: liabilities.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "credit" as const })),
        total: totalLiabilities,
        totalLabel: "Total Liabilities",
      },
      {
        title: "Equity",
        rows: equity.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "credit" as const })),
        total: totalEquity,
        totalLabel: "Total Equity",
      },
    ],
  };
}

export function generateProfitLoss(
  accounts: Account[],
  startDate: Date,
  endDate: Date
): FinancialReport {
  const revenue = accounts.filter((a) => a.type === "Revenue");
  const cogs = accounts.filter((a) => a.type === "Cost of Goods Sold");
  const expenses = accounts.filter((a) => a.type === "Expense");

  const totalRevenue = revenue.reduce((sum, a) => sum + a.balance, 0);
  const totalCogs = cogs.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  return {
    title: "Income Statement",
    date: `${startDate.toISOString()} - ${endDate.toISOString()}`,
    summary: {
      totalRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
    },
    sections: [
      {
        title: "Revenue",
        rows: revenue.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "credit" as const })),
        total: totalRevenue,
        totalLabel: "Total Revenue",
      },
      {
        title: "Cost of Goods Sold",
        rows: cogs.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "debit" as const })),
        total: totalCogs,
        totalLabel: "Total COGS",
      },
      {
        title: "Gross Profit",
        rows: [],
        total: grossProfit,
        totalLabel: "Gross Profit",
      },
      {
        title: "Operating Expenses",
        rows: expenses.map((a) => ({ account: a.name, code: a.code, balance: a.balance, type: "debit" as const })),
        total: totalExpenses,
        totalLabel: "Total Expenses",
      },
      {
        title: "Net Income",
        rows: [],
        total: netProfit,
        totalLabel: "Net Income",
      },
    ],
  };
}

// ─── Status Helpers ────────────────────────────────────────────────────────
export function getInvoiceStatusInfo(status: InvoiceStatus): {
  label: string;
  variant: "success" | "warning" | "danger" | "info" | "neutral";
  bg: string;
  text: string;
  icon: string;
} {
  const map: Record<InvoiceStatus, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral"; bg: string; text: string; icon: string }> = {
    draft: { label: "Draft", variant: "neutral", bg: "bg-gray-100", text: "text-gray-600", icon: "FileText" },
    sent: { label: "Sent", variant: "info", bg: "bg-blue-100", text: "text-blue-700", icon: "Send" },
    viewed: { label: "Viewed", variant: "info", bg: "bg-cyan-100", text: "text-cyan-700", icon: "Eye" },
    paid: { label: "Paid", variant: "success", bg: "bg-green-100", text: "text-green-700", icon: "CheckCircle" },
    partial: { label: "Partial", variant: "warning", bg: "bg-yellow-100", text: "text-yellow-700", icon: "Clock" },
    overdue: { label: "Overdue", variant: "danger", bg: "bg-red-100", text: "text-red-700", icon: "AlertCircle" },
    void: { label: "Void", variant: "neutral", bg: "bg-gray-100", text: "text-gray-500", icon: "XCircle" },
    refunded: { label: "Refunded", variant: "info", bg: "bg-purple-100", text: "text-purple-700", icon: "RotateCcw" },
  };
  return map[status] || map.draft;
}

export function getExpenseStatusInfo(status: ExpenseStatus): {
  label: string;
  variant: "success" | "warning" | "danger" | "neutral";
  bg: string;
  text: string;
} {
  const map: Record<ExpenseStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral"; bg: string; text: string }> = {
    pending: { label: "Pending", variant: "warning", bg: "bg-yellow-100", text: "text-yellow-700" },
    approved: { label: "Approved", variant: "success", bg: "bg-green-100", text: "text-green-700" },
    rejected: { label: "Rejected", variant: "danger", bg: "bg-red-100", text: "text-red-700" },
    paid: { label: "Paid", variant: "success", bg: "bg-emerald-100", text: "text-emerald-700" },
    void: { label: "Void", variant: "neutral", bg: "bg-gray-100", text: "text-gray-500" },
  };
  return map[status] || map.pending;
}