import React, { useState } from 'react';
import {
  Lock,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Globe,
  Building2,
  Zap,
  Palette
} from 'lucide-react';
import { iamApi, UNIFIED_ADMIN_HOST } from '../api/iamService';
import { useTenantTheme } from '../context/TenantThemeContext';

const QUICK_ADMIN_PRESETS = [
  {
    id: 'superadmin',
    label: 'سوپرادمین کل پلتفرم (Super Admin)',
    username: 'superadmin',
    phone: '09120000000',
    tenantLabel: 'دسترسی سراسری (Tenant 1 + سوییچ بین تمامی مستأجرین)',
    desc: 'مدیریت مستأجرین، کلونینگ، تعیین استحقاق پرمیژن‌های هر مستأجر و مدیریت کل کاربران'
  },
  {
    id: 'sms_admin',
    label: 'ادمین مستأجر پیامک (Tenant Admin — smslocal)',
    username: 'sms_admin',
    phone: '09121110000',
    tenantLabel: 'سامانه پیامک سازمانی (Tenant #10 — smslocal)',
    desc: 'مدیریت کاربران، نقش‌های سفارشی و پرمیژن‌های مستقیم در چارچوب استحقاق مستأجر ۱۰'
  },
  {
    id: 'asan_admin',
    label: 'ادمین مستأجر آسان‌لوکال (Tenant Admin — asanlocal)',
    username: 'asan_admin',
    phone: '09122220000',
    tenantLabel: 'ارتباطات ابری آسان‌لوکال (Tenant #20 — asanlocal)',
    desc: 'مدیریت کاربران و نقش‌های اختصاصی مستأجر ۲۰ با گارد مرزبندی امنیتی'
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('09120000000');
  const [password, setPassword] = useState('admin123');
  const [authSessionId, setAuthSessionId] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState(['09120000000']);
  const [selectedPhone, setSelectedPhone] = useState('09120000000');
  const [otpCode, setOtpCode] = useState('999999');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { paletteId, palettes, setPaletteId } = useTenantTheme();

  const handleQuickLogin = async (preset) => {
    setError('');
    setLoading(true);
    setIdentifier(preset.phone);
    try {
      const loginRes = await iamApi.login(preset.phone, 'admin123');
      const sessionId = loginRes.authSessionId;
      const phone = loginRes.phoneNumbers?.[0] || preset.phone;
      await iamApi.sendOtp(sessionId, phone);
      const { user } = await iamApi.verify2fa(sessionId, '999999');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'خطا در ورود سریع');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await iamApi.login(identifier, password);
      setAuthSessionId(res.authSessionId);
      const phones =
        res.phoneNumbers && res.phoneNumbers.length > 0 ? res.phoneNumbers : [identifier];
      setPhoneNumbers(phones);
      setSelectedPhone(phones[0]);
      setStep(2);
    } catch (err) {
      setError(err.message || 'نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await iamApi.sendOtp(authSessionId, selectedPhone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'خطا در ارسال پیامک تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!otpSent) {
        await iamApi.sendOtp(authSessionId, selectedPhone);
      }
      const { user } = await iamApi.verify2fa(authSessionId, otpCode);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'کد ۶ رقمی وارد شده معتبر نیست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-theme-canvas text-slate-900 flex flex-col justify-center items-center p-4 md:p-8"
      dir="rtl"
    >
      {/* Top Palette Switcher Bar */}
      <div className="max-w-5xl w-full mb-4 bg-theme-card border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Palette className="w-4 h-4 text-indigo-600" />
          <span>انتخاب پالت رنگ کنسول مدیریت:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {palettes.map((p) => {
            const active = p.id === paletteId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaletteId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/60"
                  style={{ backgroundColor: p.primaryHex }}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-theme-card border border-slate-300 rounded-2xl overflow-hidden shadow-xl">
        {/* Right Column: Unified Host Architecture & Quick Role Login */}
        <div className="lg:col-span-7 p-8 bg-theme-sidebar text-stone-100 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-theme-sidebar pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-amber-400/30 flex items-center justify-center text-white shadow-sm">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-stone-100 tracking-tight">
                    درگاه یکپارچه مدیریت آسان
                  </h1>
                  <p className="text-xs font-mono text-amber-400">
                    Host: https://{UNIFIED_ADMIN_HOST}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-stone-400">SSO + 2FA BFF</span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              تمامی مدیران ارشد (<strong className="text-amber-300 font-mono">SUPER_ADMIN</strong>) و مدیران مستأجرین (<strong className="text-amber-300 font-mono">TENANT_ADMIN</strong>) از طریق آدرس واحد{' '}
              <code className="font-mono text-amber-300">{UNIFIED_ADMIN_HOST}</code> وارد می‌شوند. برای تست فوری هر نقش، روی یکی از حساب‌های زیر کلیک کنید:
            </p>

            {/* Instant 1-Click Role Switcher Cards */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ورود سریع یک‌کلیکی (One-Click Demo Presets):</span>
              </div>

              <div className="space-y-2.5">
                {QUICK_ADMIN_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl bg-theme-sidebar-card border border-theme-sidebar hover:border-amber-400/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-100">{preset.label}</span>
                        <span className="text-stone-600">·</span>
                        <span className="font-mono text-[11px] text-amber-400">
                          @{preset.username}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{preset.tenantLabel}</span>
                      </div>
                      <p className="text-[11px] text-stone-400">{preset.desc}</p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(preset)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                    >
                      ورود آنی با این نقش
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-theme-sidebar flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 font-mono">
            <span>POST /api/auth/login → /api/auth/send-otp → /api/auth/verify-2fa</span>
            <span className="text-amber-300">OTP: 999999</span>
          </div>
        </div>

        {/* Left Column: 2-Step Authentication Form */}
        <div className="lg:col-span-5 p-8 flex flex-col justify-center bg-theme-card">
          <div className="mb-6">
            <div className="text-xs font-mono text-indigo-600 font-bold mb-1">
              {step === 1 ? 'STEP 01 / CREDENTIALS' : 'STEP 02 / SMS 2FA VERIFICATION'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {step === 1 ? 'ورود با نام کاربری یا موبایل' : 'تایید دو مرحله‌ای (OTP)'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {step === 1
                ? `احراز هویت متمرکز در درگاه ${UNIFIED_ADMIN_HOST}`
                : 'کد تایید ۶ رقمی ارسال شده به شماره همراه را وارد نمایید'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  شماره موبایل یا نام کاربری
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    id="input-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    placeholder="09120000000 یا superadmin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    id="input-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-login-step1"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <span>{loading ? 'در حال بررسی...' : 'ادامه به مرحله تایید پیامکی'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500">شناسه نشست موقت (PreAuthSession):</div>
                <div className="font-mono text-indigo-600 font-bold truncate">{authSessionId}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  شماره موبایل مقصد OTP
                </label>
                <div className="flex gap-2">
                  <select
                    id="select-phone"
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  >
                    {phoneNumbers.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    id="btn-send-otp"
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {otpSent ? 'ارسال مجدد' : 'ارسال کد پیامکی'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  کد تایید ۶ رقمی (کد آزمایشی: 999999)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    id="input-otp"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-center tracking-widest text-base font-bold text-indigo-600 font-mono focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpSent(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  بازگشت
                </button>
                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'در حال صدور توکن...' : 'تایید و ورود به کنسول'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
