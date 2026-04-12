// ─── POS Types ────────────────────────────────────────────────────────────────────────────────
export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string | null;
  imageUrl: string | null;
  cost?: number;
  description?: string | null;
  barcode?: string;
  unitOfMeasure?: string;
  minStock?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface POSCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  notes?: string;
}

export interface POSSale {
  id: string;
  timestamp: string;
  items: POSSaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: POSPaymentMethod;
  amountPaid: number;
  changeGiven: number;
  itemCount: number;
  customerId?: string;
  customerName?: string;
  status: POSSaleStatus;
  notes?: string;
  casherName?: string;
}

export interface POSSaleItem {
  name: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
}

export type POSPaymentMethod = "cash" | "card" | " mobile" | "split" | "credit";
export type POSSaleStatus = "completed" | "refunded" | "voided" | "hold";
export type POSSaleView = "sale" | "products" | "customers" | "reports" | "hold";

// ─── POS Constants ────────────────────────────────────────────────────────────────
export const POS_CATEGORIES = [
  "all",
  "Electronics",
  "Grocery",
  "Beverages",
  "Clothing",
  "Food",
  "Other",
] as const;

export const PAYMENT_METHODS: { id: POSPaymentMethod; label: string; icon: string }[] = [
  { id: "cash", label: "Cash", icon: "banknote" },
  { id: "card", label: "Card", icon: "credit-card" },
  { id: "mobile", label: "Mobile Pay", icon: "smartphone" },
  { id: "split", label: "Split", icon: "divide" },
  { id: "credit", label: "Credit", icon: "wallet" },
];

export const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export const LOW_STOCK_THRESHOLD = 10;

// ─── POS Status Helpers ───────────────────────────────────────────────────────────
export function getStockStatus(quantity: number): {
  label: string;
  variant: "success" | "warning" | "danger";
  color: string;
  bg: string;
} {
  if (quantity === 0) {
    return { label: "Out of Stock", variant: "danger", color: "text-red-600", bg: "bg-red-100" };
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { label: "Low Stock", variant: "warning", color: "text-yellow-600", bg: "bg-yellow-100" };
  }
  return { label: "In Stock", variant: "success", color: "text-green-600", bg: "bg-green-100" };
}

