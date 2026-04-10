"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Mail,
  ArrowLeft,
  Shield,
  RefreshCw,
  Check,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/store";

// ── Types ─────────────────────────────────────────────────────────────────────
type AuthStep = "login" | "forgot" | "forgot-sent" | "otp" | "success";

const DEMO_EMAIL = "admin@oneapp.com";
const DEMO_PASSWORD = "admin123";
const DEMO_OTP = "123456";

const FEATURES = [
  { icon: ShoppingCart, label: "Point of Sale",   desc: "Fast checkout & smart inventory tracking", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Users,        label: "HR Management",   desc: "Staff, payroll, attendance & leave",       color: "text-violet-400",  bg: "bg-violet-500/10"  },
  { icon: Calculator,   label: "Accounting",       desc: "Invoices, expenses & financial reports",   color: "text-orange-400",  bg: "bg-orange-500/10"  },
  { icon: FileText,     label: "PDF Tools",        desc: "Merge, split, compress & convert",         color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
];

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pwd: string): number {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6)          s++;
  if (pwd.length >= 10)         s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s; // 0-5
}
const STRENGTH_LABELS = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-emerald-500"];
const STRENGTH_TEXT   = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-green-500", "text-emerald-500"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();

  const [step, setStep]       = useState<AuthStep>("login");
  const [mounted, setMounted] = useState(false);

  // Login form
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [error,      setError]      = useState("");
  const [shakeError, setShakeError] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);
  const [progress,   setProgress]   = useState(0);

  // OTP / 2FA
  const [otp,         setOtp]        = useState(["", "", "", "", "", ""]);
  const [otpError,    setOtpError]   = useState("");
  const [otpLoading,  setOtpLoading] = useState(false);
  const [otpResent,   setOtpResent]  = useState(false);
  const [resendTimer, setResendTimer]= useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot password
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotError,   setForgotError]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated) router.replace("/");
  }, [mounted, isAuthenticated, router]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Hide progress bar after fill
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setProgress(0), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const animateProgress = useCallback((from: number, to: number, ms: number) => {
    const steps    = 20;
    const inc      = (to - from) / steps;
    const interval = ms / steps;
    let cur        = from;
    const t = setInterval(() => {
      cur += inc;
      setProgress(cur >= to ? to : cur);
      if (cur >= to) clearInterval(t);
    }, interval);
  }, []);

  // ── Login submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim())           return triggerError("Email address is required.");
    if (!email.includes("@"))    return triggerError("Please enter a valid email address.");
    if (!password)               return triggerError("Password is required.");
    if (password.length < 4)    return triggerError("Password must be at least 4 characters.");

    setLoading(true);
    animateProgress(0, 65, 800);
    await new Promise((r) => setTimeout(r, 950));

    // Accept demo creds or any valid-looking email with 4+ char password
    const validCreds =
      (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (email.includes("@") && password.length >= 4);

    if (validCreds) {
      animateProgress(65, 85, 300);
      setLoading(false);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setResendTimer(30);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } else {
      setProgress(0);
      setLoading(false);
      triggerError("Invalid credentials. Use the demo account below to sign in.");
    }
  };

  // ── OTP verify ───────────────────────────────────────────────────────────────
  const verifyOtp = async (code: string) => {
    setOtpLoading(true);
    setOtpError("");
    animateProgress(85, 95, 500);
    await new Promise((r) => setTimeout(r, 800));
    if (code === DEMO_OTP) {
      animateProgress(95, 100, 200);
      setOtpLoading(false);
      setStep("success");
      setTimeout(() => { login(email.trim().toLowerCase()); router.replace("/"); }, 1800);
    } else {
      setProgress(0);
      setOtpLoading(false);
      setOtpError("Incorrect code. For the demo, enter: 123456");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  };

  const handleOtpSubmit = () => verifyOtp(otp.join(""));

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next  = [...otp];
    next[i]     = digit;
    setOtp(next);
    setOtpError("");
    if (digit && i < 5) setTimeout(() => otpRefs.current[i + 1]?.focus(), 30);
    if (next.every((d) => d) && next.join("").length === 6) {
      setTimeout(() => verifyOtp(next.join("")), 100);
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const next  = [...otp];
      next[i - 1] = "";
      setOtp(next);
      otpRefs.current[i - 1]?.focus();
    } else if (e.key === "Enter") {
      handleOtpSubmit();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = ["", "", "", "", "", ""];
    digits.split("").forEach((d, idx) => { if (idx < 6) next[idx] = d; });
    setOtp(next);
    const focus = Math.min(digits.length, 5);
    setTimeout(() => otpRefs.current[focus]?.focus(), 30);
    if (digits.length === 6) setTimeout(() => verifyOtp(digits), 100);
  };

  const resendOtp = async () => {
    setOtpResent(true);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setResendTimer(30);
    await new Promise((r) => setTimeout(r, 600));
    setOtpResent(false);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // ── Forgot password submit ───────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim())        { setForgotError("Please enter your email address."); return; }
    if (!forgotEmail.includes("@")) { setForgotError("Please enter a valid email address."); return; }
    setForgotLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setForgotLoading(false);
    setStep("forgot-sent");
  };

  const fillDemo = () => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(""); };

  const strength  = getStrength(password);
  const emailValid = email.includes("@") && email.includes(".");

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex select-none" style={{ animation: "fadeIn 0.4s ease" }}>

      {/* ── Top progress bar ───────────────────────────────────────────────── */}
      {progress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.75 bg-indigo-100">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Success overlay ────────────────────────────────────────────────── */}
      {step === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white" style={{ animation: "fadeIn 0.3s ease" }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
              style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              <Check size={36} className="text-green-600" strokeWidth={3} />
            </div>
            <div style={{ animation: "fadeInUp 0.4s ease 0.15s both" }}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Login successful!</h2>
              <p className="text-gray-400 text-sm">Taking you to your dashboard…</p>
            </div>
            <Loader2 size={18} className="animate-spin text-indigo-400 mt-2" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — Branded dark side
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col bg-[#08071a]">
        {/* Animated gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #0d0b2b 0%, #12103a 25%, #1a1250 50%, #0f0e30 75%, #08071a 100%)",
            backgroundSize: "400% 400%",
            animation: "gradientShift 15s ease infinite",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Blurred orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-12%", left: "-8%",  width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",  filter: "blur(55px)", animation: "floatSlow 9s ease-in-out infinite" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-18%", right: "-6%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)", filter: "blur(60px)", animation: "floatMedium 12s ease-in-out infinite reverse" }} />
        <div className="absolute pointer-events-none" style={{ top: "42%", right: "12%",  width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",  filter: "blur(40px)", animation: "floatSlow 16s ease-in-out infinite 3s" }} />

        {/* Spinning rings */}
        {[
          { size: 140, pos: "top-[12%] right-[7%]",    dur: "22s" },
          { size: 180, pos: "top-[9%] right-[4%]",     dur: "30s", rev: true },
          { size: 100, pos: "bottom-[18%] left-[6%]",  dur: "18s" },
        ].map((r, i) => (
          <div
            key={i}
            className={`absolute rounded-full border border-white/6 pointer-events-none ${r.pos}`}
            style={{ width: r.size, height: r.size, animation: `spinSlow ${r.dur} linear infinite${r.rev ? " reverse" : ""}` }}
          />
        ))}

        {/* Floating module badges */}
        {[
          { icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Point of Sale",  pos: "top-[9%] left-[4%]",      delay: "0s" },
          { icon: Users,        color: "text-violet-400",  bg: "bg-violet-500/15",  label: "HR Management",  pos: "top-[30%] right-[2%]",     delay: "1s" },
          { icon: Calculator,   color: "text-orange-400",  bg: "bg-orange-500/15",  label: "Accounting",     pos: "bottom-[22%] right-[4%]",  delay: "2s" },
        ].map(({ icon: Icon, color, bg, label, pos, delay }) => (
          <div
            key={label}
            className={`absolute ${pos} backdrop-blur-md border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-none`}
            style={{ background: "rgba(255,255,255,0.04)", animation: "floatBob 6s ease-in-out infinite", animationDelay: delay }}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-sm font-bold ${color}`}>{label}</p>
          </div>
        ))}

        {/* Inner content */}
        <div className="relative z-10 flex flex-col flex-1 px-12 py-10">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}
            >
              <span className="text-white font-bold text-base">1A</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">OneApp</span>
          </div>

          {/* Headline area */}
          <div className="flex-1 flex flex-col justify-center max-w-105">
            <div
              className="inline-flex items-center gap-2 border border-indigo-500/25 rounded-full px-3 py-1.5 w-fit mb-6"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-medium tracking-wide">All-in-One Business Platform</span>
            </div>
            <h1 className="text-[2.75rem] xl:text-5xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
              Run your entire<br />
              <span style={{ background: "linear-gradient(90deg, #818cf8 0%, #a78bfa 40%, #67e8f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                business in one place
              </span>
            </h1>
            <p className="text-gray-400/80 text-[15px] leading-relaxed mb-10">
              POS, HR, Accounting, and PDF tools — all seamlessly<br />integrated into one powerful platform.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, label, desc, color, bg }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-4"
                  style={{ animation: "fadeInUp 0.5s ease both", animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} border border-white/6 flex items-center justify-center shrink-0`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-sm font-semibold leading-none mb-0.5">{label}</p>
                    <p className="text-gray-500 text-xs truncate">{desc}</p>
                  </div>
                  <CheckCircle2 size={15} className="text-indigo-400/50 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Social proof footer */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { init: "MZ", g: "from-indigo-500 to-purple-600" },
                { init: "AR", g: "from-fuchsia-500 to-pink-600"  },
                { init: "SK", g: "from-cyan-500 to-blue-600"     },
                { init: "+",  g: "from-gray-600 to-gray-700"     },
              ].map(({ init, g }) => (
                <div key={init} className={`w-7 h-7 rounded-full border-2 border-[#08071a] bg-linear-to-br ${g} flex items-center justify-center text-[9px] font-bold text-white`}>
                  {init}
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">Trusted by businesses worldwide</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — Auth forms
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(224,231,255,0.6) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none" style={{ background: "radial-gradient(circle at bottom left, rgba(237,233,254,0.5) 0%, transparent 65%)" }} />

        <div className="w-full max-w-100 relative z-10" style={{ animation: "fadeInUp 0.55s ease both" }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <span className="text-white text-sm font-bold">1A</span>
            </div>
            <span className="text-gray-900 text-xl font-bold">OneApp</span>
          </div>

          {/* ══ STEP: login ════════════════════════════════════════════════════ */}
          {step === "login" && (
            <>
              <div className="mb-7">
                <h2 className="text-[1.65rem] font-bold text-gray-900 mb-1.5 tracking-tight">Welcome back 👋</h2>
                <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
              </div>

              {/* Demo banner */}
              <button
                type="button"
                onClick={fillDemo}
                className="w-full mb-6 flex items-center gap-3 rounded-xl px-4 py-3 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 group hover:shadow-sm"
                style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)" }}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center shrink-0 transition-colors">
                  <Sparkles size={15} className="text-indigo-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-indigo-800 text-xs font-semibold leading-none mb-0.5">Demo Account</p>
                  <p className="text-indigo-400 text-[11px] font-mono">admin@oneapp.com · admin123</p>
                </div>
                <span className="text-[11px] text-indigo-500 font-medium group-hover:text-indigo-700 transition-colors">Click to fill</span>
                <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email */}
                <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.05s" }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="admin@oneapp.com"
                      autoComplete="email"
                      className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border transition-all duration-200 outline-none bg-white text-gray-900 placeholder-gray-400"
                      style={{
                        borderColor: error && !email ? "#f87171" : focused === "email" ? "#818cf8" : "#e5e7eb",
                        boxShadow:   focused === "email" ? "0 0 0 4px rgba(129,140,248,0.12)" : "none",
                      }}
                    />
                    {emailValid && (
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"
                        style={{ animation: "scaleIn 0.2s ease" }}
                      >
                        <Check size={11} className="text-green-600" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.1s" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setStep("forgot"); setError(""); }}
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
                        borderColor: error && !password ? "#f87171" : focused === "password" ? "#818cf8" : "#e5e7eb",
                        boxShadow:   focused === "password" ? "0 0 0 4px rgba(129,140,248,0.12)" : "none",
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

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2" style={{ animation: "fadeIn 0.2s ease" }}>
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${lvl <= strength ? STRENGTH_COLORS[strength] : "bg-gray-100"}`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium ${STRENGTH_TEXT[strength]}`}>{STRENGTH_LABELS[strength]}</p>
                    </div>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5" style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "0.15s" }}>
                  <button
                    type="button"
                    onClick={() => setRemember((v) => !v)}
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
                    style={{ borderColor: remember ? "#6366f1" : "#d1d5db", background: remember ? "#6366f1" : "white" }}
                  >
                    {remember && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">Keep me signed in</span>
                </div>

                {/* Error banner */}
                {error && (
                  <div
                    className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border border-red-200 bg-red-50 ${shakeError ? "animate-shake" : ""}`}
                    style={{ animation: shakeError ? undefined : "fadeInUp 0.3s ease" }}
                  >
                    <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-6 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-1"
                  style={{
                    background:  loading ? "#9ca3af" : "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
                    boxShadow:   loading ? "none"     : "0 4px 20px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.15)",
                    animation:   "fadeInUp 0.5s ease both",
                    animationDelay: "0.2s",
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Verifying credentials…</>
                    : <><Lock size={15} /> Sign In <ArrowRight size={15} /></>
                  }
                </button>
              </form>

              {/* Footer strip */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">secured by OneApp</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex items-center justify-center gap-6">
                {["🔒 SSL Encrypted", "🛡️ GDPR Compliant", "⚡ 2FA Protected"].map((b) => (
                  <span key={b} className="text-[11px] text-gray-400">{b}</span>
                ))}
              </div>
              <p className="mt-6 text-center text-[11px] text-gray-400">
                By signing in you agree to our{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>
              </p>
            </>
          )}

          {/* ══ STEP: forgot ═══════════════════════════════════════════════════ */}
          {step === "forgot" && (
            <div style={{ animation: "fadeInUp 0.4s ease both" }}>
              <button
                onClick={() => { setStep("login"); setForgotError(""); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors"
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                <Mail size={22} className="text-indigo-600" />
              </div>
              <h2 className="text-[1.5rem] font-bold text-gray-900 mb-2 tracking-tight">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-8">Enter your email and we'll send you a link to reset your password.</p>

              <form onSubmit={handleForgot} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                    onFocus={() => setFocused("forgot")}
                    onBlur={() => setFocused(null)}
                    placeholder="your@email.com"
                    autoFocus
                    className="w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none bg-white text-gray-900 placeholder-gray-400"
                    style={{
                      borderColor: forgotError ? "#f87171" : focused === "forgot" ? "#818cf8" : "#e5e7eb",
                      boxShadow:   focused === "forgot" ? "0 0 0 4px rgba(129,140,248,0.12)" : "none",
                    }}
                  />
                  {forgotError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} /> {forgotError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold rounded-xl transition-all"
                  style={{
                    background: forgotLoading ? "#9ca3af" : "linear-gradient(135deg, #1e1b4b, #4338ca)",
                    boxShadow:  forgotLoading ? "none"     : "0 4px 20px rgba(99,102,241,0.35)",
                  }}
                >
                  {forgotLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : <><Mail size={15} /> Send Reset Link</>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ══ STEP: forgot-sent ══════════════════════════════════════════════ */}
          {step === "forgot-sent" && (
            <div className="text-center" style={{ animation: "fadeInUp 0.4s ease both" }}>
              <div
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
                style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
              >
                <Mail size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-1">We sent a password reset link to</p>
              <p className="font-semibold text-indigo-700 text-sm mb-8">{forgotEmail}</p>
              <p className="text-xs text-gray-400 mb-8">Didn't receive it? Check your spam folder or try a different address.</p>
              <button
                onClick={() => { setStep("login"); setForgotEmail(""); setForgotError(""); }}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors mx-auto"
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            </div>
          )}

          {/* ══ STEP: otp ══════════════════════════════════════════════════════ */}
          {step === "otp" && (
            <div style={{ animation: "fadeInUp 0.4s ease both" }}>
              <button
                onClick={() => { setStep("login"); setOtp(["", "", "", "", "", ""]); setOtpError(""); setProgress(0); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                <Shield size={22} className="text-indigo-600" />
              </div>
              <h2 className="text-[1.5rem] font-bold text-gray-900 mb-2 tracking-tight">Two-factor verification</h2>
              <p className="text-gray-500 text-sm mb-1">Enter the 6-digit code sent to</p>
              <p className="font-semibold text-gray-800 text-sm mb-8 truncate">{email}</p>

              {/* 6-box OTP input */}
              <div className="flex gap-2.5 justify-center mb-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={() => setFocused(`otp-${i}`)}
                    onBlur={() => setFocused(null)}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150 outline-none bg-white text-gray-900"
                    style={{
                      borderColor: otpError ? "#f87171" : focused === `otp-${i}` || digit ? "#6366f1" : "#e5e7eb",
                      background:  digit ? "#eef2ff" : "white",
                      boxShadow:   focused === `otp-${i}` ? "0 0 0 4px rgba(99,102,241,0.12)" : "none",
                    }}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <p className="text-center text-xs text-gray-400 mb-6">
                Demo code: <span className="font-mono font-semibold text-indigo-600">123456</span>
              </p>

              {otpError && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3 border border-red-200 bg-red-50 mb-4" style={{ animation: "fadeInUp 0.3s ease" }}>
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{otpError}</p>
                </div>
              )}

              <button
                onClick={handleOtpSubmit}
                disabled={otpLoading || otp.join("").length < 6}
                className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold rounded-xl transition-all mb-4"
                style={{
                  background: otpLoading || otp.join("").length < 6 ? "#9ca3af" : "linear-gradient(135deg, #1e1b4b, #4338ca)",
                  boxShadow:  otpLoading || otp.join("").length < 6 ? "none"     : "0 4px 20px rgba(99,102,241,0.35)",
                }}
              >
                {otpLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                  : <><Shield size={15} /> Verify &amp; Sign In</>
                }
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={resendOtp}
                    disabled={otpResent}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors mx-auto disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={otpResent ? "animate-spin" : ""} />
                    {otpResent ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Global keyframe styles */}
      <style>{`
        @keyframes fadeIn    { from { opacity:0 }                        to { opacity:1 } }
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn   { from { opacity:0; transform:scale(0.6) } to { opacity:1; transform:scale(1) } }
        @keyframes gradientShift { 0%,100%{ background-position:0% 50% }  50%{ background-position:100% 50% } }
        @keyframes floatSlow   { 0%,100%{ transform:translateY(0) }  50%{ transform:translateY(-20px) } }
        @keyframes floatMedium { 0%,100%{ transform:translateY(0) }  50%{ transform:translateY(-14px) } }
        @keyframes floatBob    { 0%,100%{ transform:translateY(0) }  50%{ transform:translateY(-8px) } }
        @keyframes spinSlow  { from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
        @keyframes shake     { 0%,100%{ transform:translateX(0) } 20%,60%{ transform:translateX(-6px) } 40%,80%{ transform:translateX(6px) } }
        .animate-shake { animation: shake 0.45s ease !important }
      `}</style>
    </div>
  );
}
