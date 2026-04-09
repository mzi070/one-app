"use client";

import { useState, useMemo } from "react";
import {
  useHRStore,
  notify,
  type HREmployee,
  type AttendanceRecord,
  type LeaveRequest,
  type PayrollRecord,
  type HRDepartment,
} from "@/store";
import {
  Users, UserPlus, Clock, Calendar, DollarSign, Building2,
  Search, X, ChevronRight, CheckCircle, XCircle, AlertCircle,
  Mail, Phone, MapPin, Edit3, Trash2, Download, Plus,
  TrendingUp, ArrowLeft, FileText, BarChart3, CheckSquare,
  Briefcase,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

type HRView = "overview" | "employees" | "attendance" | "leave" | "payroll" | "departments";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avatarInitials(e: HREmployee) {
  return `${e.firstName[0]}${e.lastName[0]}`.toUpperCase();
}

function calcHours(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return "—";
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function leaveDays(startDate: string, endDate: string): number {
  const s = new Date(startDate), e = new Date(endDate);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    "on-leave": "bg-yellow-100 text-yellow-700",
    terminated: "bg-red-100 text-red-700",
    present: "bg-green-100 text-green-700",
    absent: "bg-red-100 text-red-700",
    late: "bg-orange-100 text-orange-700",
    "half-day": "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
    processed: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
};

const deptColors: Record<string, string> = {
  Engineering: "bg-blue-100 text-blue-700",
  Sales: "bg-green-100 text-green-700",
  "Human Resources": "bg-purple-100 text-purple-700",
  Finance: "bg-yellow-100 text-yellow-700",
  Marketing: "bg-pink-100 text-pink-700",
  Operations: "bg-orange-100 text-orange-700",
  Design: "bg-indigo-100 text-indigo-700",
};

// ─── Root Module ──────────────────────────────────────────────────────────────
export default function HRModule() {
  const [view, setView] = useState<HRView>("overview");

  const navItems: { id: HRView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "leave", label: "Leave", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "departments", label: "Departments", icon: Building2 },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                view === item.id ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {view === "overview" && <HROverview onNavigate={setView} />}
        {view === "employees" && <EmployeesView />}
        {view === "attendance" && <AttendanceView />}
        {view === "leave" && <LeaveView />}
        {view === "payroll" && <PayrollView />}
        {view === "departments" && <DepartmentsView />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  OVERVIEW
// ════════════════════════════════════════════════════════════════
function HROverview({ onNavigate }: { onNavigate: (v: HRView) => void }) {
  const { employees, attendance, leaveRequests, updateLeaveStatus } = useHRStore();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAtt = attendance.filter((a) => a.date === todayStr);
  const present = todayAtt.filter((a) => a.status === "present" || a.status === "late" || a.status === "half-day").length;
  const pendingLeave = leaveRequests.filter((l) => l.status === "pending");
  const active = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on-leave").length;
  const totalPayroll = employees.reduce((s, e) => s + e.salary / 12, 0);

  const handleApprove = (id: string) => {
    const req = leaveRequests.find((l) => l.id === id);
    if (!req) return;
    const emp = employees.find((e) => e.id === req.employeeId);
    updateLeaveStatus(id, "approved", "Approved by HR.");
    notify({ title: "Leave Approved", message: `${emp?.firstName} ${emp?.lastName}'s ${req.type} leave approved.`, category: "hr", priority: "success", actionModule: "hr" });
  };
  const handleReject = (id: string) => {
    const req = leaveRequests.find((l) => l.id === id);
    if (!req) return;
    const emp = employees.find((e) => e.id === req.employeeId);
    updateLeaveStatus(id, "rejected", "");
    notify({ title: "Leave Rejected", message: `${emp?.firstName} ${emp?.lastName}'s ${req.type} leave rejected.`, category: "hr", priority: "error", actionModule: "hr" });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Employees", value: active, sub: `${onLeave} on leave`, icon: Users, color: "bg-purple-50 text-purple-600", nav: "employees" as HRView },
          { label: "Present Today", value: present, sub: `${employees.length > 0 ? Math.round((present / employees.length) * 100) : 0}% attendance`, icon: CheckCircle, color: "bg-green-50 text-green-600", nav: "attendance" as HRView },
          { label: "Pending Leave", value: pendingLeave.length, sub: "awaiting review", icon: Calendar, color: "bg-yellow-50 text-yellow-600", nav: "leave" as HRView },
          { label: "Monthly Payroll", value: formatCurrency(totalPayroll), sub: "current month", icon: DollarSign, color: "bg-blue-50 text-blue-600", nav: "payroll" as HRView },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <button key={k.label} onClick={() => onNavigate(k.nav)} className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", k.color)}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-sm text-gray-500">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-yellow-500" /> Pending Leave Requests</h3>
            <button onClick={() => onNavigate("leave")} className="text-xs text-purple-600 hover:text-purple-700">View all</button>
          </div>
          {pendingLeave.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pendingLeave.slice(0, 4).map((l) => {
                const emp = employees.find((e) => e.id === l.employeeId);
                return (
                  <div key={l.id} className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp?.firstName} {emp?.lastName}</p>
                      <p className="text-xs text-gray-500">{l.type} · {l.startDate} – {l.endDate} · {leaveDays(l.startDate, l.endDate)}d</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleApprove(l.id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle size={14} /></button>
                      <button onClick={() => handleReject(l.id)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Clock size={16} className="text-blue-500" /> Today's Attendance</h3>
            <button onClick={() => onNavigate("attendance")} className="text-xs text-purple-600 hover:text-purple-700">View all</button>
          </div>
          <div className="space-y-2">
            {todayAtt.slice(0, 5).map((a) => {
              const emp = employees.find((e) => e.id === a.employeeId);
              return (
                <div key={a.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                      {emp ? avatarInitials(emp) : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp?.firstName} {emp?.lastName}</p>
                      <p className="text-xs text-gray-400">{a.clockIn ?? "—"} → {a.clockOut ?? "..."}</p>
                    </div>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(a.status))}>{a.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={16} className="text-purple-500" /> Department Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(
            employees.reduce<Record<string, number>>((acc, e) => { acc[e.department] = (acc[e.department] ?? 0) + 1; return acc; }, {})
          ).map(([dept, count]) => (
            <div key={dept} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-2xl font-bold text-purple-600">{count}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{dept}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ════════════════════════════════════════════════════════════════
interface EmpFormData {
  firstName: string; lastName: string; email: string; phone: string;
  position: string; department: string; salary: string; hireDate: string;
  status: HREmployee["status"]; address: string; emergencyContact: string;
  emergencyPhone: string; notes: string;
}
const emptyEmpForm: EmpFormData = {
  firstName: "", lastName: "", email: "", phone: "", position: "", department: "Engineering",
  salary: "", hireDate: new Date().toISOString().split("T")[0], status: "active",
  address: "", emergencyContact: "", emergencyPhone: "", notes: "",
};

function EmployeeFormModal({ employee, departments, onClose, onSave }: {
  employee: HREmployee | null; departments: HRDepartment[];
  onClose: () => void; onSave: (data: EmpFormData) => void;
}) {
  const [form, setForm] = useState<EmpFormData>(
    employee
      ? { firstName: employee.firstName, lastName: employee.lastName, email: employee.email, phone: employee.phone, position: employee.position, department: employee.department, salary: String(employee.salary), hireDate: employee.hireDate, status: employee.status, address: employee.address, emergencyContact: employee.emergencyContact, emergencyPhone: employee.emergencyPhone, notes: employee.notes }
      : emptyEmpForm
  );
  const set = <K extends keyof EmpFormData>(k: K, v: EmpFormData[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{employee ? "Edit Employee" : "Add Employee"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { k: "firstName", label: "First Name *", type: "text", span: 1 },
            { k: "lastName", label: "Last Name *", type: "text", span: 1 },
            { k: "email", label: "Email *", type: "email", span: 2 },
            { k: "phone", label: "Phone", type: "tel", span: 1 },
            { k: "hireDate", label: "Hire Date *", type: "date", span: 1 },
            { k: "position", label: "Position *", type: "text", span: 1 },
            { k: "salary", label: "Annual Salary *", type: "number", span: 1 },
            { k: "address", label: "Address", type: "text", span: 2 },
            { k: "emergencyContact", label: "Emergency Contact", type: "text", span: 1 },
            { k: "emergencyPhone", label: "Emergency Phone", type: "tel", span: 1 },
            { k: "notes", label: "Notes", type: "text", span: 2 },
          ] as const).map(({ k, label, type, span }) => (
            <div key={k} className={span === 2 ? "col-span-2" : ""}>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
              <input type={type} required={label.includes("*")} value={form[k as keyof EmpFormData] as string} onChange={(e) => set(k as keyof EmpFormData, e.target.value as EmpFormData[typeof k])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Department *</label>
            <select value={form.department} onChange={(e) => set("department", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as HREmployee["status"])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">{employee ? "Save Changes" : "Add Employee"}</button>
        </div>
      </form>
    </div>
  );
}

function EmployeeDetailPanel({ employee, employees, attendance, leaveRequests, onClose, onEdit, onDelete }: {
  employee: HREmployee; employees: HREmployee[];
  attendance: AttendanceRecord[]; leaveRequests: LeaveRequest[];
  onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const empAtt = attendance.filter((a) => a.employeeId === employee.id).slice(0, 10);
  const empLeave = leaveRequests.filter((l) => l.employeeId === employee.id).slice(0, 5);
  const yearsOfService = ((new Date().getTime() - new Date(employee.hireDate).getTime()) / (365.25 * 86400000)).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={onClose}>
      <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">{avatarInitials(employee)}</div>
            <div>
              <h3 className="font-bold text-gray-900">{employee.firstName} {employee.lastName}</h3>
              <p className="text-sm text-gray-500">{employee.position}</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(employee.status))}>{employee.status}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit3 size={15} /></button>
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact */}
          <div className="p-4 border-b border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
            {employee.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400 shrink-0" />{employee.email}</div>}
            {employee.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={13} className="text-gray-400 shrink-0" />{employee.phone}</div>}
            {employee.address && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={13} className="text-gray-400 shrink-0" />{employee.address}</div>}
          </div>

          {/* Work Info */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Work Info</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-gray-400 text-xs">Employee ID</p><p className="font-medium">{employee.employeeId}</p></div>
              <div><p className="text-gray-400 text-xs">Department</p><p className="font-medium">{employee.department}</p></div>
              <div><p className="text-gray-400 text-xs">Annual Salary</p><p className="font-medium">{formatCurrency(employee.salary)}</p></div>
              <div><p className="text-gray-400 text-xs">Service</p><p className="font-medium">{yearsOfService} yrs</p></div>
              <div><p className="text-gray-400 text-xs">Hire Date</p><p className="font-medium">{employee.hireDate}</p></div>
            </div>
          </div>

          {/* Emergency */}
          {(employee.emergencyContact || employee.emergencyPhone) && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact</p>
              <p className="text-sm text-gray-700">{employee.emergencyContact}</p>
              <p className="text-sm text-gray-500">{employee.emergencyPhone}</p>
            </div>
          )}

          {/* Notes */}
          {employee.notes && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-2">{employee.notes}</p>
            </div>
          )}

          {/* Recent Attendance */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Attendance</p>
            {empAtt.length === 0 ? <p className="text-xs text-gray-400">No records</p> : (
              <div className="space-y-1.5">
                {empAtt.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{a.date}</span>
                    <span className="text-gray-600">{a.clockIn ?? "—"} → {a.clockOut ?? "..."}</span>
                    <span className={cn("px-2 py-0.5 rounded-full", statusBadge(a.status))}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave History */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Leave History</p>
            {empLeave.length === 0 ? <p className="text-xs text-gray-400">No leave records</p> : (
              <div className="space-y-1.5">
                {empLeave.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{l.type}</span>
                    <span className="text-gray-500">{l.startDate} – {l.endDate}</span>
                    <span className={cn("px-2 py-0.5 rounded-full", statusBadge(l.status))}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesView() {
  const { employees, departments, attendance, leaveRequests, addEmployee, updateEmployee, deleteEmployee } = useHRStore();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "salary-desc" | "salary-asc" | "hire">("name");
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<HREmployee | null>(null);
  const [detailEmp, setDetailEmp] = useState<HREmployee | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees
      .filter((e) => {
        const matchQ = `${e.firstName} ${e.lastName} ${e.employeeId} ${e.position} ${e.department}`.toLowerCase().includes(q);
        const matchDept = filterDept === "all" || e.department === filterDept;
        const matchStatus = filterStatus === "all" || e.status === filterStatus;
        return matchQ && matchDept && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "salary-desc") return b.salary - a.salary;
        if (sortBy === "salary-asc") return a.salary - b.salary;
        if (sortBy === "hire") return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
  }, [employees, search, filterDept, filterStatus, sortBy]);

  const kpis = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    onLeave: employees.filter((e) => e.status === "on-leave").length,
    terminated: employees.filter((e) => e.status === "terminated").length,
    totalPayroll: employees.reduce((s, e) => s + e.salary, 0),
  }), [employees]);

  const handleSave = (data: EmpFormData) => {
    const payload = { ...data, salary: parseFloat(data.salary) || 0 };
    if (editingEmp) {
      updateEmployee(editingEmp.id, payload);
      if (detailEmp?.id === editingEmp.id) setDetailEmp({ ...detailEmp, ...payload });
      notify({ title: "Employee Updated", message: `${data.firstName} ${data.lastName} updated.`, category: "hr", priority: "success", actionModule: "hr" });
    } else {
      const newEmp = addEmployee(payload);
      notify({ title: "Employee Added", message: `${data.firstName} ${data.lastName} added.`, category: "hr", priority: "success", actionModule: "hr" });
      setDetailEmp(newEmp);
    }
    setShowModal(false);
    setEditingEmp(null);
  };

  const handleDelete = (emp: HREmployee) => {
    if (!confirm(`Delete "${emp.firstName} ${emp.lastName}"? This cannot be undone.`)) return;
    deleteEmployee(emp.id);
    setDetailEmp(null);
    notify({ title: "Employee Removed", message: `${emp.firstName} ${emp.lastName} removed.`, category: "hr", priority: "info", actionModule: "hr" });
  };

  const exportCsv = () => {
    const rows = [["ID", "Name", "Department", "Position", "Salary", "Status", "Hire Date"],
      ...employees.map((e) => [e.employeeId, `${e.firstName} ${e.lastName}`, e.department, e.position, e.salary, e.status, e.hireDate])
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "employees.csv"; a.click();
  };

  const deptNames = [...new Set(employees.map((e) => e.department))].sort();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-500">{employees.length} employees · {formatCurrency(kpis.totalPayroll)} annual payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:border-gray-300">
            <Download size={14} /> Export
          </button>
          <button onClick={() => { setEditingEmp(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
            <UserPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: kpis.total, color: "text-gray-800" },
          { label: "Active", value: kpis.active, color: "text-green-600" },
          { label: "On Leave", value: kpis.onLeave, color: "text-yellow-600" },
          { label: "Terminated", value: kpis.terminated, color: "text-red-600" },
          { label: "Annual Payroll", value: formatCurrency(kpis.totalPayroll), color: "text-purple-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, ID, position..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Departments</option>
          {deptNames.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="on-leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
          <option value="name">Name A-Z</option>
          <option value="salary-desc">Salary ↓</option>
          <option value="salary-asc">Salary ↑</option>
          <option value="hire">Newest</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <Users size={40} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No employees found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Department</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Salary</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs hidden lg:table-cell">Hired</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setDetailEmp(emp)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">{avatarInitials(emp)}</div>
                        <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{emp.position}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", deptColors[emp.department] || "bg-gray-100 text-gray-600")}>{emp.department}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 hidden md:table-cell">{formatCurrency(emp.salary)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(emp.status))}>{emp.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 hidden lg:table-cell">{emp.hireDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingEmp(emp); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit3 size={13} /></button>
                        <button onClick={() => handleDelete(emp)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <EmployeeFormModal
          employee={editingEmp}
          departments={departments}
          onClose={() => { setShowModal(false); setEditingEmp(null); }}
          onSave={handleSave}
        />
      )}
      {detailEmp && (
        <EmployeeDetailPanel
          employee={detailEmp}
          employees={employees}
          attendance={attendance}
          leaveRequests={leaveRequests}
          onClose={() => setDetailEmp(null)}
          onEdit={() => { setEditingEmp(detailEmp); setShowModal(true); }}
          onDelete={() => handleDelete(detailEmp)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════════════════════════════
function AttendanceView() {
  const { employees, attendance, upsertAttendance } = useHRStore();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingRecord, setEditingRecord] = useState<{ empId: string; rec: AttendanceRecord | null } | null>(null);

  const dayRecords = useMemo(() => {
    return employees.map((emp) => {
      const rec = attendance.find((a) => a.employeeId === emp.id && a.date === selectedDate) ?? null;
      return { emp, rec };
    });
  }, [employees, attendance, selectedDate]);

  const summary = useMemo(() => ({
    present: dayRecords.filter((r) => r.rec?.status === "present").length,
    late: dayRecords.filter((r) => r.rec?.status === "late").length,
    absent: dayRecords.filter((r) => !r.rec || r.rec.status === "absent").length,
    onLeave: dayRecords.filter((r) => r.rec?.status === "on-leave").length,
  }), [dayRecords]);

  const exportCsv = () => {
    const rows = [["Employee", "ID", "Date", "Clock In", "Clock Out", "Hours", "Status"],
      ...dayRecords.map(({ emp, rec }) => [
        `${emp.firstName} ${emp.lastName}`, emp.employeeId, selectedDate,
        rec?.clockIn ?? "—", rec?.clockOut ?? "—",
        calcHours(rec?.clockIn ?? null, rec?.clockOut ?? null),
        rec?.status ?? "absent",
      ])
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `attendance-${selectedDate}.csv`; a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-500">Track and manage daily attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} max={today} onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:border-gray-300">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Present", value: summary.present, color: "text-green-600 bg-green-50" },
          { label: "Late", value: summary.late, color: "text-orange-600 bg-orange-50" },
          { label: "On Leave", value: summary.onLeave, color: "text-yellow-600 bg-yellow-50" },
          { label: "Absent", value: summary.absent, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={cn("text-2xl font-bold", s.color.split(" ")[0])}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Employee</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Clock In</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Clock Out</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Hours</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {dayRecords.map(({ emp, rec }) => {
                const status = rec?.status ?? "absent";
                const hours = calcHours(rec?.clockIn ?? null, rec?.clockOut ?? null);
                return (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">{avatarInitials(emp)}</div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{rec?.clockIn ?? "—"}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{rec?.clockOut ?? (rec?.clockIn ? "..." : "—")}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{rec?.clockIn && !rec?.clockOut ? "In progress" : hours}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(status))}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{rec?.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditingRecord({ empId: emp.id, rec })} className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600">
                        <Edit3 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <AttendanceEditModal
          empId={editingRecord.empId}
          date={selectedDate}
          record={editingRecord.rec}
          employees={employees}
          onClose={() => setEditingRecord(null)}
          onSave={(rec) => { upsertAttendance(rec); setEditingRecord(null); }}
        />
      )}
    </div>
  );
}

function AttendanceEditModal({ empId, date, record, employees, onClose, onSave }: {
  empId: string; date: string; record: AttendanceRecord | null; employees: HREmployee[];
  onClose: () => void; onSave: (record: Omit<AttendanceRecord, "id">) => void;
}) {
  const emp = employees.find((e) => e.id === empId);
  const [form, setForm] = useState({
    clockIn: record?.clockIn ?? "",
    clockOut: record?.clockOut ?? "",
    status: record?.status ?? "present" as AttendanceRecord["status"],
    notes: record?.notes ?? "",
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Edit Attendance</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{emp?.firstName} {emp?.lastName} · {date}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AttendanceRecord["status"] }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="on-leave">On Leave</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Clock In</label>
              <input type="time" value={form.clockIn} onChange={(e) => setForm((p) => ({ ...p, clockIn: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Clock Out</label>
              <input type="time" value={form.clockOut} onChange={(e) => setForm((p) => ({ ...p, clockOut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ employeeId: empId, date, clockIn: form.clockIn || null, clockOut: form.clockOut || null, status: form.status, notes: form.notes })}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  LEAVE
// ════════════════════════════════════════════════════════════════
function LeaveView() {
  const { employees, leaveRequests, addLeaveRequest, updateLeaveStatus, deleteLeaveRequest } = useHRStore();
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filterType, setFilterType] = useState("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LeaveRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const leaveTypes = ["Annual", "Sick", "Personal", "Unpaid", "Maternity", "Paternity"] as const;

  const filtered = useMemo(() => {
    return leaveRequests.filter((l) => {
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      const matchType = filterType === "all" || l.type === filterType;
      return matchStatus && matchType;
    }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [leaveRequests, filterStatus, filterType]);

  const summary = useMemo(() => ({
    pending: leaveRequests.filter((l) => l.status === "pending").length,
    approved: leaveRequests.filter((l) => l.status === "approved").length,
    rejected: leaveRequests.filter((l) => l.status === "rejected").length,
    total: leaveRequests.length,
  }), [leaveRequests]);

  const handleAction = (action: "approved" | "rejected") => {
    if (!reviewTarget) return;
    const emp = employees.find((e) => e.id === reviewTarget.employeeId);
    updateLeaveStatus(reviewTarget.id, action, reviewNote);
    notify({
      title: action === "approved" ? "Leave Approved" : "Leave Rejected",
      message: `${emp?.firstName} ${emp?.lastName}'s ${reviewTarget.type} leave ${action}.`,
      category: "hr", priority: action === "approved" ? "success" : "error", actionModule: "hr",
    });
    setReviewTarget(null);
    setReviewNote("");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-sm text-gray-500">{summary.pending} pending · {summary.approved} approved</p>
        </div>
        <button onClick={() => setShowApplyModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", value: summary.pending, color: "text-yellow-600" },
          { label: "Approved", value: summary.approved, color: "text-green-600" },
          { label: "Rejected", value: summary.rejected, color: "text-red-600" },
          { label: "Total", value: summary.total, color: "text-gray-800" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", filterStatus === s ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100")}>{s}</button>
          ))}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Types</option>
          {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Duration</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden lg:table-cell">Applied</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No leave requests found</td></tr>
            ) : filtered.map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId);
              const days = leaveDays(l.startDate, l.endDate);
              return (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {emp && <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">{avatarInitials(emp)}</div>}
                      <p className="font-medium text-gray-800">{emp?.firstName} {emp?.lastName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">{l.type}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs">
                    {l.startDate} – {l.endDate}<br />
                    <span className="text-gray-400">{days} day{days > 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs max-w-xs truncate">{l.reason}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">{new Date(l.appliedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(l.status))}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      {l.status === "pending" && (
                        <button onClick={() => setReviewTarget(l)} className="px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">Review</button>
                      )}
                      <button onClick={() => { if (confirm("Delete this leave request?")) deleteLeaveRequest(l.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          employees={employees}
          leaveTypes={leaveTypes}
          onClose={() => setShowApplyModal(false)}
          onSubmit={(req) => { addLeaveRequest(req); setShowApplyModal(false); notify({ title: "Leave Applied", message: "Leave request submitted for review.", category: "hr", priority: "info", actionModule: "hr" }); }}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Review Leave Request</h3>
            {(() => {
              const emp = employees.find((e) => e.id === reviewTarget.employeeId);
              return <p className="text-sm text-gray-500 mb-4">{emp?.firstName} {emp?.lastName} · {reviewTarget.type} · {reviewTarget.startDate} – {reviewTarget.endDate}</p>;
            })()}
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">{reviewTarget.reason}</p>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Review Note (optional)</label>
            <textarea rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => handleAction("rejected")} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100">Reject</button>
              <button onClick={() => handleAction("approved")} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplyLeaveModal({ employees, leaveTypes, onClose, onSubmit }: {
  employees: HREmployee[]; leaveTypes: readonly string[];
  onClose: () => void;
  onSubmit: (req: Omit<LeaveRequest, "id" | "appliedAt">) => void;
}) {
  const [form, setForm] = useState({ employeeId: employees[0]?.id ?? "", type: "Annual" as LeaveRequest["type"], startDate: "", endDate: "", reason: "" });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, status: "pending", reviewNote: "" }); }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-3" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Apply for Leave</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Employee *</label>
          <select required value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Leave Type *</label>
          <select required value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LeaveRequest["type"] }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
            {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ k: "startDate", label: "Start Date *" }, { k: "endDate", label: "End Date *" }].map(({ k, label }) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
              <input type="date" required value={form[k as "startDate" | "endDate"]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Reason *</label>
          <textarea required rows={2} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="State the reason..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">Submit</button>
        </div>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PAYROLL
// ════════════════════════════════════════════════════════════════
function PayrollView() {
  const { employees, payrollRecords, upsertPayrollRecord, processPayroll, markPayrollPaid } = useHRStore();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [period, setPeriod] = useState(currentPeriod);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);

  const periodRecords = useMemo(() => {
    return employees.map((emp) => {
      const rec = payrollRecords.find((p) => p.employeeId === emp.id && p.period === period);
      const base = emp.salary / 12;
      return rec ?? {
        id: `draft-${emp.id}`,
        employeeId: emp.id,
        period,
        baseSalary: base,
        overtime: 0,
        bonus: 0,
        taxRate: 15,
        otherDeductions: base * 0.02,
        netPay: base - base * 0.15 - base * 0.02,
        status: "draft" as const,
        processedAt: null,
      };
    });
  }, [employees, payrollRecords, period]);

  const totals = useMemo(() => ({
    gross: periodRecords.reduce((s, r) => s + r.baseSalary + r.overtime + r.bonus, 0),
    tax: periodRecords.reduce((s, r) => s + (r.baseSalary * r.taxRate) / 100, 0),
    net: periodRecords.reduce((s, r) => s + r.netPay, 0),
    count: periodRecords.length,
    allDraft: periodRecords.every((r) => r.status === "draft"),
    allProcessed: periodRecords.every((r) => r.status === "processed"),
    allPaid: periodRecords.every((r) => r.status === "paid"),
  }), [periodRecords]);

  const handleProcess = () => {
    // Upsert all draft records first
    periodRecords.filter((r) => r.id.startsWith("draft-")).forEach((r) => {
      upsertPayrollRecord({ employeeId: r.employeeId, period: r.period, baseSalary: r.baseSalary, overtime: r.overtime, bonus: r.bonus, taxRate: r.taxRate, otherDeductions: r.otherDeductions, netPay: r.netPay, status: "draft", processedAt: null });
    });
    processPayroll(period);
    notify({ title: "Payroll Processed", message: `${period} payroll for ${totals.count} employees (${formatCurrency(totals.net)} net) processed.`, category: "hr", priority: "success", actionModule: "hr" });
  };

  const handleMarkPaid = () => {
    markPayrollPaid(period);
    notify({ title: "Payroll Paid", message: `${period} payroll marked as paid.`, category: "hr", priority: "success", actionModule: "hr" });
  };

  const exportCsv = () => {
    const rows = [["Employee", "Base", "Overtime", "Bonus", "Tax", "Other Deductions", "Net Pay", "Status"],
      ...periodRecords.map((r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        return [`${emp?.firstName} ${emp?.lastName}`, r.baseSalary.toFixed(2), r.overtime.toFixed(2), r.bonus.toFixed(2), ((r.baseSalary * r.taxRate) / 100).toFixed(2), r.otherDeductions.toFixed(2), r.netPay.toFixed(2), r.status];
      })
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `payroll-${period}.csv`; a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payroll</h2>
          <p className="text-sm text-gray-500">Manage monthly payroll for all employees</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600"><Download size={14} /> Export</button>
          {!totals.allPaid && (
            totals.allProcessed
              ? <button onClick={handleMarkPaid} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Mark as Paid</button>
              : <button onClick={handleProcess} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><CheckSquare size={15} /> Process Payroll</button>
          )}
          {totals.allPaid && <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Paid</span>}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Gross Payroll", value: formatCurrency(totals.gross), icon: TrendingUp, color: "text-purple-600" },
          { label: "Total Tax", value: formatCurrency(totals.tax), icon: FileText, color: "text-red-500" },
          { label: "Net Payout", value: formatCurrency(totals.net), icon: DollarSign, color: "text-green-600" },
          { label: "Employees", value: String(totals.count), icon: Users, color: "text-blue-600" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={k.color} />
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
              <p className={cn("text-lg font-bold", k.color)}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Employee</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Base</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Overtime</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Bonus</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Tax</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Other Ded.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Net Pay</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {periodRecords.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                const tax = (rec.baseSalary * rec.taxRate) / 100;
                return (
                  <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {emp && <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">{avatarInitials(emp)}</div>}
                        <div>
                          <p className="font-medium text-gray-800">{emp?.firstName} {emp?.lastName}</p>
                          <p className="text-xs text-gray-400">{emp?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(rec.baseSalary)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{rec.overtime > 0 ? formatCurrency(rec.overtime) : "—"}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{rec.bonus > 0 ? formatCurrency(rec.bonus) : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-500">-{formatCurrency(tax)}</td>
                    <td className="px-4 py-3 text-right text-red-400">{rec.otherDeductions > 0 ? `-${formatCurrency(rec.otherDeductions)}` : "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(rec.netPay)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(rec.status))}>{rec.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rec.status === "draft" && (
                        <button onClick={() => setEditingRecord(rec)} className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600">
                          <Edit3 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payroll Record Modal */}
      {editingRecord && (
        <PayrollEditModal
          record={editingRecord}
          employees={employees}
          onClose={() => setEditingRecord(null)}
          onSave={(rec) => { upsertPayrollRecord(rec); setEditingRecord(null); }}
        />
      )}
    </div>
  );
}

function PayrollEditModal({ record, employees, onClose, onSave }: {
  record: PayrollRecord; employees: HREmployee[];
  onClose: () => void; onSave: (rec: Omit<PayrollRecord, "id">) => void;
}) {
  const emp = employees.find((e) => e.id === record.employeeId);
  const [form, setForm] = useState({
    overtime: String(record.overtime),
    bonus: String(record.bonus),
    taxRate: String(record.taxRate),
    otherDeductions: String(record.otherDeductions),
  });

  const base = record.baseSalary;
  const ot = parseFloat(form.overtime) || 0;
  const bon = parseFloat(form.bonus) || 0;
  const tax = base * ((parseFloat(form.taxRate) || 0) / 100);
  const other = parseFloat(form.otherDeductions) || 0;
  const net = base + ot + bon - tax - other;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Edit Payroll</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{emp?.firstName} {emp?.lastName} · Base: {formatCurrency(base)}</p>
        <div className="space-y-3">
          {[
            { k: "overtime", label: "Overtime ($)" },
            { k: "bonus", label: "Bonus ($)" },
            { k: "taxRate", label: "Tax Rate (%)" },
            { k: "otherDeductions", label: "Other Deductions ($)" },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
              <input type="number" min="0" step="0.01" value={form[k as keyof typeof form]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-purple-50 rounded-xl text-sm">
          <div className="flex justify-between text-gray-600"><span>Net Pay</span><span className="font-bold text-purple-700">{formatCurrency(net)}</span></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ ...record, overtime: ot, bonus: bon, taxRate: parseFloat(form.taxRate) || 0, otherDeductions: other, netPay: net })}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ════════════════════════════════════════════════════════════════
interface DeptFormData { name: string; headEmployeeId: string; budget: string; description: string; }

function DepartmentFormModal({ dept, employees, onClose, onSave }: {
  dept: HRDepartment | null; employees: HREmployee[];
  onClose: () => void; onSave: (data: DeptFormData) => void;
}) {
  const [form, setForm] = useState<DeptFormData>(
    dept ? { name: dept.name, headEmployeeId: dept.headEmployeeId ?? "", budget: String(dept.budget), description: dept.description } : { name: "", headEmployeeId: "", budget: "", description: "" }
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-3" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{dept ? "Edit Department" : "Add Department"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Department Name *</label>
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Department Head</label>
          <select value={form.headEmployeeId} onChange={(e) => setForm((p) => ({ ...p, headEmployeeId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
            <option value="">— No head assigned —</option>
            {employees.filter((e) => e.status === "active").map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Annual Budget ($)</label>
          <input type="number" min="0" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">{dept ? "Save" : "Add"}</button>
        </div>
      </form>
    </div>
  );
}

function DepartmentsView() {
  const { employees, departments, addDepartment, updateDepartment, deleteDepartment } = useHRStore();
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<HRDepartment | null>(null);

  const deptStats = useMemo(() => {
    return departments.map((d) => {
      const emps = employees.filter((e) => e.department === d.name);
      const head = employees.find((e) => e.id === d.headEmployeeId);
      const salaries = emps.reduce((s, e) => s + e.salary, 0);
      const budgetUsed = d.budget > 0 ? Math.min(100, Math.round((salaries / d.budget) * 100)) : 0;
      return { ...d, emps, head, salaries, budgetUsed };
    });
  }, [departments, employees]);

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);
  const totalSalaries = employees.reduce((s, e) => s + e.salary, 0);

  const handleSave = (data: DeptFormData) => {
    const payload = { name: data.name.trim(), headEmployeeId: data.headEmployeeId || null, budget: parseFloat(data.budget) || 0, description: data.description.trim() };
    if (editingDept) {
      updateDepartment(editingDept.id, payload);
      notify({ title: "Department Updated", message: `${data.name} updated.`, category: "hr", priority: "success", actionModule: "hr" });
    } else {
      addDepartment(payload);
      notify({ title: "Department Added", message: `${data.name} department created.`, category: "hr", priority: "success", actionModule: "hr" });
    }
    setShowModal(false);
    setEditingDept(null);
  };

  const handleDelete = (dept: HRDepartment) => {
    const count = employees.filter((e) => e.department === dept.name).length;
    if (count > 0) { alert(`Cannot delete: ${count} employee(s) are assigned to this department.`); return; }
    if (!confirm(`Delete "${dept.name}"?`)) return;
    deleteDepartment(dept.id);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-500">{departments.length} departments · {formatCurrency(totalBudget)} total budget</p>
        </div>
        <button onClick={() => { setEditingDept(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Departments", value: String(departments.length), color: "text-purple-600" },
          { label: "Total Budget", value: formatCurrency(totalBudget), color: "text-blue-600" },
          { label: "Total Salaries", value: formatCurrency(totalSalaries), color: totalSalaries > totalBudget ? "text-red-600" : "text-green-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptStats.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm", deptColors[dept.name] || "bg-gray-100 text-gray-600")}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{dept.name}</h4>
                  {dept.head && <p className="text-xs text-gray-500">Head: {dept.head.firstName} {dept.head.lastName}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingDept(dept); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit3 size={13} /></button>
                <button onClick={() => handleDelete(dept)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>

            {dept.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{dept.description}</p>}

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-600">{dept.emps.length}</p>
                <p className="text-xs text-gray-500">Employees</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-green-600">{formatCurrency(dept.budget)}</p>
                <p className="text-xs text-gray-500">Budget</p>
              </div>
            </div>

            {dept.budget > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Salary usage</span>
                  <span className={dept.budgetUsed > 90 ? "text-red-500 font-medium" : ""}>{dept.budgetUsed}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", dept.budgetUsed > 90 ? "bg-red-500" : dept.budgetUsed > 70 ? "bg-yellow-500" : "bg-green-500")}
                    style={{ width: `${Math.min(100, dept.budgetUsed)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Members mini-list */}
            {dept.emps.length > 0 && (
              <div className="mt-3 flex items-center gap-1">
                {dept.emps.slice(0, 5).map((e) => (
                  <div key={e.id} className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold" title={`${e.firstName} ${e.lastName}`}>
                    {avatarInitials(e)}
                  </div>
                ))}
                {dept.emps.length > 5 && <p className="text-xs text-gray-400 ml-1">+{dept.emps.length - 5}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <DepartmentFormModal
          dept={editingDept}
          employees={employees}
          onClose={() => { setShowModal(false); setEditingDept(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

const demoEmployees: Employee[] = [
  { id: "1", employeeId: "EMP-1001", firstName: "John", lastName: "Smith", email: "john.smith@company.com", phone: "+1-234-5678", position: "Sales Manager", department: "Sales", salary: 65000, hireDate: "2022-01-15", status: "active" },
  { id: "2", employeeId: "EMP-1002", firstName: "Jane", lastName: "Doe", email: "jane.doe@company.com", phone: "+1-345-6789", position: "HR Specialist", department: "Human Resources", salary: 55000, hireDate: "2022-03-20", status: "active" },
  { id: "3", employeeId: "EMP-1003", firstName: "Mike", lastName: "Johnson", email: "mike.j@company.com", phone: "+1-456-7890", position: "Software Developer", department: "Engineering", salary: 80000, hireDate: "2021-06-10", status: "active" },
  { id: "4", employeeId: "EMP-1004", firstName: "Sarah", lastName: "Wilson", email: "sarah.w@company.com", phone: "+1-567-8901", position: "Accountant", department: "Finance", salary: 60000, hireDate: "2023-01-05", status: "on-leave" },
  { id: "5", employeeId: "EMP-1005", firstName: "David", lastName: "Brown", email: "david.b@company.com", phone: "+1-678-9012", position: "Marketing Lead", department: "Marketing", salary: 70000, hireDate: "2022-09-12", status: "active" },
  { id: "6", employeeId: "EMP-1006", firstName: "Emily", lastName: "Davis", email: "emily.d@company.com", phone: "+1-789-0123", position: "Office Admin", department: "Operations", salary: 45000, hireDate: "2023-04-15", status: "active" },
  { id: "7", employeeId: "EMP-1007", firstName: "James", lastName: "Miller", email: "james.m@company.com", phone: "+1-890-1234", position: "QA Engineer", department: "Engineering", salary: 72000, hireDate: "2022-07-22", status: "active" },
  { id: "8", employeeId: "EMP-1008", firstName: "Lisa", lastName: "Anderson", email: "lisa.a@company.com", phone: "+1-901-2345", position: "Design Lead", department: "Design", salary: 68000, hireDate: "2021-11-30", status: "active" },
];

const departments = [
  { name: "Engineering", count: 8, head: "Mike Johnson", budget: 640000 },
  { name: "Sales", count: 5, head: "John Smith", budget: 325000 },
  { name: "Human Resources", count: 3, head: "Jane Doe", budget: 165000 },
  { name: "Finance", count: 4, head: "Sarah Wilson", budget: 240000 },
  { name: "Marketing", count: 4, head: "David Brown", budget: 280000 },
  { name: "Operations", count: 3, head: "Emily Davis", budget: 135000 },
  { name: "Design", count: 3, head: "Lisa Anderson", budget: 204000 },
];

const initialLeaveRequests = [
  { id: "1", employee: "Sarah Wilson", type: "Vacation", startDate: "2026-04-10", endDate: "2026-04-15", status: "approved", reason: "Family trip" },
  { id: "2", employee: "Mike Johnson", type: "Sick Leave", startDate: "2026-04-08", endDate: "2026-04-09", status: "pending", reason: "Medical appointment" },
  { id: "3", employee: "David Brown", type: "Personal", startDate: "2026-04-12", endDate: "2026-04-12", status: "pending", reason: "Personal matter" },
  { id: "4", employee: "John Smith", type: "Vacation", startDate: "2026-04-20", endDate: "2026-04-25", status: "approved", reason: "Annual leave" },
  { id: "5", employee: "Lisa Anderson", type: "Remote Work", startDate: "2026-04-14", endDate: "2026-04-18", status: "approved", reason: "Working from home" },
];

const attendanceData = [
  { employee: "John Smith", date: "2026-04-08", clockIn: "08:55", clockOut: "17:30", status: "present", hours: "8h 35m" },
  { employee: "Jane Doe", date: "2026-04-08", clockIn: "09:02", clockOut: "17:45", status: "present", hours: "8h 43m" },
  { employee: "Mike Johnson", date: "2026-04-08", clockIn: "08:30", clockOut: "18:00", status: "present", hours: "9h 30m" },
  { employee: "Sarah Wilson", date: "2026-04-08", clockIn: "-", clockOut: "-", status: "on-leave", hours: "-" },
  { employee: "David Brown", date: "2026-04-08", clockIn: "09:15", clockOut: "17:00", status: "late", hours: "7h 45m" },
  { employee: "Emily Davis", date: "2026-04-08", clockIn: "08:45", clockOut: "-", status: "present", hours: "In progress" },
  { employee: "James Miller", date: "2026-04-08", clockIn: "09:00", clockOut: "17:30", status: "present", hours: "8h 30m" },
  { employee: "Lisa Anderson", date: "2026-04-08", clockIn: "08:50", clockOut: "17:15", status: "present", hours: "8h 25m" },
];

export default function HRModule() {
  const [view, setView] = useState<HRView>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);

  const handleLeaveApprove = (id: string) => {
    const req = leaveRequests.find((l) => l.id === id);
    if (!req) return;
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? { ...l, status: "approved" } : l));
    notify({
      title: "Leave Approved",
      message: `${req.employee}'s ${req.type} (${req.startDate} – ${req.endDate}) has been approved.`,
      category: "hr",
      priority: "success",
      actionLabel: "View Leave",
      actionModule: "hr",
    });
  };

  const handleLeaveReject = (id: string) => {
    const req = leaveRequests.find((l) => l.id === id);
    if (!req) return;
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? { ...l, status: "rejected" } : l));
    notify({
      title: "Leave Rejected",
      message: `${req.employee}'s ${req.type} request has been declined.`,
      category: "hr",
      priority: "error",
      actionLabel: "View Leave",
      actionModule: "hr",
    });
  };

  const navItems: { id: HRView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "leave", label: "Leave", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "departments", label: "Departments", icon: Building2 },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Sub Navigation */}
      <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                view === item.id
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {view === "overview" && <HROverview onNavigate={setView} leaveRequests={leaveRequests} onApprove={handleLeaveApprove} onReject={handleLeaveReject} />}
        {view === "employees" && (
          <EmployeesList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAdd={() => setShowAddEmployee(true)}
            onSelect={setSelectedEmployee}
          />
        )}
        {view === "attendance" && <AttendanceView />}
        {view === "leave" && <LeaveManagement leaveRequests={leaveRequests} onApprove={handleLeaveApprove} onReject={handleLeaveReject} />}
        {view === "payroll" && <PayrollView />}
        {view === "departments" && <DepartmentsView />}
      </div>

      {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} />}
      {selectedEmployee && <EmployeeDetail employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
    </div>
  );
}