export function getCustomerTier(totalSpent: number): {
  label: string;
  color: string;
  bg: string;
  min: number;
} {
  if (totalSpent >= 10000) {
    return { label: "Platinum", color: "text-purple-600", bg: "bg-purple-50", min: 10000 };
  }
  if (totalSpent >= 2000) {
    return { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-50", min: 2000 };
  }
  if (totalSpent >= 500) {
    return { label: "Silver", color: "text-gray-600", bg: "bg-gray-50", min: 500 };
  }
  return { label: "Standard", color: "text-blue-600", bg: "bg-blue-50", min: 0 };
}

export function calculateMargin(price: number, cost: number): number | null {
  if (price <= 0 || cost <= 0) return null;
  return Math.round(((price - cost) / price) * 100);
}

// ─── POS Validation ─────────────────────────────────────────────────────────────
export function validatePOSProduct(product: Partial<POSProduct>): string[] {
  const errors: string[] = [];
  if (!product.name?.trim()) errors.push("Product name is required");
  if (!product.sku?.trim()) errors.push("SKU is required");
  if (!product.price || product.price < 0) errors.push("Valid price is required");
  if (product.quantity === undefined || product.quantity < 0) {
    errors.push("Valid quantity is required");
  }
  return errors;
}

export function validatePOSSale(cart: POSCartItem[], paymentMethod: string, amountPaid: number): string[] {
  const errors: string[] = [];
  if (cart.length === 0) errors.push("Cart is empty");
  if (!paymentMethod) errors.push("Payment method is required");
  if (paymentMethod === "cash" && amountPaid <= 0) {
    errors.push("Amount paid is required");
  }
  return errors;
}

// ─── Barcode Parser ────────────────────────────────────────────────────────
export function parseBarcode(barcode: string): {
  format: "ean13" | "ean8" | "upc" | "code128" | "unknown";
  code: string;
} {
  const cleaned = barcode.replace(/\D/g, "");
  
  if (/^(\d{13})$/.test(cleaned)) {
    return { format: "ean13", code: cleaned };
  }
  if (/^(\d{8})$/.test(cleaned)) {
    return { format: "ean8", code: cleaned };
  }
  if (/^(\d{12})$/.test(cleaned)) {
    return { format: "upc", code: cleaned };
  }
  
  return { format: "code128", code: barcode };
}

// ─── Receipt Generator ──────────────────────────────────────────────────────────────
export function generateReceiptHTML(sale: POSSale, businessInfo: {
  name: string;
  address: string;
  phone: string;
}): string {
  const itemsHTML = sale.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:left;padding:4px 0;">${item.name}</td>
      <td style="text-align:center;padding:4px;">${item.quantity}</td>
      <td style="text-align:right;padding:4px;">$${item.price.toFixed(2)}</td>
      <td style="text-align:right;padding:4px;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${sale.id}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 5px; }
    .info { text-align: center; margin-bottom: 15px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #333; padding-top: 10px; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #888; }
  </style>
</head>
<body>
  <h1>${businessInfo.name}</h1>
  <div class="info">
    <p>${businessInfo.address}</p>
    <p>${businessInfo.phone}</p>
    <p>${new Date(sale.timestamp).toLocaleString()}</p>
  </div>
  <table>
    <thead>
      <tr style="border-bottom:1px dashed #333;">
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
    <tfoot class="total">
      <tr><td colspan="3">Subtotal</td><td style="text-align:right;">$${sale.subtotal.toFixed(2)}</td></tr>
      <tr><td colspan="3">Tax</td><td style="text-align:right;">$${sale.tax.toFixed(2)}</td></tr>
      <tr style="font-size:16px;"><td colspan="3">TOTAL</td><td style="text-align:right;">$${sale.total.toFixed(2)}</td></tr>
    </tfoot>
  </table>
  <div class="footer">
    <p>Transaction ID: ${sale.id}</p>
    <p>Payment: ${sale.paymentMethod}</p>
    <p>Thank you for your purchase!</p>
  </div>
</body>
</html>
  `;
}

// ─── Sales Analytics ────────────────────────────────────────────────────────
export interface POSSalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  itemsSold: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesByHour: { hour: number; count: number; revenue: number }[];
  salesByPayment: { method: string; count: number; revenue: number }[];
  growth: number;
}

export function calculatePOSAnalytics(sales: POSSale[]): POSSalesAnalytics {
  if (sales.length === 0) {
    return {
      totalRevenue: 0,
      totalSales: 0,
      averageSale: 0,
      itemsSold: 0,
      topProducts: [],
      salesByHour: [],
      salesByPayment: [],
      growth: 0,
    };
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.length;
  const averageSale = totalRevenue / totalSales;
  const itemsSold = sales.reduce((sum, s) => sum + s.itemCount, 0);

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  sales.forEach((s) => {
    s.items.forEach((item) => {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productMap.set(item.productId, {
          name: item.name,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const hourMap = new Map<number, { count: number; revenue: number }>();
  sales.forEach((s) => {
    const hour = new Date(s.timestamp).getHours();
    const existing = hourMap.get(hour);
    if (existing) {
      existing.count++;
      existing.revenue += s.total;
    } else {
      hourMap.set(hour, { count: 1, revenue: s.total });
    }
  });

  const salesByHour = Array.from(hourMap.entries())
    .map(([hour, data]) => ({ hour, ...data }))
    .sort((a, b) => a.hour - b.hour);

  const paymentMap = new Map<string, { count: number; revenue: number }>();
  sales.forEach((s) => {
    const existing = paymentMap.get(s.paymentMethod);
    if (existing) {
      existing.count++;
      existing.revenue += s.total;
    } else {
      paymentMap.set(s.paymentMethod, { count: 1, revenue: s.total });
    }
  });

  const salesByPayment = Array.from(paymentMap.entries())
    .map(([method, data]) => ({ method, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const currentPeriod = sales.filter((s) => new Date(s.timestamp).getTime() > thirtyDaysAgo);
  const previousPeriod = sales.filter(
    (s) => new Date(s.timestamp).getTime() <= thirtyDaysAgo && new Date(s.timestamp).getTime() > thirtyDaysAgo * 2
  );
  const currentRevenue = currentPeriod.reduce((sum, s) => sum + s.total, 0);
  const previousRevenue = previousPeriod.reduce((sum, s) => sum + s.total, 0);
  const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalSales,
    averageSale,
    itemsSold,
    topProducts,
    salesByHour,
    salesByPayment,
    growth: Math.round(growth * 10) / 10,
  };
}