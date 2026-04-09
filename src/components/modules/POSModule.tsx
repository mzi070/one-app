"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePOSStore, usePOSSalesStore, type SaleRecord, notify } from "@/store";
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
}

type POSView = "sale" | "products" | "customers" | "reports";

const categories = ["all", "Electronics", "Grocery", "Beverages", "Clothing", "Other"];

// Demo products for when DB is empty
const demoProducts: Product[] = [
  { id: "demo-1", name: "Wireless Mouse", sku: "WM-001", price: 29.99, quantity: 50, category: "Electronics", imageUrl: null },
  { id: "demo-2", name: "USB-C Cable", sku: "UC-002", price: 12.99, quantity: 100, category: "Electronics", imageUrl: null },
  { id: "demo-3", name: "Notebook A5", sku: "NB-003", price: 4.99, quantity: 200, category: "Other", imageUrl: null },
  { id: "demo-4", name: "Coffee Beans 500g", sku: "CB-004", price: 18.50, quantity: 75, category: "Beverages", imageUrl: null },
  { id: "demo-5", name: "Green Tea Pack", sku: "GT-005", price: 8.99, quantity: 120, category: "Beverages", imageUrl: null },
  { id: "demo-6", name: "Organic Milk 1L", sku: "OM-006", price: 5.49, quantity: 60, category: "Grocery", imageUrl: null },
  { id: "demo-7", name: "Whole Wheat Bread", sku: "WB-007", price: 3.99, quantity: 40, category: "Grocery", imageUrl: null },
  { id: "demo-8", name: "Bluetooth Speaker", sku: "BS-008", price: 49.99, quantity: 30, category: "Electronics", imageUrl: null },
  { id: "demo-9", name: "Cotton T-Shirt", sku: "CT-009", price: 19.99, quantity: 80, category: "Clothing", imageUrl: null },
  { id: "demo-10", name: "Desk Lamp LED", sku: "DL-010", price: 34.99, quantity: 25, category: "Electronics", imageUrl: null },
  { id: "demo-11", name: "Hand Sanitizer", sku: "HS-011", price: 6.99, quantity: 150, category: "Other", imageUrl: null },
  { id: "demo-12", name: "Energy Drink 250ml", sku: "ED-012", price: 2.99, quantity: 200, category: "Beverages", imageUrl: null },
];

export default function POSModule() {
  const [view, setView] = useState<POSView>("sale");
  const [products, setProducts] = useState<Product[]>(demoProducts);
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
    clearCart,
    setSearchQuery,
    setSelectedCategory,
    setPaymentMethod,
    getSubtotal,
    getTotal,
  } = usePOSStore();

  const { recordSale } = usePOSSalesStore();

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setProducts(data);
      }
    } catch {
      // Use demo products
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
    const tax = subtotal * 0.05;
    const total = getTotal() + tax;
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

    // Record sale in local history
    recordSale({
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: cart.map((c) => ({ name: c.name, productId: c.productId, quantity: c.quantity, price: c.price })),
      subtotal,
      tax,
      total,
      paymentMethod,
      itemCount,
    });

    try {
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, subtotal, total, paymentMethod }),
      });
    } catch {
      // Continue with local checkout
    }
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
      setCheckoutDone(false);
      setShowCheckout(false);
    }, 2000);
  };

  const taxAmount = getSubtotal() * 0.05;

  if (view === "products") return <ProductsManager products={products} onBack={() => setView("sale")} onRefresh={loadProducts} />;
  if (view === "customers") return <CustomersView onBack={() => setView("sale")} />;
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
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart({ productId: product.id, name: product.name, price: product.price })}
                className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-green-400 hover:shadow-md transition-all group"
              >
                <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                  <ShoppingBag size={24} className="text-gray-300 group-hover:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-400">{product.sku}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-green-600">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-gray-400">Qty: {product.quantity}</span>
                </div>
              </button>
            ))}
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
              <div key={item.id} className="bg-gray-50 rounded-lg p-2.5 flex items-center gap-2">
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
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-800 w-16 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (5%)</span>
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
                    onClick={() => setPaymentMethod(pm.id)}
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

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {checkoutDone ? (
              <div className="text-center py-6">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                <p className="text-gray-500 mt-2">Transaction completed</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Confirm Payment</h3>
                  <button onClick={() => setShowCheckout(false)} className="p-1 rounded hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span><span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span><span>{formatCurrency(getTotal() + taxAmount)}</span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Payment: <span className="capitalize font-medium">{paymentMethod}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                >
                  Complete Sale
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onAdded={loadProducts} />}
    </div>
  );
}

