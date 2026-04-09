"use client";

import { useState, useEffect, useCallback } from "react";
import { usePOSStore, notify } from "@/store";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
    try {
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          subtotal: getSubtotal(),
          total: getTotal(),
          paymentMethod,
        }),
      });
    } catch {
      // Continue with local checkout
    }
    setCheckoutDone(true);
    const total = getTotal();
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
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

function SalesReports({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back</button>
        <h2 className="text-xl font-bold">Sales Reports</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Today", value: "$2,847.50", sub: "32 transactions" },
          { label: "This Week", value: "$14,231.00", sub: "187 transactions" },
          { label: "This Month", value: "$52,847.00", sub: "743 transactions" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Recent Sales</h3>
        <div className="space-y-3">
          {[
            { id: "INV-0847", amount: "$345.00", method: "Card", time: "10:32 AM" },
            { id: "INV-0846", amount: "$128.50", method: "Cash", time: "10:15 AM" },
            { id: "INV-0845", amount: "$67.99", method: "Mobile", time: "9:48 AM" },
            { id: "INV-0844", amount: "$892.00", method: "Card", time: "9:22 AM" },
            { id: "INV-0843", amount: "$45.50", method: "Cash", time: "9:01 AM" },
          ].map((sale) => (
            <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <span className="text-sm font-medium">{sale.id}</span>
                <span className="text-xs text-gray-400 ml-3">{sale.time}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{sale.method}</span>
                <span className="text-sm font-semibold">{sale.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
