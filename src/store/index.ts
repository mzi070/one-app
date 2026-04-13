import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppModule = "dashboard" | "pos" | "hr" | "settings" | "profile";

// ─── Notification Store ───────────────────────────────────────────────────────
export type NotifPriority = "info" | "success" | "warning" | "error";
export type NotifCategory = "pos" | "hr" | "system";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotifCategory;
  priority: NotifPriority;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionModule?: AppModule;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: crypto.randomUUID(), timestamp: new Date().toISOString(), read: false },
            ...state.notifications,
          ],
        })),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      dismiss: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: "oneapp-notifications" }
  )
);

// ─── Toast Store (non-persisted, in-memory only) ──────────────────────────────
export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (t: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (t) =>
    set((state) => ({
      toasts: [...state.toasts, { ...t, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Helper: fire both a persisted notification AND a transient toast
export function notify(
  n: Omit<AppNotification, "id" | "timestamp" | "read">,
  toast?: { title?: string; message?: string; type?: ToastItem["type"] }
) {
  useNotificationStore.getState().addNotification(n);
  useToastStore.getState().addToast({
    title: toast?.title ?? n.title,
    message: toast?.message ?? n.message,
    type: toast?.type ?? (n.priority === "error" ? "error" : n.priority === "warning" ? "warning" : n.priority === "success" ? "success" : "info"),
    duration: toast?.type === "error" ? 6000 : 4000,
  });
}

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  userEmail: string;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userEmail: "",
      login: (email) => set({ isAuthenticated: true, userEmail: email }),
      logout: () => set({ isAuthenticated: false, userEmail: "" }),
    }),
    { name: "oneapp-auth" }
  )
);

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

// ─── POS Customer Store ───────────────────────────────────────────────────────
export interface POSCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  creditBalance: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
  joinedAt: string;
}

interface POSCustomerState {
  customers: POSCustomer[];
  addCustomer: (c: Omit<POSCustomer, "id" | "totalSpent" | "visitCount" | "lastVisit" | "joinedAt">) => POSCustomer;
  updateCustomer: (id: string, updates: Partial<POSCustomer>) => void;
  deleteCustomer: (id: string) => void;
  recordPurchase: (id: string, amount: number, timestamp: string) => void;
  adjustCredit: (id: string, delta: number) => void;
}

export const usePOSCustomerStore = create<POSCustomerState>()(
  persist(
    (set) => ({
      customers: [],
      addCustomer: (c) => {
        const newCustomer: POSCustomer = {
          ...c,
          id: `cust-${Date.now()}`,
          totalSpent: 0,
          visitCount: 0,
          lastVisit: null,
          joinedAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [newCustomer, ...state.customers] }));
        return newCustomer;
      },
      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),
      recordPurchase: (id, amount, timestamp) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, totalSpent: c.totalSpent + amount, visitCount: c.visitCount + 1, lastVisit: timestamp }
              : c
          ),
        })),
      adjustCredit: (id, delta) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, creditBalance: Math.max(0, c.creditBalance + delta) } : c
          ),
        })),
    }),
    { name: "oneapp-pos-customers" }
  )
);

// ─── POS Sales History Store ──────────────────────────────────────────────────
export interface SaleRecord {
  id: string;
  timestamp: string;
  items: Array<{ name: string; productId: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  itemCount: number;
  customerId?: string;
  customerName?: string;
}

interface POSSalesState {
  salesHistory: SaleRecord[];
  recordSale: (sale: SaleRecord) => void;
  clearHistory: () => void;
}

export const usePOSSalesStore = create<POSSalesState>()(
  persist(
    (set) => ({
      salesHistory: [],
      recordSale: (sale) =>
        set((state) => ({
          salesHistory: [sale, ...state.salesHistory].slice(0, 500),
        })),
      clearHistory: () => set({ salesHistory: [] }),
    }),
    { name: "oneapp-pos-sales" }
  )
);

// POS Cart Store
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  notes?: string;
}

// Held Order
export interface HeldOrder {
  id: string;
  timestamp: string;
  items: CartItem[];
  customerName: string;
  subtotal: number;
  total: number;
}