function ProductsManager({ products, onBack, onRefresh }: { products: Product[]; onBack: () => void; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Sale</button>
          <h2 className="text-xl font-bold">Product Inventory</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                <td className="px-4 py-3"><Tag size={12} className="inline mr-1" />{p.category || "N/A"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3 text-right">{p.quantity}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.quantity > 10 ? "bg-green-100 text-green-700" : p.quantity > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {p.quantity > 10 ? "In Stock" : p.quantity > 0 ? "Low" : "Out"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdded={onRefresh} />}
    </div>
  );
}

function AddProductModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "", category: "Other" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity),
        }),
      });
      onAdded();
      onClose();
    } catch {
      alert("Failed to save product");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Product</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        {(["name", "sku", "price", "quantity"] as const).map((field) => (
          <div key={field}>
            <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
            <input
              type={field === "price" || field === "quantity" ? "number" : "text"}
              required
              step={field === "price" ? "0.01" : undefined}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
          >
            {categories.filter((c) => c !== "all").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={saving} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
          {saving ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

function CustomersView({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email: string; phone: string; credit: number }>>([
    { id: "1", name: "John Smith", email: "john@example.com", phone: "+1-234-5678", credit: 150.00 },
    { id: "2", name: "Jane Doe", email: "jane@example.com", phone: "+1-345-6789", credit: 0 },
    { id: "3", name: "Acme Corp", email: "billing@acme.com", phone: "+1-456-7890", credit: 2450.00 },
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back</button>
        <h2 className="text-xl font-bold">Customer Management</h2>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-right px-4 py-3">Credit Balance</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.credit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Demo sales data (30 days) ────────────────────────────────────────────────
function generateDemoSales(): SaleRecord[] {
  const products = [
    { id: "demo-1", name: "Wireless Mouse", price: 29.99 },
    { id: "demo-2", name: "USB-C Cable", price: 12.99 },
    { id: "demo-3", name: "Notebook A5", price: 4.99 },
    { id: "demo-4", name: "Coffee Beans 500g", price: 18.50 },
    { id: "demo-5", name: "Green Tea Pack", price: 8.99 },
    { id: "demo-6", name: "Organic Milk 1L", price: 5.49 },
    { id: "demo-7", name: "Whole Wheat Bread", price: 3.99 },
    { id: "demo-8", name: "Bluetooth Speaker", price: 49.99 },
    { id: "demo-9", name: "Cotton T-Shirt", price: 19.99 },
    { id: "demo-10", name: "Desk Lamp LED", price: 34.99 },
    { id: "demo-11", name: "Hand Sanitizer", price: 6.99 },
    { id: "demo-12", name: "Energy Drink 250ml", price: 2.99 },
  ];
  const methods = ["cash", "card", "mobile"] as const;
  const sales: SaleRecord[] = [];
  const now = new Date();
  let counter = 800;

  for (let day = 29; day >= 0; day--) {
    const base = new Date(now);
    base.setDate(base.getDate() - day);
    const seed = day * 7 + 3;
    const count = 6 + (seed % 9);

    for (let i = 0; i < count; i++) {
      const h = 8 + ((seed * (i + 1) * 3) % 12);
      const m = (seed * i * 7) % 60;
      const d = new Date(base);
      d.setHours(h, m, 0, 0);

      const numItems = 1 + ((seed + i) % 3);
      const items: SaleRecord["items"] = [];
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const p = products[(seed * (i + 1) + j * 5) % products.length];
        const qty = 1 + (j % 3);
        items.push({ name: p.name, productId: p.id, quantity: qty, price: p.price });
        subtotal += p.price * qty;
      }
      const tax = subtotal * 0.05;
      sales.push({
        id: `TXN-${String(++counter).padStart(4, "0")}`,
        timestamp: d.toISOString(),
        items,
        subtotal,
        tax,
        total: subtotal + tax,
        paymentMethod: methods[(seed + i * 3) % 3],
        itemCount: items.reduce((s, x) => s + x.quantity, 0),
      });
    }
  }
  return sales;
}

const DEMO_SALES = generateDemoSales();

type ReportPeriod = "today" | "week" | "month";

function SalesReports({ onBack }: { onBack: () => void }) {
  const { salesHistory } = usePOSSalesStore();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  // Merge demo + real sales (real ones first), deduplicate by id
  const allSales = useMemo<SaleRecord[]>(() => {
    const seen = new Set<string>();
    return [...salesHistory, ...DEMO_SALES].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [salesHistory]);

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
