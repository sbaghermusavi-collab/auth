import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  Layers, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Lock
} from 'lucide-react';

export default function DashboardPage({ users, roles, currentUser, onSelectTab }) {
  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN' || currentUser.tenantId === 10;
  const scopedUsers = users.filter((u) => !isTenantAdmin || u.tenantId === currentUser.tenantId);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-800 p-6 rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>کنسول مدیریت هویت و دسترسی آسانک (Asanak IAM BFF Portal)</span>
            </div>
            <h2 className="text-xl font-black text-white">
              خوش آمدید، {currentUser.displayName}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              شما با سطح دسترسی <strong className="text-cyan-300">{currentUser.role}</strong> در مستأجر <strong className="text-cyan-300">{currentUser.tenantName || 'smslocal'} (شناسه {currentUser.tenantId})</strong> متصل هستید. کلیه درخواست‌ها از طریق کوکی امن HttpOnly در درگاه BFF پردازش می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('users')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition cursor-pointer"
            >
              مدیریت کاربران مستأجر
            </button>
            <button
              onClick={() => onSelectTab('roles')}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              سازنده نقش‌ها
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold">کاربران مجاز مستأجر</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{scopedUsers.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ایزولاسیون کامل سطح دیتابیس</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold">نقش‌های فعال حوزه تننت</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{roles.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            سیستمی و سفارشی مستأجر
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold">وضعیت جعل هویت (RFC 8693)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white">
            {currentUser.isImpersonated ? (
              <span className="text-amber-400">فعال (در حال جعل هویت)</span>
            ) : (
              <span className="text-slate-300">عادی (ادمین اصلی)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ردیابی Actor در تمام لاگ‌ها
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold">معماری احراز هویت</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-mono font-bold text-emerald-400">BFF Token-Relay</div>
          <div className="text-[11px] text-slate-400 mt-1">
            کوکی HttpOnly (بدون نشت توکن)
          </div>
        </div>
      </div>

      {/* Security Boundaries & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoped Boundary Overview */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>مرزهای امنیتی و قوانین چندمستأجری (Tenant Rules)</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>ایزولاسیون داده کاربران:</strong> ادمین مستأجر صرفاً به کاربران دارای <code>tenant_id = 10</code> دسترسی دارد و دسترسی به کاربران مستأجر ۲۰ مسدود است.
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>گارد استحقاق پرمیژن‌ها:</strong> ساخت نقش با پرمیژن‌هایی که توسط سوپرادمین از مستأجر سلب شده‌اند (مانند آمار پیامک)، با خطای <code>PERMISSION_NOT_ENTITLED</code> در سرور رد می‌شود.
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>جعل هویت کنترل‌شده:</strong> جعل هویت تنها در محدوده کاربران همان مستأجر مجاز است و در توکن JWT کلیم <code>act</code> حاوی مشخصات ادمین مبدأ ثبت می‌شود.
              </div>
            </li>
          </ul>
        </div>

        {/* Quick User List in Dashboard */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>کاربران اخیراً فعال در مستأجر ۱۰</span>
            </h3>
            <button
              onClick={() => onSelectTab('users')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {scopedUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-900/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] font-mono text-cyan-400">@{u.username}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {u.roles[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
