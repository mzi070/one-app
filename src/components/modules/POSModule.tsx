"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePOSStore, usePOSSalesStore, usePOSCustomerStore, useSettingsStore, type SaleRecord, type POSCustomer, notify } from "@/store";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
  Package,
  X,
  Tag,
  BarChart3,
  Users,
  ChevronDown,
  Receipt,
  CheckCircle,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Trash2 as TrashIcon,
  Star,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string | null;
  imageUrl: string | null;
  cost?: number;
  description?: string | null;
}

type POSView = "sale" | "products" | "customers" | "reports";

const categories = ["all", "Electronics", "Grocery", "Beverages", "Clothing", "Other"];

export default function POSModule() {
  const [view, setView] = useState<POSView>("sale");
  const [products, setProducts] = useState<Product[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const {
    cart,
    searchQuery,
    selectedCategory,
    paymentMethod,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    clearCart,
    setSearchQuery,
    setSelectedCategory,
    setPaymentMethod,
    getSubtotal,
    getTotal,
  } = usePOSStore();

  const { recordSale } = usePOSSalesStore();
  const { customers, addCustomer, recordPurchase } = usePOSCustomerStore();
  const taxRate = useSettingsStore((s) => s.taxRate);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [pendingTxnId, setPendingTxnId] = useState<string>("");
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      // remain empty
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const subtotal = getSubtotal();
    const discountedTotal = getTotal();
    const tax = discountedTotal * (taxRate / 100);
    const total = discountedTotal + tax;
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

    const now = new Date().toISOString();
    const txnId = pendingTxnId || `TXN-${Date.now()}`;

    // Record sale in local history
    recordSale({
      id: txnId,
      timestamp: now,
      items: cart.map((c) => ({ name: c.name, productId: c.productId, quantity: c.quantity, price: c.price })),
      subtotal,
      tax,
      total,
      paymentMethod,
      itemCount,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
    });

    // Update customer stats
    if (selectedCustomer) {
      recordPurchase(selectedCustomer.id, total, now);
    }

    try {
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, subtotal, total, paymentMethod }),
      });
    } catch {
      // Continue with local checkout
    }

    // Deduct stock for each sold item
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const newQty = Math.max(0, product.quantity - item.quantity);
        try {
          await fetch(`/api/products/${item.productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
        } catch {
          // Continue anyway
        }
      }
    }
    loadProducts();
    setCheckoutDone(true);
    notify({
      title: "Sale Completed",
      message: `${itemCount} item${itemCount !== 1 ? "s" : ""} sold for ${formatCurrency(total)} via ${paymentMethod}.`,
      category: "pos",
      priority: "success",
      actionLabel: "View Reports",
      actionModule: "pos",
    });
    // Low stock check
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockItems = products.filter((p) => {
      const cartItem = cart.find((c) => c.productId === p.id);
      const remaining = p.quantity - (cartItem?.quantity ?? 0);
      return remaining <= LOW_STOCK_THRESHOLD && remaining >= 0;
    });
    if (lowStockItems.length > 0) {
      notify({
        title: "Low Stock Alert",
        message: `${lowStockItems.map((p) => p.name).join(", ")} ${lowStockItems.length === 1 ? "is" : "are"} running low on stock.`,
        category: "pos",
        priority: "warning",
        actionLabel: "View Inventory",
        actionModule: "pos",
      });
    }
    setTimeout(() => {
      clearCart();
      setSelectedCustomerId(null);
      setCheckoutDone(false);
      setShowCheckout(false);
      setCashTendered("");
      setPendingTxnId("");
    }, 2000);
  };

  const taxAmount = getTotal() * (taxRate / 100);

  if (view === "products") return <ProductsManager products={products} onBack={() => setView("sale")} onRefresh={loadProducts} />;
  if (view === "customers") return <CustomersView onBack={() => setView("sale")} onSelectForSale={(id) => { setSelectedCustomerId(id); setView("sale"); }} />;
  if (view === "reports") return <SalesReports onBack={() => setView("sale")} />;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b p-3">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setView("products")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Package size={16} /> Products
            </button>
            <button onClick={() => setView("customers")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Users size={16} /> Customers
            </button>
            <button onClick={() => setView("reports")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <BarChart3 size={16} /> Reports
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredProducts.map((product) => {
              const isOOS = product.quantity === 0;
              const isLow = product.quantity > 0 && product.quantity <= 10;
              return (
                <button
                  key={product.id}
                  onClick={() => !isOOS && addToCart({ productId: product.id, name: product.name, price: product.price })}
                  disabled={isOOS}
                  className={cn(
                    "bg-white rounded-xl border p-3 text-left transition-all group relative",
                    isOOS ? "border-gray-100 opacity-60 cursor-not-allowed" : "border-gray-200 hover:border-green-400 hover:shadow-md"
                  )}
                >
                  <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center transition-colors relative overflow-hidden">
                    {isOOS ? (
                      <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Out of Stock</span>
                      </div>
                    ) : (
                      <ShoppingBag size={24} className="text-gray-300 group-hover:text-green-400 transition-colors" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 truncate">{product.sku}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-green-600">{formatCurrency(product.price)}</span>
                    <span className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded-full",
                      isOOS ? "bg-red-100 text-red-600" : isLow ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {product.quantity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 bg-white border-l flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Receipt size={18} />
            Current Sale
          </h3>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600">
              Clear All
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="border-b px-3 py-2">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-green-50 rounded-lg px-2.5 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck size={15} className="text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-800 truncate">{selectedCustomer.name}</p>
                  {selectedCustomer.creditBalance > 0 && (
                    <p className="text-xs text-green-600">Credit: {formatCurrency(selectedCustomer.creditBalance)}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedCustomerId(null)} className="text-green-400 hover:text-green-700 ml-1 shrink-0">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => { setShowCustomerPicker((v) => !v); setCustomerSearch(""); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <UserPlus size={14} /> Add customer to sale
              </button>
              {showCustomerPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {customers
                      .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomerId(c.id); setShowCustomerPicker(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                        >
                          <div>
                            <p className="text-xs font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                          {c.creditBalance > 0 && (
                            <span className="text-xs text-green-600 font-medium shrink-0 ml-2">{formatCurrency(c.creditBalance)}</span>
                          )}
                        </button>
                      ))}
                    {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No customers found</p>
                    )}
                  </div>
                  <div className="border-t p-2">
                    <button
                      onClick={() => { setShowCustomerPicker(false); setShowNewCustomerModal(true); }}
                      className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                    >
                      <UserPlus size={13} /> New Customer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingBag size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click on products to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-8 text-center text-sm font-medium bg-transparent border-0 outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-16 text-right">
                    {formatCurrency((item.price - item.discount) * item.quantity)}
                  </span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pl-0.5">
                  <Tag size={10} className="text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400">Disc:</span>
                  <div className="relative flex items-center">
                    <span className="absolute left-1.5 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      min={0}
                      max={item.price}
                      step={0.01}
                      value={item.discount || ""}
                      placeholder="0"
                      onChange={(e) => updateDiscount(item.id, Math.min(item.price, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-16 pl-4 pr-1 py-0.5 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-green-400 bg-white"
                    />
                  </div>
                  {item.discount > 0 && (
                    <span className="text-xs text-green-600 font-medium">−{formatCurrency(item.discount * item.quantity)}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div className="border-t p-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {getSubtotal() !== getTotal() && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>−{formatCurrency(getSubtotal() - getTotal())}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(getTotal() + taxAmount)}</span>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2">
              {[
                { id: "cash", label: "Cash", icon: Banknote },
                { id: "card", label: "Card", icon: CreditCard },
                { id: "mobile", label: "Mobile", icon: Smartphone },
              ].map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    onClick={() => { setPaymentMethod(pm.id); setCashTendered(""); }}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors ${
                      paymentMethod === pm.id
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={16} />
                    {pm.label}
                  </button>
                );
              })}
            </div>

            {/* Cash change calculator */}
            {paymentMethod === "cash" && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Banknote size={13} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-800">Cash Tendered</span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={`${(getTotal() + taxAmount).toFixed(2)}`}
                  className="w-full px-2.5 py-1.5 border border-green-200 rounded-lg text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-400 bg-white"
                />
                {cashTendered !== "" && !isNaN(parseFloat(cashTendered)) && (
                  parseFloat(cashTendered) >= getTotal() + taxAmount ? (
                    <div className="flex justify-between text-sm font-bold text-green-700">
                      <span>Change Due</span>
                      <span>{formatCurrency(parseFloat(cashTendered) - (getTotal() + taxAmount))}</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-red-600">
                      Need {formatCurrency((getTotal() + taxAmount) - parseFloat(cashTendered))} more
                    </p>
                  )
                )}
              </div>
            )}

            <button
              onClick={() => { setPendingTxnId(`TXN-${Date.now()}`); setShowCheckout(true); }}
              disabled={paymentMethod === "cash" && cashTendered !== "" && parseFloat(cashTendered) < getTotal() + taxAmount}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Receipt size={18} />
              Charge {formatCurrency(getTotal() + taxAmount)}
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !checkoutDone && setShowCheckout(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {checkoutDone ? (
              <div className="text-center py-10 px-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={36} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                <p className="text-gray-500 mt-1 text-sm">Transaction {pendingTxnId} completed</p>
                {paymentMethod === "cash" && cashTendered && parseFloat(cashTendered) >= getTotal() + taxAmount && (
                  <div className="mt-4 bg-green-50 rounded-xl px-4 py-3 inline-flex items-center gap-2">
                    <Banknote size={16} className="text-green-600" />
                    <span className="text-green-800 text-sm font-semibold">
                      Change: {formatCurrency(parseFloat(cashTendered) - (getTotal() + taxAmount))}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Receipt header */}
                <div className="bg-gray-900 text-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Order Summary</h3>
                      <p className="text-gray-400 text-xs mt-0.5 font-mono">{pendingTxnId}</p>
                    </div>
                    <button onClick={() => setShowCheckout(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  {selectedCustomer && (
                    <div className="flex items-center gap-1.5 mt-2 text-green-300 text-xs">
                      <UserCheck size={13} />
                      <span>{selectedCustomer.name}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="px-5 py-3 max-h-48 overflow-y-auto border-b border-gray-100">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <span className="text-gray-800 font-medium truncate block">{item.name}</span>
                        <span className="text-gray-400 text-xs">
                          {formatCurrency(item.price)} × {item.quantity}
                          {item.discount > 0 && ` − ${formatCurrency(item.discount)}/ea`}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 ml-3 shrink-0">
                        {formatCurrency((item.price - item.discount) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-5 py-3 space-y-1.5 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  {getSubtotal() !== getTotal() && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span><span>−{formatCurrency(getSubtotal() - getTotal())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total</span><span>{formatCurrency(getTotal() + taxAmount)}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="capitalize font-semibold text-gray-800 text-sm">{paymentMethod}</span>
                  </div>
                  {paymentMethod === "cash" && cashTendered && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 flex justify-between text-sm font-bold text-green-700 mb-2">
                      <span>Change Due</span>
                      <span>{formatCurrency(Math.max(0, parseFloat(cashTendered) - (getTotal() + taxAmount)))}</span>
                    </div>
                  )}
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-base transition-colors"
                  >
                    Complete Sale — {formatCurrency(getTotal() + taxAmount)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onAdded={loadProducts} />}

      {/* New Customer from Sale View */}
      {showNewCustomerModal && (
        <CustomerModal
          customer={null}
          onClose={() => setShowNewCustomerModal(false)}
          onSave={(data) => {
            const newCustomer = addCustomer(data);
            setSelectedCustomerId(newCustomer.id);
            setShowNewCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Products Management ──────────────────────────────────────────────────────
interface ProductFormData {
  name: string;
  sku: string;
  price: string;
  cost: string;
  quantity: string;
  category: string;
  description: string;
}

function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
}) {
  const [form, setForm] = useState<ProductFormData>(
    product
      ? {
          name: product.name,
          sku: product.sku,
          price: String(product.price),
          cost: String(product.cost ?? ""),
          quantity: String(product.quantity),
          category: product.category || "Other",
          description: product.description || "",
        }
      : { name: "", sku: "", price: "", cost: "", quantity: "", category: "Other", description: "" }
  );

  const setField = (k: keyof ProductFormData, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const priceNum = parseFloat(form.price) || 0;
  const costNum = parseFloat(form.cost) || 0;
  const marginPct = priceNum > 0 && costNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || !form.price || !form.quantity) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{product ? "Edit Product" : "Add Product"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              placeholder="e.g. Wireless Mouse"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">SKU *</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setField("sku", e.target.value)}
              required
              placeholder="e.g. WM-001"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {categories.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Selling Price *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Cost Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Stock Quantity *</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          {marginPct !== null && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <TrendingUp size={12} className="text-green-500" />
              Margin: <span className="font-semibold ml-1">{marginPct}%</span>
              &nbsp;·&nbsp; Profit per unit: <span className="font-semibold ml-1">{formatCurrency(priceNum - costNum)}</span>
            </div>
          )}
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional product description..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockAdjustModal({
  product,
  onClose,
  onAdjust,
}: {
  product: Product;
  onClose: () => void;
  onAdjust: (newQty: number) => void;
}) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [amount, setAmount] = useState("");

  const newQty = useMemo(() => {
    const val = parseInt(amount) || 0;
    if (mode === "add") return product.quantity + val;
    if (mode === "remove") return Math.max(0, product.quantity - val);
    return Math.max(0, val);
  }, [mode, amount, product.quantity]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Adjust Stock</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium">{product.name}</span> — Current: <span className="font-bold">{product.quantity}</span> units
        </p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
          {(["add", "remove", "set"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setAmount(""); }}
              className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-colors", mode === m ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700")}
            >
              {m === "add" ? "Add" : m === "remove" ? "Remove" : "Set Exact"}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === "set" ? "Enter exact quantity" : "Enter amount"}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none mb-3"
          autoFocus
        />
        {amount && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
            <Package size={12} />
            New stock: <span className={cn("font-bold ml-1", newQty === 0 ? "text-red-600" : newQty <= 10 ? "text-yellow-600" : "text-green-600")}>{newQty} units</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => { if (amount) { onAdjust(newQty); onClose(); } }}
            disabled={!amount}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsManager({ products: initialProducts, onBack, onRefresh }: { products: Product[]; onBack: () => void; onRefresh: () => void }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc">("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const LOW_STOCK = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => {
        const matchQ =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false);
        const matchCat = filterCategory === "all" || p.category === filterCategory;
        return matchQ && matchCat;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-asc": return a.price - b.price;
          case "price-desc": return b.price - a.price;
          case "stock-asc": return a.quantity - b.quantity;
          case "stock-desc": return b.quantity - a.quantity;
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [products, search, filterCategory, sortBy]);

  const kpis = useMemo(() => {
    const priced = products.filter((p) => p.price > 0 && (p.cost ?? 0) > 0);
    return {
      total: products.length,
      totalValue: products.reduce((s, p) => s + p.price * p.quantity, 0),
      totalCost: products.reduce((s, p) => s + (p.cost ?? 0) * p.quantity, 0),
      lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= LOW_STOCK).length,
      outOfStock: products.filter((p) => p.quantity === 0).length,
      avgMargin:
        priced.length > 0
          ? priced.reduce((s, p) => s + ((p.price - (p.cost ?? 0)) / p.price) * 100, 0) / priced.length
          : 0,
    };
  }, [products]);

  const handleSave = async (data: ProductFormData) => {
    const payload = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      price: parseFloat(data.price),
      cost: parseFloat(data.cost || "0"),
      quantity: parseInt(data.quantity),
      category: data.category,
      description: data.description.trim() || null,
    };

    if (editingProduct) {
      const updated = { ...editingProduct, ...payload };
      setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? updated : p));
      try {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch { /* local update done */ }
      notify({ title: "Product Updated", message: `${payload.name} has been updated.`, category: "pos", priority: "success" });
    } else {
      const tempId = `local-${Date.now()}`;
      setProducts((prev) => [{ id: tempId, imageUrl: null, ...payload }, ...prev]);
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProducts((prev) => prev.map((p) => p.id === tempId ? created : p));
        }
      } catch { /* keep temp */ }
      notify({ title: "Product Added", message: `${payload.name} added to inventory.`, category: "pos", priority: "success" });
    }

    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    } catch { /* local delete done */ }
    notify({ title: "Product Deleted", message: `${product.name} removed from inventory.`, category: "pos", priority: "info" });
  };

  const handleStockAdjust = async (product: Product, newQty: number) => {
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, quantity: newQty } : p));
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
    } catch { /* local update done */ }
    if (newQty <= LOW_STOCK && newQty > 0) {
      notify({ title: "Low Stock Warning", message: `${product.name} has only ${newQty} units left.`, category: "pos", priority: "warning" });
    }
  };

  const copySku = (sku: string) => {
    navigator.clipboard.writeText(sku).catch(() => {});
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const exportCsv = () => {
    const headers = ["Name", "SKU", "Category", "Price", "Cost", "Quantity", "Status"];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      p.category || "",
      p.price.toFixed(2),
      (p.cost ?? 0).toFixed(2),
      p.quantity,
      p.quantity === 0 ? "Out of Stock" : p.quantity <= LOW_STOCK ? "Low Stock" : "In Stock",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "products.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const catColors: Record<string, string> = {
    Electronics: "bg-blue-100 text-blue-700",
    Grocery: "bg-green-100 text-green-700",
    Beverages: "bg-cyan-100 text-cyan-700",
    Clothing: "bg-purple-100 text-purple-700",
    Other: "bg-gray-100 text-gray-600",
  };

  const statusBadge = (qty: number) =>
    qty === 0
      ? { label: "Out of Stock", cls: "bg-red-100 text-red-700" }
      : qty <= LOW_STOCK
      ? { label: "Low Stock", cls: "bg-yellow-100 text-yellow-700" }
      : { label: "In Stock", cls: "bg-green-100 text-green-700" };

  const calcMargin = (p: Product) =>
    p.price > 0 && (p.cost ?? 0) > 0
      ? Math.round(((p.price - (p.cost ?? 0)) / p.price) * 100)
      : null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Product Inventory</h2>
              <p className="text-sm text-gray-500">{products.length} products · {formatCurrency(kpis.totalValue)} retail value</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total SKUs", value: String(kpis.total), icon: Package, color: "bg-blue-50 text-blue-600" },
            { label: "Retail Value", value: formatCurrency(kpis.totalValue), icon: TrendingUp, color: "bg-green-50 text-green-600" },
            { label: "Stock Cost", value: formatCurrency(kpis.totalCost), icon: Wallet, color: "bg-purple-50 text-purple-600" },
            { label: "Avg Margin", value: `${kpis.avgMargin.toFixed(1)}%`, icon: BarChart3, color: "bg-orange-50 text-orange-600" },
            { label: "Low Stock", value: String(kpis.lowStock), icon: AlertCircle, color: "bg-yellow-50 text-yellow-600" },
            { label: "Out of Stock", value: String(kpis.outOfStock), icon: TrendingDown, color: "bg-red-50 text-red-600" },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", k.color)}>
                  <Icon size={13} />
                </div>
                <p className="text-base font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
            );
          })}
        </div>

        {/* Stock Alert Banner */}
        {(kpis.outOfStock > 0 || kpis.lowStock > 0) && (
          <div className={cn("rounded-xl px-4 py-3 flex items-center gap-3 text-sm border", kpis.outOfStock > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-yellow-50 border-yellow-200 text-yellow-700")}>
            <AlertCircle size={16} className="shrink-0" />
            <span>
              {kpis.outOfStock > 0 && `${kpis.outOfStock} product${kpis.outOfStock > 1 ? "s are" : " is"} out of stock. `}
              {kpis.lowStock > 0 && `${kpis.lowStock} product${kpis.lowStock > 1 ? "s are" : " is"} running low on stock.`}
              {" "}Review and restock as needed.
            </span>
          </div>
        )}

        {/* Search + Sort + View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Name A-Z</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="stock-asc">Stock ↑</option>
              <option value="stock-desc">Stock ↓</option>
            </select>
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={cn("px-3 py-2 transition-colors", viewMode === "table" ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-50")}
                title="Table view"
              >
                <BarChart3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn("px-3 py-2 transition-colors", viewMode === "grid" ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-50")}
                title="Card grid view"
              >
                <Package size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filterCategory === cat
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600"
              )}
            >
              {cat === "all" ? "All Categories" : cat}
              {cat !== "all" && (
                <span className="ml-1 opacity-60">({products.filter((p) => p.category === cat).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <Package size={48} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 mb-1">No products found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              + Add a new product
            </button>
          </div>

        ) : viewMode === "table" ? (
          /* ── Table View ── */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">SKU</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs hidden lg:table-cell">Cost</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs hidden lg:table-cell">Margin</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Stock</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const { label, cls } = statusBadge(p.quantity);
                    const m = calcMargin(p);
                    const isLow = p.quantity > 0 && p.quantity <= LOW_STOCK;
                    const isOut = p.quantity === 0;
                    return (
                      <tr
                        key={p.id}
                        className={cn("border-b border-gray-50 hover:bg-gray-50 transition-colors", isOut ? "bg-red-50/40" : isLow ? "bg-yellow-50/40" : "")}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", catColors[p.category || "Other"] || "bg-gray-100 text-gray-600")}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-400 truncate max-w-44">{p.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <button
                            onClick={() => copySku(p.sku)}
                            className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-gray-200 rounded text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
                            title="Click to copy SKU"
                          >
                            {p.sku}
                            {copiedSku === p.sku ? <CheckCircle size={10} className="text-green-500" /> : <Tag size={10} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.category && (
                            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", catColors[p.category] || "bg-gray-100 text-gray-600")}>
                              {p.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs hidden lg:table-cell">
                          {(p.cost ?? 0) > 0 ? formatCurrency(p.cost ?? 0) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {m !== null ? (
                            <span className={cn("text-xs font-medium", m >= 30 ? "text-green-600" : m >= 10 ? "text-yellow-600" : "text-red-500")}>
                              {m}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setStockProduct(p)}
                            className={cn("px-2.5 py-0.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors min-w-10", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-gray-800")}
                            title="Click to adjust stock"
                          >
                            {p.quantity}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cls)}>{label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setStockProduct(p)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Adjust stock"
                            >
                              <Package size={13} />
                            </button>
                            <button
                              onClick={() => { setEditingProduct(p); setShowModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit product"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete product"
                            >
                              <TrashIcon size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          /* ── Card Grid View ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const { label, cls } = statusBadge(p.quantity);
              const m = calcMargin(p);
              const isLow = p.quantity > 0 && p.quantity <= LOW_STOCK;
              const isOut = p.quantity === 0;
              return (
                <div key={p.id} className={cn("bg-white rounded-xl border p-4 hover:shadow-md transition-shadow", isOut ? "border-red-200" : isLow ? "border-yellow-200" : "border-gray-200")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", catColors[p.category || "Other"] || "bg-gray-100 text-gray-600")}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cls)}>{label}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">{p.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">{p.sku} · {p.category || "Uncategorized"}</p>
                  {p.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{p.description}</p>}
                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(p.price)}</p>
                      {m !== null && (
                        <p className={cn("text-xs", m >= 30 ? "text-green-600" : m >= 10 ? "text-yellow-600" : "text-red-500")}>{m}% margin</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-gray-700")}>{p.quantity}</p>
                      <p className="text-xs text-gray-400">units</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={() => setStockProduct(p)}
                      className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      Stock
                    </button>
                    <button
                      onClick={() => { setEditingProduct(p); setShowModal(true); }}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="py-1.5 px-2.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}

      {stockProduct && (
        <StockAdjustModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onAdjust={(newQty) => { handleStockAdjust(stockProduct, newQty); setStockProduct(null); }}
        />
      )}
    </div>
  );
}

// ─── Customer Management ────────────────────────────────────────────────────
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  creditBalance: number;
}

const emptyForm: CustomerFormData = { name: "", email: "", phone: "", address: "", notes: "", creditBalance: 0 };

function CustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: POSCustomer | null;
  onClose: () => void;
  onSave: (data: CustomerFormData) => void;
}) {
  const [form, setForm] = useState<CustomerFormData>(
    customer
      ? { name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, notes: customer.notes, creditBalance: customer.creditBalance }
      : emptyForm
  );

  const set = (k: keyof CustomerFormData, v: string | number) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{customer ? "Edit Customer" : "Add Customer"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {([
            { key: "name", label: "Full Name *", placeholder: "John Smith", type: "text" },
            { key: "email", label: "Email", placeholder: "john@example.com", type: "email" },
            { key: "phone", label: "Phone", placeholder: "+1-234-5678", type: "tel" },
            { key: "address", label: "Address", placeholder: "123 Main St, City", type: "text" },
          ] as const).map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                required={f.key === "name"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Credit Balance ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.creditBalance}
              onChange={(e) => set("creditBalance", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea
              rows={2}
              placeholder="Any special notes..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
            {customer ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CustomerDetailPanel({
  customer,
  salesHistory,
  onClose,
  onEdit,
  onDelete,
  onSelectForSale,
  onAdjustCredit,
}: {
  customer: POSCustomer;
  salesHistory: SaleRecord[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectForSale: () => void;
  onAdjustCredit: (delta: number) => void;
}) {
  const [creditAdjust, setCreditAdjust] = useState("");
  const customerSales = salesHistory
    .filter((s) => s.customerId === customer.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const tierLabel = customer.totalSpent >= 10000 ? "Platinum" : customer.totalSpent >= 2000 ? "Gold" : customer.totalSpent >= 500 ? "Silver" : "Standard";
  const tierColor = customer.totalSpent >= 10000 ? "text-purple-600 bg-purple-50" : customer.totalSpent >= 2000 ? "text-yellow-600 bg-yellow-50" : customer.totalSpent >= 500 ? "text-gray-500 bg-gray-100" : "text-blue-600 bg-blue-50";

  const handleCredit = (sign: 1 | -1) => {
    const val = parseFloat(creditAdjust);
    if (!val || val <= 0) return;
    onAdjustCredit(sign * val);
    setCreditAdjust("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={onClose}>
      <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()} style={{ animation: "fadeInUp 0.2s ease" }}>
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{customer.name}</h3>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tierColor)}>{tierLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit3 size={15} /></button>
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><TrashIcon size={15} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact Info */}
          <div className="p-4 border-b border-gray-100 space-y-2">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400 shrink-0" />{customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />{customer.phone}
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0" />{customer.address}
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-500 bg-amber-50 rounded-lg p-2 mt-1">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />{customer.notes}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x border-b border-gray-100">
            {[
              { label: "Total Spent", value: formatCurrency(customer.totalSpent) },
              { label: "Visits", value: String(customer.visitCount) },
              { label: "Avg Order", value: customer.visitCount > 0 ? formatCurrency(customer.totalSpent / customer.visitCount) : "$0" },
            ].map((s) => (
              <div key={s.label} className="p-3 text-center">
                <p className="text-sm font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Credit Balance */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Wallet size={14} className="text-green-600" /> Credit Balance
              </p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(customer.creditBalance)}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={creditAdjust}
                onChange={(e) => setCreditAdjust(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-500"
              />
              <button onClick={() => handleCredit(1)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">+ Add</button>
              <button onClick={() => handleCredit(-1)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">- Use</button>
            </div>
          </div>

          {/* Purchase History */}
          <div className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" /> Purchase History
            </p>
            {customerSales.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No purchases recorded yet</p>
            ) : (
              <div className="space-y-2">
                {customerSales.map((s) => {
                  const d = new Date(s.timestamp);
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{s.id}</p>
                        <p className="text-xs text-gray-400">{d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-xs text-gray-400">{s.itemCount} items · <span className="capitalize">{s.paymentMethod}</span></p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(s.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onSelectForSale}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} /> Start Sale for {customer.name.split(" ")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomersView({ onBack, onSelectForSale }: { onBack: () => void; onSelectForSale: (id: string) => void }) {
  const { customers, addCustomer, updateCustomer, deleteCustomer, adjustCredit } = usePOSCustomerStore();
  const { salesHistory } = usePOSSalesStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<POSCustomer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<POSCustomer | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "spent" | "visits" | "credit">("spent");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "spent") return b.totalSpent - a.totalSpent;
        if (sortBy === "visits") return b.visitCount - a.visitCount;
        return b.creditBalance - a.creditBalance;
      });
  }, [customers, search, sortBy]);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalCredit = customers.reduce((s, c) => s + c.creditBalance, 0);

  const handleSave = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      addCustomer(data);
    }
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleDelete = (c: POSCustomer) => {
    if (confirm(`Delete customer "${c.name}"? This cannot be undone.`)) {
      deleteCustomer(c.id);
      setDetailCustomer(null);
    }
  };

  const handleEdit = (c: POSCustomer) => {
    setEditingCustomer(c);
    setShowModal(true);
    setDetailCustomer(null);
  };

  const tierLabel = (spent: number) =>
    spent >= 10000 ? "Platinum" : spent >= 2000 ? "Gold" : spent >= 500 ? "Silver" : "Standard";
  const tierDot = (spent: number) =>
    spent >= 10000 ? "bg-purple-500" : spent >= 2000 ? "bg-yellow-400" : spent >= 500 ? "bg-gray-400" : "bg-blue-400";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer Management</h2>
              <p className="text-sm text-gray-500">{customers.length} customers · {formatCurrency(totalRevenue)} lifetime revenue</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingCustomer(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus size={16} /> Add Customer
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Customers", value: String(customers.length), icon: Users, color: "bg-blue-50 text-blue-600" },
            { label: "Lifetime Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600" },
            { label: "Credit Outstanding", value: formatCurrency(totalCredit), icon: Wallet, color: "bg-orange-50 text-orange-600" },
            { label: "Avg Spend", value: customers.length > 0 ? formatCurrency(totalRevenue / customers.length) : "$0", icon: Star, color: "bg-purple-50 text-purple-600" },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", k.color)}>
                    <Icon size={14} />
                  </div>
                  <p className="text-xs text-gray-500">{k.label}</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Sort by:</span>
            {(["spent", "visits", "name", "credit"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors", sortBy === s ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-green-400")}
              >
                {s === "spent" ? "Revenue" : s === "visits" ? "Visits" : s === "credit" ? "Credit" : "Name"}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={40} className="opacity-30 mb-3" />
              <p className="text-sm">No customers found</p>
              <button onClick={() => { setEditingCustomer(null); setShowModal(true); }} className="mt-3 text-sm text-green-600 hover:text-green-700">+ Add your first customer</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Contact</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Tier</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Total Spent</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Visits</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Credit</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs hidden lg:table-cell">Last Visit</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const tier = tierLabel(c.totalSpent);
                    const dot = tierDot(c.totalSpent);
                    const lastVisit = c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "—";
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setDetailCustomer(c)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{c.name}</p>
                              <p className="text-xs text-gray-400">Since {new Date(c.joinedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-gray-600">{c.email || "—"}</p>
                          <p className="text-xs text-gray-400">{c.phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className={cn("w-2 h-2 rounded-full", dot)} />{tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(c.totalSpent)}</td>
                        <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{c.visitCount}</td>
                        <td className="px-4 py-3 text-right">
                          {c.creditBalance > 0 ? (
                            <span className="text-green-600 font-medium">{formatCurrency(c.creditBalance)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400 hidden lg:table-cell">{lastVisit}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { onSelectForSale(c.id); }}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Start sale"
                            >
                              <ShoppingBag size={13} />
                            </button>
                            <button
                              onClick={() => handleEdit(c)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon size={13} />
                            </button>
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
          onSave={handleSave}
        />
      )}

      {/* Detail Panel */}
      {detailCustomer && (
        <CustomerDetailPanel
          customer={detailCustomer}
          salesHistory={salesHistory}
          onClose={() => setDetailCustomer(null)}
          onEdit={() => handleEdit(detailCustomer)}
          onDelete={() => handleDelete(detailCustomer)}
          onSelectForSale={() => { onSelectForSale(detailCustomer.id); setDetailCustomer(null); }}
          onAdjustCredit={(delta) => {
            adjustCredit(detailCustomer.id, delta);
            setDetailCustomer((prev) => prev ? { ...prev, creditBalance: Math.max(0, prev.creditBalance + delta) } : null);
          }}
        />
      )}
    </div>
  );
}

type ReportPeriod = "today" | "week" | "month";

function SalesReports({ onBack }: { onBack: () => void }) {
  const { salesHistory } = usePOSSalesStore();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const allSales = useMemo<SaleRecord[]>(() => salesHistory, [salesHistory]);

  // Filter by period
  const periodSales = useMemo(() => {
    const now = new Date();
    return allSales.filter((s) => {
      const d = new Date(s.timestamp);
      if (period === "today") {
        return d.toDateString() === now.toDateString();
      } else if (period === "week") {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      } else {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
      }
    });
  }, [allSales, period]);

  // KPIs
  const kpis = useMemo(() => {
    const revenue = periodSales.reduce((s, x) => s + x.total, 0);
    const count = periodSales.length;
    const avg = count > 0 ? revenue / count : 0;
    const byMethod = { cash: 0, card: 0, mobile: 0 };
    periodSales.forEach((s) => {
      const key = s.paymentMethod as keyof typeof byMethod;
      if (key in byMethod) byMethod[key] += s.total;
    });
    const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0];
    return { revenue, count, avg, byMethod, topMethod };
  }, [periodSales]);

  // Daily trend (last 7 or 30 days bucketed by day)
  const trendData = useMemo(() => {
    const days = period === "today" ? 1 : period === "week" ? 7 : 30;
    const buckets: { label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = period === "today"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { month: "short", day: "numeric" });
      const dateStr = d.toDateString();
      const dayRevenue = periodSales
        .filter((s) => new Date(s.timestamp).toDateString() === dateStr)
        .reduce((s, x) => s + x.total, 0);
      const dayCount = periodSales.filter((s) => new Date(s.timestamp).toDateString() === dateStr).length;
      buckets.push({ label, revenue: dayRevenue, count: dayCount });
    }
    return buckets;
  }, [periodSales, period]);

  const maxTrend = Math.max(...trendData.map((d) => d.revenue), 1);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    periodSales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = map.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
        map.set(item.name, {
          name: item.name,
          qty: existing.qty + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
        });
      });
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [periodSales]);

  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  // Transaction list (filtered)
  const transactions = useMemo(() => {
    return periodSales
      .filter((s) => {
        const matchSearch = search === "" || s.id.toLowerCase().includes(search.toLowerCase()) || s.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
        const matchMethod = methodFilter === "all" || s.paymentMethod === methodFilter;
        return matchSearch && matchMethod;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }, [periodSales, search, methodFilter]);

  // CSV Export
  const handleExport = () => {
    const rows = [["ID", "Date", "Time", "Items", "Subtotal", "Tax", "Total", "Payment"]];
    periodSales.forEach((s) => {
      const d = new Date(s.timestamp);
      rows.push([
        s.id,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        String(s.itemCount),
        s.subtotal.toFixed(2),
        s.tax.toFixed(2),
        s.total.toFixed(2),
        s.paymentMethod,
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodColors: Record<string, string> = {
    cash: "text-green-600",
    card: "text-blue-600",
    mobile: "text-purple-600",
  };
  const methodBg: Record<string, string> = {
    cash: "bg-green-50",
    card: "bg-blue-50",
    mobile: "bg-purple-50",
  };
  const methodBadge: Record<string, string> = {
    cash: "bg-green-100 text-green-700",
    card: "bg-blue-100 text-blue-700",
    mobile: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sales Reports</h2>
              <p className="text-sm text-gray-500">Point of Sale performance analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Period tabs */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    period === p ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {p === "today" ? "Today" : p === "week" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</p>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.revenue)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpis.count} transactions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transactions</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Receipt size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpis.count}</p>
            <p className="text-xs text-gray-400 mt-0.5">Completed sales</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Order</p>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <ShoppingBag size={16} className="text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.avg)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Per transaction</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Method</p>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Wallet size={16} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{kpis.topMethod?.[0] ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(kpis.topMethod?.[1] ?? 0)}</p>
          </div>
        </div>

        {/* Trend + Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                Revenue Trend
              </h3>
              <p className="text-xs text-gray-400">{period === "today" ? "Today" : period === "week" ? "Last 7 days" : "Last 30 days"}</p>
            </div>
            <div className="flex items-end gap-1 h-36">
              {trendData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {formatCurrency(d.revenue)} · {d.count} sales
                  </div>
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-default"
                    style={{ height: `${Math.max(4, (d.revenue / maxTrend) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            {/* X-axis labels — show every nth for readability */}
            <div className="flex items-center gap-1 mt-1">
              {trendData.map((d, i) => {
                const step = trendData.length > 14 ? Math.ceil(trendData.length / 7) : 1;
                return (
                  <div key={i} className="flex-1 text-center overflow-hidden">
                    {i % step === 0 && (
                      <span className="text-[9px] text-gray-400">{d.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Summary under chart */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Revenue
              </span>
              <span className="text-xs text-gray-400">
                Peak day: {formatCurrency(maxTrend)} · {kpis.count} total transactions
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              Payment Methods
            </h3>
            <div className="space-y-4">
              {(["cash", "card", "mobile"] as const).map((method) => {
                const val = kpis.byMethod[method];
                const pct = kpis.revenue > 0 ? (val / kpis.revenue) * 100 : 0;
                const Icon = method === "cash" ? Banknote : method === "card" ? CreditCard : Smartphone;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", methodBg[method])}>
                          <Icon size={14} className={methodColors[method]} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(val)}</p>
                        <p className="text-xs text-gray-400">{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", method === "cash" ? "bg-green-500" : method === "card" ? "bg-blue-500" : "bg-purple-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Transaction Count</p>
              {(["cash", "card", "mobile"] as const).map((method) => (
                <div key={method} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 capitalize">{method}</span>
                  <span className="font-medium text-gray-800">
                    {periodSales.filter((s) => s.paymentMethod === method).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products + Transaction List */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Top Products */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={16} className="text-gray-400" />
              Top Products
            </h3>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No sales data for this period</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <span className="text-sm text-gray-700 truncate">{p.name}</span>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(p.revenue)}</p>
                        <p className="text-xs text-gray-400">{p.qty} sold</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <div
                        className="h-1 bg-green-400 rounded-full"
                        style={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Receipt size={16} className="text-gray-400" />
                Transactions
                <span className="text-xs font-normal text-gray-400">({transactions.length} shown)</span>
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ID or product..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                >
                  <option value="all">All methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Receipt size={32} className="opacity-30 mb-2" />
                  <p className="text-sm">No transactions found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">ID</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Date & Time</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Items</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Method</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((s) => {
                      const d = new Date(s.timestamp);
                      return (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.id}</td>
                          <td className="px-4 py-2.5">
                            <p className="text-xs text-gray-700">{d.toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-gray-600">{s.itemCount}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", methodBadge[s.paymentMethod] ?? "bg-gray-100 text-gray-600")}>
                              {s.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800 text-xs">{formatCurrency(s.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
