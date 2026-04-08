import { create } from "zustand";

export type AppModule = "dashboard" | "pos" | "hr" | "accounting" | "pdf";

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
