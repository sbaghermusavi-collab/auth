import React from 'react';
import { Settings, KeyRound, Smartphone, Globe, CheckCircle2 } from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function SettingsPage({ currentUser, activeTenant, onUpdateTenant }) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleTogglePolicy = (field) => {
    if (!activeTenant || !onUpdateTenant) return;
    onUpdateTenant(activeTenant.id, {
      ...activeTenant,
      [field]: !activeTenant[field]
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800/80">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" />
          <span>سیاست‌های احراز هویت و امنیت نشست در {UNIFIED_ADMIN_HOST}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          پیکربندی ورود دو مرحله‌ای OTP، الگوریتم هش کلمه عبور و تنظیمات درگاه واحد مدیریت
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>سیاست‌های ورود مستأجر ({activeTenant?.name || currentUser?.tenantName})</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">احراز هویت دو مرحله‌ای (2FA SMS OTP)</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  الزام تایید کد ۶ رقمی هنگام ورود ادمین در {UNIFIED_ADMIN_HOST}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePolicy('otpEnabled')}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  activeTenant?.otpEnabled !== false
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {activeTenant?.otpEnabled !== false ? 'فعال' : 'غیرفعال'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">کپچای امنیتی ضد ربات (Captcha Guard)</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  بررسی توکن کپچا پس از ۳ تلاش ناموفق ورود
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePolicy('captchaEnabled')}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  activeTenant?.captchaEnabled
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {activeTenant?.captchaEnabled ? 'فعال' : 'غیرفعال'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">کد OTP محیط آزمایشی</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  کد استاندارد جهت تست سریع سناریوهای سوپرادمین و ادمین مستأجر
                </span>
              </div>
              <span className="font-mono text-sky-400 font-bold text-sm tabular-nums">
                999999
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>مشخصات زیرساخت درگاه واحد ({UNIFIED_ADMIN_HOST})</span>
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-slate-200 block mb-1">آدرس میزبان واحد کنسول ادمین:</span>
              <p className="text-[11px] text-sky-400 font-mono">
                https://{UNIFIED_ADMIN_HOST} (Unified Multi-Tenant Admin Host)
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-slate-200 block mb-1">الگوریتم هش کلمه عبور سرور احراز هویت:</span>
              <p className="text-[11px] text-slate-400 font-mono">
                {`{legacy} MD5(salt + MD5(pass)) + SHA256 ('SCourtMScaleS')`}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-slate-200 block mb-1">مکانیسم نشست و تبادل توکن:</span>
              <p className="text-[11px] text-slate-400 font-mono">
                ADMIN_SESSION (HttpOnly, SameSite=Lax) + RFC 8693 Actor Claim
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
