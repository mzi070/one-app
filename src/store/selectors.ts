import { useMemo, useCallback } from "react";
import {
  useNotificationStore,
  useToastStore,
  useAuthStore,
  useAppStore,
  usePOSStore,
  usePOSSalesStore,
  usePOSCustomerStore,
  useSettingsStore,
  useProfileStore,
  useHRStore,
  useThemeStore,
  type AppNotification,
  type ToastItem,
  type POSCustomer,
  type SaleRecord,
  type CartItem,
  type HREmployee,
  type LeaveRequest,
  type PayrollRecord,
} from "./index";

// ─── Notification Selectors ─────────────────────────────────────────────────────────
export function useUnreadNotifications(): AppNotification[] {
  return useNotificationStore((state) => state.notifications.filter((n) => !n.read));
}

export function useNotificationsByCategory(category: AppNotification["category"]): AppNotification[] {
  return useNotificationStore((state) =>
    state.notifications.filter((n) => n.category === category)
  );
}

export function useNotificationsByPriority(priority: AppNotification["priority"]): AppNotification[] {
  return useNotificationStore((state) =>
    state.notifications.filter((n) => n.priority === priority)
  );
}

export function useNotificationCount(): { total: number; unread: number } {
  const notifications = useNotificationStore((state) => state.notifications);
  return useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    }),
    [notifications]
  );
}

// ─── Toast Selectors ────────────────────────────────────────────────────────────────
export function useToastsByType(type: ToastItem["type"]): ToastItem[] {
  return useToastStore((state) => state.toasts.filter((t) => t.type === type));
}

export function useActiveToast(): ToastItem | null {
  return useToastStore((state) => state.toasts[0] ?? null);
}

// ─── POS Selectors ────────────────────────────────────────────────────────────────
export function useCartItemCount(): number {
  return usePOSStore((state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0)
  );
}

export function useCartTotal(): { subtotal: number; discount: number; total: number; tax: number } {
  const cart = usePOSStore((state) => state.cart);
  const getSubtotal = usePOSStore((state) => state.getSubtotal);
  const getTotal = usePOSStore((state) => state.getTotal);
  const taxRate = useSettingsStore((state) => state.taxRate);

  return useMemo(() => {
    const subtotal = getSubtotal();
    const total = getTotal();
    const discount = subtotal - total;
    const tax = total * (taxRate / 100);
    return { subtotal, discount, total, tax };
  }, [cart, getSubtotal, getTotal, taxRate]);
}

export function useFilteredProducts(products: { id: string; name: string; sku: string; category: string | null }[]) {
  const searchQuery = usePOSStore((state) => state.searchQuery);
  const selectedCategory = usePOSStore((state) => state.selectedCategory);

  return useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);
}

export function usePOSCustomerById(id: string | null): POSCustomer | null {
  return usePOSCustomerStore((state) =>
    id ? state.customers.find((c) => c.id === id) ?? null : null
  );
}

