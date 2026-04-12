"use client";

import { useState } from "react";
import {
  ScanBarcode,
  Clock,
  Save,
  RotateCcw,
  Calculator,
  Send,
  UserPlus,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { usePOSStore, useSettingsStore, notify, formatCurrency } from "@/store";
import { cn } from "@/lib/utils";
import { POS_CATEGORIES, QUICK_AMOUNTS } from "@/lib/pos";

interface QuickActionsProps {
  onHold?: () => void;
  onRecall?: () => void;
  onSaveCustomer?: () => void;
}

export function QuickActionsToolbar({
  onHold,
  onRecall,
  onSaveCustomer,
}: QuickActionsProps) {
  const { cart, getTotal, clearCart, setPaymentMethod } = usePOSStore();
  const taxRate = useSettingsStore((s) => s.taxRate);
  const total = getTotal() * (1 + taxRate / 100);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      console.log("Barcode scanned:", barcodeInput);
      setBarcodeInput("");
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              showScanner
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <ScanBarcode size={16} />
            Scan
          </button>

          <button
            onClick={onHold}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock size={16} />
            Hold
          </button>

          <button
            onClick={onRecall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <RotateCcw size={16} />
            Recall
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1" />

          <button
            onClick={onSaveCustomer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <UserPlus size={16} />
            New Customer
          </button>
        </div>

        {showScanner && (
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or enter barcode..."
              className="w-48 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add
            </button>
          </form>
        )}

        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">Total:</span>
          <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

interface QuickAmountPadProps {
  onSelectAmount: (amount: number) => void;
}

export function QuickAmountPad({ onSelectAmount }: QuickAmountPadProps) {
  const [customAmount, setCustomAmount] = useState("");

  return (
    <div className="bg-white border rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Calculator size={14} /> Quick Amount
        </h4>
        <span className="text-xs text-gray-400">Cash only</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => onSelectAmount(amount)}
            className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            ${amount}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom amount"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
        />
        <button
          onClick={() => {
            const amount = parseFloat(customAmount);
            if (amount > 0) {
              onSelectAmount(amount);
              setCustomAmount("");
            }
          }}
          disabled={!customAmount}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

interface OrderHoldPanelProps {
  onClose: () => void;
}

export function OrderHoldPanel({ onClose }: OrderHoldPanelProps) {
  const heldOrders = usePOSStore((s) => (s as unknown as { heldOrders: unknown[] }).heldOrders || []);
  const [held, setHeld] = useState<{ id: string; timestamp: string; items: unknown[]; total: number }[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} /> Held Orders
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {held.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No held orders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {held.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    console.log("Recall order:", order.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {order.items.length} items
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaymentBreakdownProps {
  total: number;
  taxRate: number;
  discount: number;
}

export function PaymentBreakdown({
  total,
  taxRate,
  discount,
}: PaymentBreakdownProps) {
  const subtotal = total - discount;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="bg-white border rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-800">{formatCurrency(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Tax ({taxRate}%)</span>
        <span className="text-gray-800">{formatCurrency(taxAmount)}</span>
      </div>

      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span className="text-gray-900">Total</span>
        <span className="text-gray-900">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}

interface PaymentMethodSelectorProps {
  selected: string;
  onSelect: (method: string) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  const methods = [
    { id: "cash", label: "Cash", icon: Banknote, color: "green" },
    { id: "card", label: "Card", icon: CreditCard, color: "blue" },
    { id: "mobile", label: "Mobile", icon: Send, color: "purple" },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Payment Method
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                isSelected
                  ? `border-${method.color}-500 bg-${method.color}-50`
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Icon
                size={20}
                className={isSelected ? `text-${method.color}-600` : "text-gray-400"}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? `text-${method.color}-700` : "text-gray-500"
                )}
              >
                {method.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}