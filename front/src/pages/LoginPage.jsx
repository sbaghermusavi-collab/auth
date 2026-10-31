import React, { useState } from 'react';
import { Shield, KeyRound, Lock, User, Phone, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { iamApi } from '../api/iamService';
import { useTenantTheme } from '../context/TenantThemeContext';

export default function LoginPage({ onLoginSuccess }) {
  const { logoUrl, tenantCode, tenantName } = useTenantTheme();
  const [identifier, setIdentifier] = useState('09121110000');
  const [password, setPassword] = useState('password');
  const [phone, setPhone] = useState('09121110000');
  const [otpCode, setOtpCode] = useState('999999');
  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'OTP'
  const [authSessionId, setAuthSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickSelect = (userType) => {
    setError(null);
    if (userType === 'sms_admin') {
      setIdentifier('09121110000');
      setPassword('password');
      setPhone('09121110000');
    } else if (userType === 'superadmin') {
      setIdentifier('superadmin');
      setPassword('password');
      setPhone('09199999999');
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

      // Trigger OTP sending
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700/80 p-2 shadow-lg shadow-cyan-500/25 mb-4">
            <img
              src={logoUrl}
              alt={tenantCode}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'block';
                }
              }}
            />
            <Shield className="w-8 h-8 text-cyan-400 hidden" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            سامانه مدیریت هویت و دسترسی {tenantName ? `(${tenantName})` : ''}
          </h1>
          <p className="text-xs text-slate-400 mt-1">کنسول مدیریت کاربران و سیستم ادمین مستأجرین (IAM)</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div id="login-error-alert" className="mb-6 p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'CREDENTIALS' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                نام کاربری یا شماره موبایل
              </label>
              <div className="relative">
                <input
                  id="input-login-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثلاً 09121110000 یا superadmin"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Quick Presets for Demo / Testing */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-2">انتخاب سریع حساب کاربری تستی:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-quick-smsadmin"
                  onClick={() => handleQuickSelect('sms_admin')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    identifier === '09121110000'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  👤 ادمین پیامک (smslocal)
                </button>
                <button
                  type="button"
                  id="btn-quick-superadmin"
                  onClick={() => handleQuickSelect('superadmin')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    identifier === 'superadmin'
                      ? 'bg-purple-950 border-purple-500 text-purple-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  ⚡ سوپرادمین کل
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال احراز هویت...</span>
                </>
              ) : (
                <>
                  <span>مرحله بعد (کد دو مرحله‌ای)</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="p-3 bg-cyan-950/60 border border-cyan-800/60 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>کد تایید دو مرحله‌ای به شماره ادمین ارسال گردید.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                کد تایید ۶ رقمی پیامک شده
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-slate-100 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">کد پیش‌فرض محیط آزمایشی: 999999</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep('CREDENTIALS')}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors"
              >
                بازگشت
              </button>
              <button
                type="submit"
                id="btn-submit-otp"
                disabled={loading}
                className="w-2/3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>تایید نشست...</span>
                  </>
                ) : (
                  <span>ورود به پرتال ادمین</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-500">
            مستأجر مقید: smslocal.ir (ID 10) | پلتفرم هویت چندمستأجره آسانک
          </span>
        </div>
      </div>
    </div>
  );
}
