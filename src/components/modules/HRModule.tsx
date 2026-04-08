"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  Search,
  X,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type HRView = "overview" | "employees" | "attendance" | "leave" | "payroll" | "departments";

interface Employee {
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

const leaveRequests = [
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
        {view === "overview" && <HROverview onNavigate={setView} />}
        {view === "employees" && (
          <EmployeesList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAdd={() => setShowAddEmployee(true)}
            onSelect={setSelectedEmployee}
          />
        )}
        {view === "attendance" && <AttendanceView />}
        {view === "leave" && <LeaveManagement />}
        {view === "payroll" && <PayrollView />}
        {view === "departments" && <DepartmentsView />}
      </div>

      {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} />}
      {selectedEmployee && <EmployeeDetail employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
    </div>
  );
}

function HROverview({ onNavigate }: { onNavigate: (view: HRView) => void }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: "24", change: "+2 this month", color: "bg-purple-50 text-purple-600", icon: Users },
          { label: "Present Today", value: "20", change: "83% attendance", color: "bg-green-50 text-green-600", icon: CheckCircle },
          { label: "On Leave", value: "3", change: "2 pending", color: "bg-yellow-50 text-yellow-600", icon: Calendar },
          { label: "Open Positions", value: "5", change: "3 departments", color: "bg-blue-50 text-blue-600", icon: UserPlus },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar size={18} /> Pending Leave Requests
          </h3>
          <div className="space-y-2">
            {leaveRequests.filter(l => l.status === "pending").map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{l.employee}</p>
                  <p className="text-xs text-gray-500">{l.type} - {l.startDate} to {l.endDate}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle size={16} /></button>
                  <button className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={18} /> Today&apos;s Attendance
          </h3>
          <div className="space-y-2">
            {attendanceData.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{a.employee}</p>
                  <p className="text-xs text-gray-500">{a.clockIn} - {a.clockOut || "..."}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.status === "present" ? "bg-green-100 text-green-700" :
                  a.status === "late" ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Department Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {departments.map((dept) => (
            <div key={dept.name} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{dept.count}</p>
              <p className="text-xs text-gray-600 mt-1">{dept.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeesList({ searchQuery, setSearchQuery, onAdd, onSelect }: {
  searchQuery: string; setSearchQuery: (q: string) => void;
  onAdd: () => void; onSelect: (e: Employee) => void;
}) {
  const filtered = demoEmployees.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
        <button onClick={onAdd} className="ml-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
          <UserPlus size={16} /> Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Salary</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(emp)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-xs">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{emp.employeeId}</td>
                <td className="px-4 py-3">{emp.position}</td>
                <td className="px-4 py-3 text-gray-500">{emp.department}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(emp.salary)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    emp.status === "active" ? "bg-green-100 text-green-700" :
                    emp.status === "on-leave" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <ChevronRight size={16} className="text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceView() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Attendance - {formatDate(new Date())}</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">Present: 6</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Late: 1</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">On Leave: 1</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Clock In</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Clock Out</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Hours</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((a, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.employee}</td>
                <td className="px-4 py-3 text-center">{a.clockIn}</td>
                <td className="px-4 py-3 text-center">{a.clockOut || "—"}</td>
                <td className="px-4 py-3 text-center text-gray-500">{a.hours}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    a.status === "present" ? "bg-green-100 text-green-700" :
                    a.status === "late" ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaveManagement() {
  return (
    <div className="max-w-6xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Leave Requests</h3>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{l.employee}</td>
                <td className="px-4 py-3">{l.type}</td>
                <td className="px-4 py-3 text-gray-500">{l.startDate} to {l.endDate}</td>
                <td className="px-4 py-3 text-gray-500">{l.reason}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    l.status === "approved" ? "bg-green-100 text-green-700" :
                    l.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {l.status === "pending" && (
                    <div className="flex justify-center gap-1">
                      <button className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle size={16} /></button>
                      <button className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollView() {
  const payrollData = demoEmployees.filter(e => e.status !== "terminated").map(e => ({
    ...e,
    monthlySalary: e.salary / 12,
    overtime: Math.random() * 500,
    deductions: e.salary / 12 * 0.15,
    bonus: Math.random() > 0.7 ? Math.random() * 1000 : 0,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Payroll - April 2026</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
          Process Payroll
        </button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Base Salary</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Overtime</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Deductions</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Bonus</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Net Pay</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((p) => {
              const net = p.monthlySalary + p.overtime - p.deductions + p.bonus;
              return (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.monthlySalary)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(p.overtime)}</td>
                  <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.deductions)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(p.bonus)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(net)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentsView() {
  return (
    <div className="max-w-6xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Departments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.name} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                <p className="text-xs text-gray-500">Head: {dept.head}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-purple-600">{dept.count}</p>
                <p className="text-xs text-gray-500">Employees</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">{formatCurrency(dept.budget)}</p>
                <p className="text-xs text-gray-500">Budget</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", position: "", department: "Engineering", salary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: parseFloat(form.salary) }),
      });
    } catch { /* demo mode */ }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Employee</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["firstName", "lastName", "email", "phone", "position", "salary"] as const).map((field) => (
            <div key={field} className={field === "email" ? "col-span-2" : ""}>
              <label className="text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
              <input
                type={field === "email" ? "email" : field === "salary" ? "number" : "text"}
                required
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Department</label>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
            {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
          Add Employee
        </button>
      </form>
    </div>
  );
}

function EmployeeDetail({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Employee Details</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2 text-purple-600 font-bold text-xl">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <h4 className="text-lg font-bold">{employee.firstName} {employee.lastName}</h4>
          <p className="text-sm text-gray-500">{employee.position}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
            employee.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {employee.status}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm"><Mail size={16} className="text-gray-400" /> {employee.email}</div>
          <div className="flex items-center gap-2 text-sm"><Phone size={16} className="text-gray-400" /> {employee.phone}</div>
          <div className="flex items-center gap-2 text-sm"><Building2 size={16} className="text-gray-400" /> {employee.department}</div>
          <div className="flex items-center gap-2 text-sm"><DollarSign size={16} className="text-gray-400" /> {formatCurrency(employee.salary)} /year</div>
          <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-gray-400" /> Hired: {formatDate(employee.hireDate)}</div>
        </div>
      </div>
    </div>
  );
}
