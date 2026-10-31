import React from 'react';
import { Settings, Shield, KeyRound, Smartphone, Bell, CheckCircle2 } from 'lucide-react';

export default function SettingsPage({ currentUser }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>تنظیمات سیستم و احراز هویت دو مرحله‌ای (2FA & Security)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          پیکربندی امنیت نشست، هش رمز عبور {`{legacy}`} و الگوهای ارسال پیامک OTP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>تنظیمات ورود دو مرحله‌ای (Two-Factor OTP)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">ارسال کد تایید پیامکی</span>
                <span className="text-[11px] text-slate-400">الزام ورود با دریافت پیامک یکبارمصرف</span>
              </div>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                فعال
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">کد OTP محیط توسعه</span>
                <span className="text-[11px] text-slate-400">کد استاندارد برای تست‌های خودکار</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                999999
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>پیکربندی رمزنگاری و هش پسورد</span>
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="font-bold text-slate-200 block mb-1">الگوریتم هش کلمه عبور:</span>
              <p className="text-[11px] text-slate-400 font-mono">
                {`{legacy} MD5(salt + MD5(pass)) + SHA256 ('SCourtMScaleS')`}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="font-bold text-slate-200 block mb-1">نوع کوکی سشن ادمین:</span>
              <p className="text-[11px] text-slate-400 font-mono">
                ADMIN_SESSION (HttpOnly, SameSite=Lax, Path=/)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
