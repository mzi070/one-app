"use client";

import { useState, useMemo } from "react";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { getInvoiceStatusInfo, getExpenseStatusInfo, validateJournalEntry, type JournalLine } from "@/lib/accounting";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  Check,
  X,
  AlertCircle,
  FileText,
  FolderOpen,
  Trash2,
  Edit3,
  Eye,
  Send,
  Printer,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  DollarSign,
  Wallet,
  TrendingUp,
  PieChart,
  BarChart3,
  MoreVertical,
} from "lucide-react";

// ─── Stat Card ─────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
}

export function AccStatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50",
    success: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30",
    warning: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30",
    danger: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30",
  };

  const iconStyles = {
    default: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    success: "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-400",
  };

  return (
    <div className={cn("bg-gradient-to-br rounded-xl p-4 border border-gray-200 dark:border-gray-700", variantStyles[variant])}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconStyles[variant])}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {changeLabel && <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>}
    </div>
  );
}

// ─── Invoice Status Badge ────────────────────────────────────────────
export function InvoiceStatusBadge({ status }: { status: string }) {
  const { label, variant, bg, text } = getInvoiceStatusInfo(status as never);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        bg,
        text
      )}
    >
      {variant === "success" && <Check size={12} />}
      {variant === "warning" && <Clock size={12} />}
      {variant === "danger" && <AlertCircle size={12} />}
      {label}
    </span>
  );
}

// ─── Expense Status Badge ───────────────────────────────────────
export function ExpenseStatusBadge({ status }: { status: string }) {
  const { label, variant, bg, text } = getExpenseStatusInfo(status as never);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        bg,
        text
      )}
    >
      {label}
    </span>
  );
}

// ─── Search & Filter Bar ──────────────────────────────────────────────
interface SearchFilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: { label: string; value: string }[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  onExport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function AccSearchFilterBar({
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  activeFilter,
  onFilterChange,
  onExport,
  onAdd,
  addLabel = "Add New",
}: SearchFilterBarProps) {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch?.(e.target.value);
          }}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {filters && filters.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange?.(filter.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeFilter === filter.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Plus size={16} />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Currency Input ─────────────────────────────────────────────
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AccCurrencyInput({
  value,
  onChange,
  currency = "$",
  placeholder = "0.00",
  disabled,
}: CurrencyInputProps) {
  const formatted = value > 0 ? value.toFixed(2) : "";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
        {currency}
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formatted}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-7 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 disabled:bg-gray-100 dark:disabled:bg-gray-900"
      />
    </div>
  );
}

// ─── Journal Entry Form ───────────────────────────────────────────────
interface JournalEntryFormProps {
  onSave: (lines: JournalLine[]) => void;
  onCancel: () => void;
}

export function AccJournalEntryForm({ onSave, onCancel }: JournalEntryFormProps) {
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountCode: "", accountName: "", debit: 0, credit: 0 },
    { id: "2", accountCode: "", accountName: "", debit: 0, credit: 0 },
  ]);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), accountCode: "", accountName: "", debit: 0, credit: 0 },
    ]);
  };

  const updateLine = (id: string, updates: Partial<JournalLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...updates } : line)));
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines((prev) => prev.filter((line) => line.id !== id));
    }
  };

  const validation = useMemo(() => validateJournalEntry(lines), [lines]);

  const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-2">
        <div className="col-span-4">Account</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2 text-right">Debit</div>
        <div className="col-span-2 text-right">Credit</div>
      </div>

      {lines.map((line, index) => (
        <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4">
            <input
              type="text"
              value={line.accountCode}
              onChange={(e) => updateLine(line.id, { accountCode: e.target.value })}
              placeholder="Account code or name..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="col-span-4">
            <input
              type="text"
              value={line.description || ""}
              onChange={(e) => updateLine(line.id, { description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              value={line.debit || ""}
              onChange={(e) => updateLine(line.id, { debit: parseFloat(e.target.value) || 0, credit: 0 })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <input
              type="number"
              value={line.credit || ""}
              onChange={(e) => updateLine(line.id, { credit: parseFloat(e.target.value) || 0, debit: 0 })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {lines.length > 2 && (
              <button
                onClick={() => removeLine(line.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addLine}
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium"
      >
        <Plus size={16} /> Add Line
      </button>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-4">
          <span className={cn("text-sm", isBalanced ? "text-green-600" : "text-red-600")}>
            Debits: {formatCurrency(totalDebits)}
          </span>
          <span className={cn("text-sm", isBalanced ? "text-green-600" : "text-red-600")}>
            Credits: {formatCurrency(totalCredits)}
          </span>
        </div>
        <span className={cn("text-sm font-medium", isBalanced ? "text-green-600" : "text-red-600")}>
          {isBalanced ? "✓ Balanced" : "⚠ Out of balance"}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(lines)}
          disabled={!validation.isValid}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg text-sm font-medium text-white disabled:cursor-not-allowed"
        >
          Post Entry
        </button>
      </div>
    </div>
  );
}

// ─── Data Table with Pagination ───────────────────────────────────────
interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyField: keyof T;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function AccDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  pageSize = 10,
  emptyMessage = "No data found",
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FileText size={40} className="mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.map((item) => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn("px-4 py-3", col.className)}>
                    {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 px-4">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.length)} of{" "}
            {data.length} entries
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm",
                  page === p && "bg-blue-600 text-white"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}