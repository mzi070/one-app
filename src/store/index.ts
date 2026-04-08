import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppModule = "dashboard" | "pos" | "hr" | "accounting" | "pdf" | "settings";

interface AppState {
  currentModule: AppModule;
  sidebarOpen: boolean;
  setModule: (module: AppModule) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: "dashboard",
  sidebarOpen: true,
  setModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// POS Store
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
}

interface POSState {
  cart: CartItem[];
  searchQuery: string;
  selectedCategory: string;
  paymentMethod: string;
  customerName: string;
  addToCart: (item: Omit<CartItem, "id" | "quantity" | "discount">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateDiscount: (id: string, discount: number) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setPaymentMethod: (method: string) => void;
  setCustomerName: (name: string) => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  searchQuery: "",
  selectedCategory: "all",
  paymentMethod: "cash",
  customerName: "",
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.productId === item.productId);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.productId === item.productId
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          { ...item, id: crypto.randomUUID(), quantity: 1, discount: 0 },
        ],
      };
    }),
  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      cart: state.cart.map((c) => (c.id === id ? { ...c, quantity } : c)),
    })),
  updateDiscount: (id, discount) =>
    set((state) => ({
      cart: state.cart.map((c) => (c.id === id ? { ...c, discount } : c)),
    })),
  clearCart: () => set({ cart: [], customerName: "" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomerName: (name) => set({ customerName: name }),
  getSubtotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getTotal: () =>
    get().cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity - item.discount * item.quantity,
      0
    ),
}));

// ─── Settings Store ───────────────────────────────────────────────────────────
export interface AppSettings {
  // General
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  language: string;
  // POS
  taxRate: number;
  defaultPaymentMethod: string;
  lowStockThreshold: number;
  receiptHeader: string;
  receiptFooter: string;
  // HR
  workHoursPerDay: number;
  workDaysPerWeek: number;
  overtimeMultiplier: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  // Notifications
  salesNotifications: boolean;
  lowStockAlerts: boolean;
  hrReminders: boolean;
  accountingAlerts: boolean;
  // Appearance
  accentColor: string;
  compactMode: boolean;
  sidebarDefaultOpen: boolean;
}

interface SettingsState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const defaultSettings: AppSettings = {
  businessName: "OneApp Business",
  businessEmail: "info@oneapp.com",
  businessPhone: "+1 (555) 000-0000",
  businessAddress: "123 Main Street, City, Country",
  currency: "USD",
  currencySymbol: "$",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  language: "English",
  taxRate: 10,
  defaultPaymentMethod: "cash",
  lowStockThreshold: 10,
  receiptHeader: "Thank you for shopping with us!",
  receiptFooter: "Please come again. Returns accepted within 30 days.",
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  overtimeMultiplier: 1.5,
  annualLeaveDays: 20,
  sickLeaveDays: 10,
  salesNotifications: true,
  lowStockAlerts: true,
  hrReminders: true,
  accountingAlerts: true,
  accentColor: "blue",
  compactMode: false,
  sidebarDefaultOpen: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultSettings),
    }),
    { name: "oneapp-settings" }
  )
);