export function useTopCustomers(limit = 5): POSCustomer[] {
  return usePOSCustomerStore((state) =>
    [...state.customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
  );
}

export function useSalesByDateRange(
  salesHistory: SaleRecord[],
  startDate?: Date,
  endDate?: Date
): SaleRecord[] {
  return useMemo(() => {
    if (!startDate && !endDate) return salesHistory;
    return salesHistory.filter((sale) => {
      const saleDate = new Date(sale.timestamp);
      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;
      return true;
    });
  }, [salesHistory, startDate, endDate]);
}

export function useSalesStats(salesHistory: SaleRecord[]): {
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  topPaymentMethod: string;
} {
  return useMemo(() => {
    if (salesHistory.length === 0) {
      return { totalRevenue: 0, totalSales: 0, averageSale: 0, topPaymentMethod: "cash" };
    }

    const totalRevenue = salesHistory.reduce((sum, s) => sum + s.total, 0);
    const totalSales = salesHistory.length;
    const averageSale = totalRevenue / totalSales;

    const paymentCounts: Record<string, number> = {};
    salesHistory.forEach((s) => {
      paymentCounts[s.paymentMethod] = (paymentCounts[s.paymentMethod] || 0) + 1;
    });
    const topPaymentMethod = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cash";

    return { totalRevenue, totalSales, averageSale, topPaymentMethod };
  }, [salesHistory]);
}

// ─── HR Selectors ────────────────────────────────────────────────────────────────
export function useActiveEmployees(): HREmployee[] {
  return useHRStore((state) =>
    state.employees.filter((e) => e.status === "active")
  );
}

export function useEmployeesByDepartment(department: string): HREmployee[] {
  return useHRStore((state) =>
    state.employees.filter((e) => e.department === department)
  );
}

export function usePendingLeaveRequests(): LeaveRequest[] {
  return useHRStore((state) =>
    state.leaveRequests.filter((l) => l.status === "pending")
  );
}

export function usePayrollByPeriod(period: string): PayrollRecord[] {
  return useHRStore((state) =>
    state.payrollRecords.filter((p) => p.period === period)
  );
}

export function useEmployeeById(id: string): HREmployee | null {
  return useHRStore((state) =>
    state.employees.find((e) => e.id === id) ?? null
  );
}

export function useHRStats(): {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  pendingLeave: number;
  totalPayroll: number;
} {
  const employees = useHRStore((state) => state.employees);
  const leaveRequests = useHRStore((state) => state.leaveRequests);

  return useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === "active").length;
    const onLeave = employees.filter((e) => e.status === "on-leave").length;
    const pendingLeave = leaveRequests.filter((l) => l.status === "pending").length;
    const totalPayroll = employees.reduce((sum, e) => sum + e.salary / 12, 0);

    return {
      totalEmployees: employees.length,
      activeEmployees,
      onLeave,
      pendingLeave,
      totalPayroll,
    };
  }, [employees, leaveRequests]);
}

// ─── Settings Selectors ────────────────────────────────────────────────────────────
export function useSetting<K extends keyof ReturnType<typeof useSettingsStore.getState>>(
  key: K
): ReturnType<typeof useSettingsStore.getState>[K] {
  return useSettingsStore((state) => state[key]);
}

// ─── Profile Selectors ────────────────────────────────────────────────────────────
export function useRecentActivity(limit = 5) {
  const activityLog = useProfileStore((state) => state.activityLog);
  return useMemo(() => activityLog.slice(0, limit), [activityLog]);
}

// ─── Memoized Selectors (Factory) ─────────────────────────────────────────────────
export function createNotificationSelector(category: AppNotification["category"]) {
  return () => useNotificationStore((state) =>
    state.notifications.filter((n) => n.category === category)
  );
}

export function createPOSFilterSelector<T extends { category: string | null; name: string }>(
  getItems: () => T[]
) {
  return (searchQuery: string, category: string) =>
    useMemo(() => {
      const items = getItems();
      return items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = category === "all" || item.category === category;
        return matchesSearch && matchesCategory;
      });
    }, [getItems, searchQuery, category]);
}

// ─── Optimized Action Hooks ───────────────────────────────────────────────────────
export function useAddToCart() {
  const addToCart = usePOSStore((state) => state.addToCart);
  const cart = usePOSStore((state) => state.cart);

  return useCallback(
    (item: Omit<CartItem, "id" | "quantity" | "discount">) => {
      const existing = cart.find((c) => c.productId === item.productId);
      if (existing) {
        usePOSStore.getState().updateQuantity(existing.id, existing.quantity + 1);
      } else {
        addToCart(item);
      }
    },
    [addToCart, cart]
  );
}

export function useUpdateCartQuantity() {
  const updateQuantity = usePOSStore((state) => state.updateQuantity);
  const cart = usePOSStore((state) => state.cart);

  return useCallback(
    (productId: string, quantity: number) => {
      const item = cart.find((c) => c.productId === productId);
      if (item) {
        updateQuantity(item.id, quantity);
      }
    },
    [updateQuantity, cart]
  );
}