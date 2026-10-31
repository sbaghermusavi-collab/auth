import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Lock, Globe } from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function SettingsPage({ currentUser, activeTenant, onUpdateTenant }) {
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [captchaEnabled, setCaptchaEnabled] = useState(false);

  useEffect(() => {
    if (activeTenant) {
      setOtpEnabled(activeTenant.otpEnabled !== false);
      setPasswordEnabled(activeTenant.passwordEnabled !== false);
      setCaptchaEnabled(Boolean(activeTenant.captchaEnabled));
    }
  }, [activeTenant]);

  const handleSave = () => {
    if (!activeTenant || !onUpdateTenant) return;
    onUpdateTenant(activeTenant.id, {
      otpEnabled,
      passwordEnabled,
      captchaEnabled
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-theme-card border border-slate-200 border-r-4 border-r-indigo-600 rounded-xl p-6 space-y-5 shadow-sm">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <span>
                سیاست‌های احراز هویت دومرحله‌ای و امنیت نشست در {UNIFIED_ADMIN_HOST}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              پیکربندی جریان ورود (OTP / Password / Captcha) برای قلمرو فعال:{' '}
              <strong className="text-slate-900">{activeTenant?.name || 'smslocal'}</strong>
            </p>
          </div>
          <span className="font-mono text-xs text-indigo-600 font-bold">
            PUT /api/admin/tenants/{activeTenant?.id || 10}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 mb-1">الزام تایید دو مرحله‌ای (SMS OTP)</div>
              <p className="text-slate-600 leading-relaxed">
                ارسال کد ۶ رقمی به موبایل ثبت‌شده پس از تایید رمز عبور اولیه در {UNIFIED_ADMIN_HOST}
              </p>
            </div>
            <input
              type="checkbox"
              checked={otpEnabled}
              onChange={(e) => setOtpEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
          </label>

          <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 mb-1">احراز هویت پایه با رمز عبور</div>
              <p className="text-slate-600 leading-relaxed">
                بررسی هش رمز عبور اختصاصی کاربر قبل از ایجاد نشست Pre-Auth در Redis
              </p>
            </div>
            <input
              type="checkbox"
              checked={passwordEnabled}
              onChange={(e) => setPasswordEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
          </label>

          <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 mb-1">گارد کپچا در تلاش‌های مکرر</div>
              <p className="text-slate-600 leading-relaxed">
                فعال‌سازی چالش کپچا پس از ۳ تلاش ناموفق ورود از یک آدرس IP
              </p>
            </div>
            <input
              type="checkbox"
              checked={captchaEnabled}
              onChange={(e) => setCaptchaEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>کوکی نشست BFF با پرچم‌های HttpOnly و SameSite=Lax صادر می‌گردد</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
          >
            ذخیره سیاست‌های امنیتی مستأجر
          </button>
        </div>
      </div>
    </div>
  );
}