interface POSState {
  cart: CartItem[];
  searchQuery: string;
  selectedCategory: string;
  paymentMethod: string;
  customerName: string;
  heldOrders: HeldOrder[];
  addToCart: (item: Omit<CartItem, "id" | "quantity" | "discount">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateDiscount: (id: string, discount: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setPaymentMethod: (method: string) => void;
  setCustomerName: (name: string) => void;
  getSubtotal: () => number;
  getTotal: () => number;
  holdOrder: () => void;
  recallOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  searchQuery: "",
  selectedCategory: "all",
  paymentMethod: "cash",
  customerName: "",
  heldOrders: [],
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
          { ...item, id: crypto.randomUUID(), quantity: 1, discount: 0, notes: "" },
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
  updateNotes: (id, notes) =>
    set((state) => ({
      cart: state.cart.map((c) => (c.id === id ? { ...c, notes } : c)),
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
  holdOrder: () =>
    set((state) => {
      if (state.cart.length === 0) return state;
      const subtotal = get().getSubtotal();
      const total = get().getTotal();
      const newOrder: HeldOrder = {
        id: `hold-${Date.now()}`,
        timestamp: new Date().toISOString(),
        items: [...state.cart],
        customerName: state.customerName,
        subtotal,
        total,
      };
      return {
        cart: [],
        customerName: "",
        heldOrders: [newOrder, ...state.heldOrders].slice(0, 10),
      };
    }),
  recallOrder: (id) =>
    set((state) => {
      const order = state.heldOrders.find((o) => o.id === id);
      if (!order) return state;
      return {
        cart: order.items,
        customerName: order.customerName,
        heldOrders: state.heldOrders.filter((o) => o.id !== id),
      };
    }),
  deleteHeldOrder: (id) =>
    set((state) => ({
      heldOrders: state.heldOrders.filter((o) => o.id !== id),
    })),
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

// ─── Profile Store ────────────────────────────────────────────────────────────
export interface UserProfile {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  bio: string;
  avatarInitials: string;
  avatarColor: string;
  location: string;
  joinDate: string;
  // Security
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  // Activity log
  activityLog: ActivityEntry[];
}

export interface ActivityEntry {
  id: string;
  action: string;
  module: string;
  timestamp: string;
}

interface ProfileState extends UserProfile {
  updateProfile: (updates: Partial<UserProfile>) => void;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearActivity: () => void;
}

const defaultProfile: UserProfile = {
  fullName: "Mohamed Zihnee",
  displayName: "M. Zihnee",
  email: "mzi@oneapp.com",
  phone: "+960 000-0000",
  jobTitle: "System Administrator",
  department: "IT",
  bio: "Managing business operations with OneApp.",
  avatarInitials: "MZ",
  avatarColor: "from-blue-500 to-purple-600",
  location: "Malé, Maldives",
  joinDate: "2024-01-01",
  twoFactorEnabled: false,
  sessionTimeout: 30,
  activityLog: [
    { id: "1", action: "Logged in", module: "System", timestamp: new Date().toISOString() },
    { id: "2", action: "Processed sale #INV-001", module: "POS", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: "3", action: "Added employee record", module: "HR", timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: "4", action: "Updated settings", module: "Settings", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: "5", action: "Reviewed dashboard", module: "Dashboard", timestamp: new Date(Date.now() - 172800000).toISOString() },
  ],
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...defaultProfile,
      updateProfile: (updates) => set((state) => ({ ...state, ...updates })),
      addActivity: (entry) =>
        set((state) => ({
          activityLog: [
            { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
            ...state.activityLog.slice(0, 49),
          ],
        })),
      clearActivity: () => set((state) => ({ ...state, activityLog: [] })),
    }),
    { name: "oneapp-profile" }
  )
);
// ─── HR Store ─────────────────────────────────────────────────────────────────
export interface HREmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: "active" | "on-leave" | "terminated";
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: "present" | "absent" | "late" | "on-leave" | "half-day";
  notes: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "Annual" | "Sick" | "Personal" | "Unpaid" | "Maternity" | "Paternity";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
  reviewNote: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  taxRate: number;
  otherDeductions: number;
  netPay: number;
  status: "draft" | "processed" | "paid";
  processedAt: string | null;
}

export interface HRDepartment {
  id: string;
  name: string;
  headEmployeeId: string | null;
  budget: number;
  description: string;
}

interface HRState {
  employees: HREmployee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
  departments: HRDepartment[];

  // Employees
  addEmployee: (e: Omit<HREmployee, "id" | "employeeId">) => HREmployee;
  updateEmployee: (id: string, updates: Partial<HREmployee>) => void;
  deleteEmployee: (id: string) => void;

  // Attendance
  upsertAttendance: (record: Omit<AttendanceRecord, "id">) => void;
  deleteAttendance: (id: string) => void;

  // Leave
  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "appliedAt">) => void;
  updateLeaveStatus: (id: string, status: LeaveRequest["status"], note: string) => void;
  deleteLeaveRequest: (id: string) => void;

  // Payroll
  upsertPayrollRecord: (record: Omit<PayrollRecord, "id">) => void;
  processPayroll: (period: string) => void;
  markPayrollPaid: (period: string) => void;

  // Departments
  addDepartment: (d: Omit<HRDepartment, "id">) => void;
  updateDepartment: (id: string, updates: Partial<HRDepartment>) => void;
  deleteDepartment: (id: string) => void;
}

export const useHRStore = create<HRState>()(
  persist(
    (set, get) => ({
      employees: [],
      attendance: [],
      leaveRequests: [],
      payrollRecords: [],
      departments: [],

      addEmployee: (e) => {
        const existing = get().employees;
        const num = existing.length + 1;
        const newEmp: HREmployee = { ...e, id: `emp-${Date.now()}`, employeeId: `EMP-${1000 + num}` };
        set((s) => ({ employees: [newEmp, ...s.employees] }));
        return newEmp;
      },
      updateEmployee: (id, updates) =>
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteEmployee: (id) =>
        set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

      upsertAttendance: (record) =>
        set((s) => {
          const existing = s.attendance.find((a) => a.employeeId === record.employeeId && a.date === record.date);
          if (existing) {
            return { attendance: s.attendance.map((a) => a.id === existing.id ? { ...a, ...record } : a) };
          }
          return { attendance: [{ ...record, id: `att-${Date.now()}` }, ...s.attendance] };
        }),
      deleteAttendance: (id) =>
        set((s) => ({ attendance: s.attendance.filter((a) => a.id !== id) })),

      addLeaveRequest: (req) =>
        set((s) => ({ leaveRequests: [{ ...req, id: `lv-${Date.now()}`, appliedAt: new Date().toISOString() }, ...s.leaveRequests] })),
      updateLeaveStatus: (id, status, note) =>
        set((s) => ({ leaveRequests: s.leaveRequests.map((l) => l.id === id ? { ...l, status, reviewNote: note } : l) })),
      deleteLeaveRequest: (id) =>
        set((s) => ({ leaveRequests: s.leaveRequests.filter((l) => l.id !== id) })),

      upsertPayrollRecord: (record) =>
        set((s) => {
          const existing = s.payrollRecords.find((p) => p.employeeId === record.employeeId && p.period === record.period);
          if (existing) {
            return { payrollRecords: s.payrollRecords.map((p) => p.id === existing.id ? { ...existing, ...record } : p) };
          }
          return { payrollRecords: [{ ...record, id: `pr-${Date.now()}` }, ...s.payrollRecords] };
        }),
      processPayroll: (period) =>
        set((s) => ({
          payrollRecords: s.payrollRecords.map((p) =>
            p.period === period && p.status === "draft"
              ? { ...p, status: "processed", processedAt: new Date().toISOString() }
              : p
          ),
        })),
      markPayrollPaid: (period) =>
        set((s) => ({
          payrollRecords: s.payrollRecords.map((p) =>
            p.period === period && p.status === "processed" ? { ...p, status: "paid" } : p
          ),
        })),

      addDepartment: (d) =>
        set((s) => ({ departments: [...s.departments, { ...d, id: `dept-${Date.now()}` }] })),
      updateDepartment: (id, updates) =>
        set((s) => ({ departments: s.departments.map((d) => (d.id === id ? { ...d, ...updates } : d)) })),
      deleteDepartment: (id) =>
        set((s) => ({ departments: s.departments.filter((d) => d.id !== id) })),
    }),
    { name: "oneapp-hr" }
  )
);

// ─── Theme Store ──────────────────────────────────────────────────────────────
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setDark: (v) => set({ isDark: v }),
    }),
    { name: "oneapp-theme" }
  )
);