import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Building2,
  Layers
} from 'lucide-react';
import { iamApi, UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('password');
  const [phone, setPhone] = useState('09199999999');
  const [otpCode, setOtpCode] = useState('999999');
  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'OTP'
  const [authSessionId, setAuthSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickSelect = (userType) => {
    setError(null);
    if (userType === 'superadmin') {
      setIdentifier('superadmin');
      setPassword('password');
      setPhone('09199999999');
    } else if (userType === 'sms_admin') {
      setIdentifier('09121110000');
      setPassword('password');
      setPhone('09121110000');
    } else if (userType === 'asan_admin') {
      setIdentifier('09122220000');
      setPassword('password');
      setPhone('09122220000');
    }
  };

  const handleInstantLogin = async (targetIdentifier, targetPhone) => {
    setLoading(true);
    setError(null);
    try {
      const loginRes = await iamApi.login(targetIdentifier, 'password');
      const sessionId = loginRes.authSessionId;
      await iamApi.sendOtp(sessionId, targetPhone);
      const { user } = await iamApi.verify2fa(sessionId, '999999');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'خطا در ورود سریع به درگاه admin.asan.com');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginRes = await iamApi.login(identifier, password);
      const sessionId = loginRes.authSessionId;
      setAuthSessionId(sessionId);

      const phoneToSend = phone || (identifier.startsWith('09') ? identifier : '09121110000');
      await iamApi.sendOtp(sessionId, phoneToSend);

      setStep('OTP');
    } catch (err) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور احراز هویت');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user } = await iamApi.verify2fa(authSessionId, otpCode);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'کد تایید دو مرحله‌ای نامعتبر است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-stretch font-sans" dir="rtl">
      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Right Column: Unified Host Architecture & Role Capabilities */}
        <div className="lg:col-span-7 p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-800/80 bg-[#0d131f]">
          <div>
            {/* Unified Host Header */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">پلتفرم مدیریت هویت و دسترسی آسان</div>
                <div className="text-xs font-mono text-sky-400">https://{UNIFIED_ADMIN_HOST}</div>
              </div>
            </div>

            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mb-4">
              درگاه واحد راهبری مستأجرین، کاربران و ماتریس استحقاق پرمیژن‌ها
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl mb-10">
              کلیه مدیران مستأجرین (Tenant Admins) و راهبران کل (Super Admins) از طریق آدرس یکپارچه{' '}
              <code className="text-sky-300 font-mono">{UNIFIED_ADMIN_HOST}</code> وارد شده و بر اساس سطح دسترسی توکن JWT، مجوزهای کاربران و استحقاق ماژول‌های هر مستأجر را مدیریت می‌کنند.
            </p>

            {/* Architecture Capabilities List */}
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>راهبر کل پلتفرم (Super Admin)</span>
                  </span>
                  <span className="text-xs font-mono text-sky-400">Global Scope · Tenant #1</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اعطا یا سلب پرمیژن‌ها و گروه‌های دسترسی از هر مستأجر، تعریف و کلون مستأجر جدید، تغییر ماژول‌های فعال و مدیریت فراگیر کاربران در تمامی مستأجرین.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>مدیر ارشد مستأجر (Tenant Admin)</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400">Scoped · Tenant #10 / #20</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  مدیریت کاربران زیرمجموعه، تخصیص نقش‌ها و پرمیژن‌های مستقیم به هر کاربر (محدود به سقف استحقاق مستأجر)، اتصال یک‌کلیکی گروه‌های دسترسی به نقش‌ها و جعل هویت مجاز RFC 8693.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <span>میزبان واحد: {UNIFIED_ADMIN_HOST}</span>
            <span>·</span>
            <span>احراز هویت دو مرحله‌ای (OTP + HttpOnly BFF Relay)</span>
            <span>·</span>
            <span className="font-mono tabular-nums">RFC 8693 Compliant</span>
          </div>
        </div>

        {/* Left Column: Authentication Form */}
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-[#0b0f17]">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6">
              <div className="text-xs font-mono text-sky-400 mb-1">
                AUTH GATEWAY · {UNIFIED_ADMIN_HOST}
              </div>
              <h2 className="text-xl font-bold text-white">ورود به کنسول مدیریت</h2>
              <p className="text-xs text-slate-400 mt-1">
                مشخصات کاربری ادمین مستأجر یا سوپرادمین را وارد نمایید
              </p>
            </div>

            {error && (
              <div
                id="login-error-alert"
                className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 'CREDENTIALS' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    نام کاربری یا شماره موبایل ادمین
                  </label>
                  <div className="relative">
                    <input
                      id="input-login-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="superadmin یا 09121110000"
                      className="w-full bg-[#111827] border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-sm font-mono focus:outline-none focus:border-sky-500"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      id="input-login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111827] border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-sm font-mono focus:outline-none focus:border-sky-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال بررسی اعتبار...</span>
                    </>
                  ) : (
                    <>
                      <span>ادامه و دریافت کد تایید دو مرحله‌ای (OTP)</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Role Switcher Presets for Unified Host */}
                <div className="pt-5 mt-5 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>انتخاب حساب آزمایشی در {UNIFIED_ADMIN_HOST}:</span>
                    <span className="font-mono text-[11px] text-slate-500">OTP: 999999</span>
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        identifier === 'superadmin'
                          ? 'bg-sky-950/40 border-sky-500/60'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        id="btn-quick-superadmin"
                        onClick={() => handleQuickSelect('superadmin')}
                        className="text-right flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-100">
                          راهبر کل پلتفرم (Super Admin)
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          @superadmin · مدیریت پرمیژن‌های همه مستأجرین
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('superadmin', '09199999999')}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        ورود مستقیم
                      </button>
                    </div>

                    <div
                      className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        identifier === '09121110000'
                          ? 'bg-sky-950/40 border-sky-500/60'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        id="btn-quick-smsadmin"
                        onClick={() => handleQuickSelect('sms_admin')}
                        className="text-right flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-100">
                          ادمین مستأجر پیامک (Tenant 10 — smslocal)
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          09121110000 · مدیریت کاربران و نقش‌های مستأجر ۱۰
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('09121110000', '09121110000')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        ورود مستقیم
                      </button>
                    </div>

                    <div
                      className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        identifier === '09122220000'
                          ? 'bg-sky-950/40 border-sky-500/60'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        id="btn-quick-asanadmin"
                        onClick={() => handleQuickSelect('asan_admin')}
                        className="text-right flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-100">
                          ادمین مستأجر آسان‌لوکال (Tenant 20 — asanlocal)
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          09122220000 · مدیریت کاربران و نقش‌های مستأجر ۲۰
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('09122220000', '09122220000')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        ورود مستقیم
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="p-3.5 bg-sky-950/40 border border-sky-800/60 rounded-xl text-sky-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    کد تایید دو مرحله‌ای برای نشست <code className="font-mono">{identifier}</code> ارسال شد.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    کد تایید ۶ رقمی (2FA OTP)
                  </label>
                  <div className="relative">
                    <input
                      id="input-login-otp"
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="999999"
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-sky-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1.5 block font-mono">
                    Default Test OTP: 999999
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('CREDENTIALS')}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-otp"
                    disabled={loading}
                    className="w-2/3 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>صدور توکن JWT...</span>
                      </>
                    ) : (
                      <span>تایید و ورود به {UNIFIED_ADMIN_HOST}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
