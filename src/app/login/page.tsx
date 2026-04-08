"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShoppingCart,
  Users,
  Calculator,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store";

const DEMO_EMAIL = "admin@oneapp.com";
const DEMO_PASSWORD = "admin123";

const FEATURES = [
  { icon: ShoppingCart, label: "Point of Sale", desc: "Fast checkout & smart inventory tracking", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Users, label: "HR Management", desc: "Staff, payroll, attendance & leave", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Calculator, label: "Accounting", desc: "Invoices, expenses & financial reports", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: FileText, label: "PDF Tools", desc: "Merge, split, compress & convert", color: "text-cyan-400", bg: "bg-cyan-500/10" },
];

const FLOAT_CARDS = [
  { icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Today's Sales", value: "$4,280", pos: "top-[9%] left-[4%]", delay: "0s" },
  { icon: Users, color: "text-violet-400", bg: "bg-violet-500/15", label: "Active Staff", value: "24 Employees", pos: "top-[28%] right-[2%]", delay: "1s" },
  { icon: Calculator, color: "text-orange-400", bg: "bg-orange-500/15", label: "Monthly Revenue", value: "$38,450", pos: "bottom-[22%] right-[4%]", delay: "2s" },
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) router.replace("/");
  }, [mounted, isAuthenticated, router]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return triggerError("Email address is required.");
    if (!email.includes("@")) return triggerError("Please enter a valid email address.");
    if (!password) return triggerError("Password is required.");

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    if (
      (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (email.includes("@") && password.length >= 4)
    ) {
      login(email.trim().toLowerCase());
      router.replace("/");
    } else {
      setLoading(false);
      triggerError("Invalid credentials. Use the demo account below to sign in.");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex select-none" style={{ animation: "fadeIn 0.4s ease" }}>
      {/* ══════════════════════════════════════
          LEFT PANEL — Branded Dark Side
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col bg-[#08071a]">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0d0b2b 0%, #12103a 25%, #1a1250 50%, #0f0e30 75%, #08071a 100%)",
            backgroundSize: "400% 400%",
            animation: "gradientShift 15s ease infinite",
          }}
        />

        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Blurred colour orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-12%",
            left: "-8%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
            filter: "blur(55px)",
            animation: "floatSlow 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-18%",
            right: "-6%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "floatMedium 12s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "42%",
            right: "12%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "floatSlow 16s ease-in-out infinite 3s",
          }}
        />

        {/* Decorative spinning rings */}
        {[
          { size: 140, pos: "top-[12%] right-[7%]", dur: "22s" },
          { size: 180, pos: "top-[9%] right-[4%]", dur: "30s", rev: true },
          { size: 100, pos: "bottom-[18%] left-[6%]", dur: "18s" },
        ].map((r, i) => (
          <div
            key={i}
            className={`absolute rounded-full border border-white/[0.06] pointer-events-none ${r.pos}`}
            style={{
              width: r.size,
              height: r.size,
              animation: `spinSlow ${r.dur} linear infinite${r.rev ? " reverse" : ""}`,
            }}
          />
        ))}

        {/* Floating stat cards */}
        {FLOAT_CARDS.map(({ icon: Icon, color, bg, label, value, pos, delay }) => (
          <div
            key={label}
            className={`absolute ${pos} backdrop-blur-md border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-none`}
            style={{
              background: "rgba(255,255,255,0.04)",
              animation: `floatBob 6s ease-in-out infinite`,
              animationDelay: delay,
            }}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-white/50 text-[11px] leading-none mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}

        {/* Inner content */}
        <div className="relative z-10 flex flex-col flex-1 px-12 py-10">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
              }}
            >
              <span className="text-white font-bold text-base">1A</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">OneApp</span>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center max-w-[420px]">
            <div
              className="inline-flex items-center gap-2 border border-indigo-500/25 rounded-full px-3 py-1.5 w-fit mb-6"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-medium tracking-wide">
                All-in-One Business Platform
              </span>
            </div>

            <h1 className="text-[2.75rem] xl:text-5xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
              Run your entire
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #818cf8 0%, #a78bfa 40%, #67e8f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                business in one place
              </span>
            </h1>

            <p className="text-gray-400/80 text-[15px] leading-relaxed mb-10">
              POS, HR, Accounting, and PDF tools — all seamlessly
              <br />
              integrated into one powerful platform.
            </p>

            {/* Feature tiles */}
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, label, desc, color, bg }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-4 group"
                  style={{ animation: `fadeInUp 0.5s ease both`, animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${bg} border border-white/[0.06] flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={15} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-sm font-semibold leading-none mb-0.5">{label}</p>
                    <p className="text-gray-500 text-xs truncate">{desc}</p>
                  </div>
                  <CheckCircle2 size={15} className="text-indigo-400/50 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Social proof footer */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { init: "MZ", g: "from-indigo-500 to-purple-600" },
                { init: "AR", g: "from-fuchsia-500 to-pink-600" },
                { init: "SK", g: "from-cyan-500 to-blue-600" },
                { init: "+", g: "from-gray-600 to-gray-700" },
              ].map(({ init, g }) => (
                <div
                  key={init}
                  className={`w-7 h-7 rounded-full border-2 border-[#08071a] bg-gradient-to-br ${g} flex items-center justify-center text-[9px] font-bold text-white`}
                >
                  {init}
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">Trusted by 500+ businesses worldwide</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL — Login Form
      ══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 relative overflow-hidden">
        {/* Ambient corner glows */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, rgba(224,231,255,0.6) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none"
          style={{
            background: "radial-gradient(circle at bottom left, rgba(237,233,254,0.5) 0%, transparent 65%)",
          }}
        />

        <div
          className="w-full max-w-[400px] relative z-10"
          style={{ animation: "fadeInUp 0.55s ease both" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              <span className="text-white text-sm font-bold">1A</span>
            </div>
            <span className="text-gray-900 text-xl font-bold">OneApp</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-[1.65rem] font-bold text-gray-900 mb-1.5 tracking-tight">
              Welcome back 👋
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Demo credentials banner */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mb-6 flex items-center gap-3 rounded-xl px-4 py-3 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 group hover:shadow-sm"
            style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)" }}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <Sparkles size={15} className="text-indigo-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-indigo-800 text-xs font-semibold leading-none mb-0.5">
                Demo Account
              </p>
              <p className="text-indigo-400 text-[11px] font-mono">
                admin@oneapp.com · admin123
              </p>
            </div>
            <span className="text-[11px] text-indigo-500 font-medium group-hover:text-indigo-700 transition-colors">
              Click to fill
            </span>
            <ArrowRight
              size={14}
              className="text-indigo-400 group-hover:translate-x-0.5 transition-transform"
            />
          </button>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.05s" }}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="admin@oneapp.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none bg-white text-gray-900 placeholder-gray-400"
                style={{
                  borderColor:
                    error && !email
                      ? "#f87171"
                      : focused === "email"
                      ? "#818cf8"
                      : "#e5e7eb",
                  boxShadow:
                    focused === "email"
                      ? "0 0 0 4px rgba(129,140,248,0.12)"
                      : "none",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl border transition-all duration-200 outline-none bg-white text-gray-900 placeholder-gray-400"
                  style={{
                    borderColor:
                      error && !password
                        ? "#f87171"
                        : focused === "password"
                        ? "#818cf8"
                        : "#e5e7eb",
                    boxShadow:
                      focused === "password"
                        ? "0 0 0 4px rgba(129,140,248,0.12)"
                        : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div
              className="flex items-center gap-2.5"
              style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.15s" }}
            >
              <button
                type="button"
                onClick={() => setRemember((v) => !v)}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  borderColor: remember ? "#6366f1" : "#d1d5db",
                  background: remember ? "#6366f1" : "white",
                }}
              >
                {remember && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-600">Keep me signed in</span>
            </div>

            {/* Error */}
            {error && (
              <div
                className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border border-red-200 bg-red-50 ${shakeError ? "animate-shake" : ""}`}
                style={{ animation: shakeError ? undefined : "fadeInUp 0.3s ease" }}
              >
                <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-1"
              style={{
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.15)",
                transform: loading ? "none" : undefined,
                animation: "fadeInUp 0.5s ease both",
                animationDelay: "0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">secured by OneApp</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6">
            {["🔒 SSL Encrypted", "🛡️ GDPR Compliant", "⚡ Fast & Reliable"].map((b) => (
              <span key={b} className="text-[11px] text-gray-400">
                {b}
              </span>
            ))}
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-[11px] text-gray-400">
            By signing in you agree to our{" "}
            <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
