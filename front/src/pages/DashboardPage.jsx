import React from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Building2,
  Lock,
  Globe,
  ArrowLeft,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function DashboardPage({
  users = [],
  roles = [],
  tenants = [],
  permissionGroups = [],
  activeTenantId,
  currentUser,
  onSelectTab,
  onTenantSwitch
}) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTid = Number(activeTenantId || currentUser?.tenantId || 10);
  const activeTenant = tenants.find((t) => Number(t.id) === targetTid) || tenants[0];

  const scopedUsers = isSuperAdmin
    ? users.filter((u) => !activeTenantId || u.tenantId === targetTid)
    : users.filter((u) => u.tenantId === currentUser.tenantId);

  const scopedRoles = roles.filter(
    (r) => r.tenantId === targetTid || (isSuperAdmin && r.tenantId === 1)
  );

  const totalCatalogPerms = permissionGroups.reduce(
    (acc, g) => acc + (g.permissions ? g.permissions.length : 0),
    0
  );
  const entitledPermsCount = permissionGroups.reduce(
    (acc, g) =>
      acc + (g.permissions ? g.permissions.filter((p) => p.entitled !== false).length : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Unified Host Context Banner */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-sky-400">{UNIFIED_ADMIN_HOST}</span>
            <span>·</span>
            <span>
              {isSuperAdmin
                ? 'کنسول راهبری سراسری (Super Admin Governance)'
                : `کنسول مدیریت مقید به مستأجر (${activeTenant?.name || currentUser?.tenantName})`}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white">
            مرکز فرماندهی یکپارچه — خوش آمدید، {currentUser.displayName}
          </h1>

          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {isSuperAdmin ? (
              <>
                شما با دسترسی <strong className="text-slate-200 font-mono">SUPER_ADMIN</strong> در درگاه واحد{' '}
                <code className="font-mono text-sky-300">{UNIFIED_ADMIN_HOST}</code> متصل هستید. در حال حاضر قلمرو{' '}
                <strong className="text-slate-200">{activeTenant?.name || `Tenant #${targetTid}`}</strong> انتخاب شده است و می‌توانید بین{' '}
                <strong className="text-slate-200">مدیریت مستأجرین</strong>،{' '}
                <strong className="text-slate-200">مدیریت کاربران</strong> و{' '}
                <strong className="text-slate-200">تنظیمات پرمیژن‌های سراسری</strong> جابجا شوید.
              </>
            ) : (
              <>
                شما با دسترسی <strong className="text-slate-200 font-mono">TENANT_ADMIN</strong> از طریق درگاه واحد{' '}
                <code className="font-mono text-sky-300">{UNIFIED_ADMIN_HOST}</code> به قلمرو اختصاصی{' '}
                <strong className="text-slate-200">{activeTenant?.name || currentUser.tenantName} (شناسه {currentUser.tenantId})</strong> متصل هستید.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('tenants')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            مدیریت مستأجرین
          </button>
          <button
            onClick={() => onSelectTab('users')}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            مدیریت کاربران و مجوزها
          </button>
          <button
            onClick={() => onSelectTab('permissions')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            تنظیمات پرمیژن‌های سراسری
          </button>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>کاربران قلمرو انتخابی</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {scopedUsers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            <span>{scopedUsers.filter((u) => u.enabled !== false).length} فعال</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>Tenant #{targetTid}</span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>پرمیژن‌های دارای استحقاق مستأجر</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {entitledPermsCount} <span className="text-sm text-slate-500 font-normal">/ {totalCatalogPerms || 14}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {isSuperAdmin ? 'قابل ویرایش توسط سوپرادمین' : 'تعیین‌شده توسط راهبر کل'}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>نقش‌های تعریف‌شده</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {scopedRoles.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            مجهز به گارد استحقاق (Entitlement Guard)
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>مستأجرین متصل به {UNIFIED_ADMIN_HOST}</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {tenants.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {currentUser.isImpersonated ? 'وضعیت: جعل هویت فعال (RFC 8693)' : 'وضعیت نشست: ادمین اصلی'}
          </div>
        </div>
      </div>

      {/* 3-Pillar Centralized Workspace Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Pillar 1: Tenant Management */}
        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">مدیریت مستأجرین (Tenants)</h2>
                  <p className="text-[11px] text-slate-400 font-mono">GET/POST /api/admin/tenants</p>
                </div>
              </div>
              <span className="text-xs font-mono text-sky-400 tabular-nums">{tenants.length} سازمان</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              ایجاد مستأجر جدید، فعال‌سازی ماژول‌های اختصاصی و کلون کردن کامل پیکربندی یک مستأجر به همراه نقش‌ها و استحقاق‌ها.
            </p>

            <div className="space-y-1.5 pt-1">
              {tenants.slice(0, 3).map((t) => {
                const isSelected = Number(t.id) === targetTid;
                return (
                  <div
                    key={t.id}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-950/30 border-sky-500/40 text-slate-100'
                        : 'bg-[#0b0f17] border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono mr-1.5">({t.code})</span>
                    </div>
                    {isSuperAdmin && !isSelected && onTenantSwitch ? (
                      <button
                        type="button"
                        onClick={() => onTenantSwitch(String(t.id))}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                      >
                        انتخاب قلمرو
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400">قلمرو فعال</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('tenants')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>ورود به بخش مدیریت مستأجرین</span>
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>

        {/* Pillar 2: User Management */}
        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">مدیریت کاربران (Users)</h2>
                  <p className="text-[11px] text-slate-400 font-mono">PUT /api/admin/users/:id/roles</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 tabular-nums">{scopedUsers.length} کاربر</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              تعریف کاربر جدید، تخصیص چندگانه نقش‌ها، اعطای پرمیژن‌های مستقیم به هر کاربر، مشاهده لاگ فعالیت و جعل هویت RFC 8693.
            </p>

            <div className="space-y-1.5 pt-1">
              {scopedUsers.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800/80 text-xs flex items-center justify-between"
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-200">{u.firstName} {u.lastName}</span>
                    <span className="text-[11px] text-sky-400 font-mono mr-1.5">@{u.username}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {(u.effectivePermissions || []).length} مجوز
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('users')}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>ورود به مدیریت کاربران و دسترسی فردی</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 3: System-Wide Permission Settings */}
        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">تنظیمات پرمیژن‌های سراسری</h2>
                  <p className="text-[11px] text-slate-400 font-mono">POST /api/admin/tenants/:id/permissions</p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                {entitledPermsCount}/{totalCatalogPerms || 14}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              مدیریت کاتالوگ پرمیژن‌های سراسری، اعطا یا سلب استحقاق تکی و گروهی از مستأجرین با سلب خودکار آبشاری از نقش‌ها.
            </p>

            <div className="space-y-1.5 pt-1">
              {permissionGroups.slice(0, 3).map((g) => {
                const total = (g.permissions || []).length;
                const entitled = (g.permissions || []).filter((p) => p.entitled !== false).length;
                return (
                  <div
                    key={g.id}
                    className="px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800/80 text-xs flex items-center justify-between"
                  >
                    <div className="truncate">
                      <span className="font-semibold text-slate-200">{g.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono mr-1.5">({g.code})</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                      {entitled}/{total} فعال
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('permissions')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>ورود به تنظیمات پرمیژن‌های سراسری</span>
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Two-Column Split: Governance Matrix & Scoped Users Quick Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Right Column: Governance Capabilities & Rules */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>معماری کنترل دسترسی در {UNIFIED_ADMIN_HOST}</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">BFF + Auth Server</span>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="pb-3.5 border-b border-slate-800/60">
                <div className="font-bold text-slate-100 mb-1 flex items-center justify-between">
                  <span>۱. مدیریت پرمیژن‌های مستأجر توسط Super Admin</span>
                  <span className="font-mono text-[11px] text-sky-400">POST/DELETE /api/admin/tenants/:id/permissions</span>
                </div>
                <p className="text-slate-400">
                  سوپرادمین تعیین می‌کند هر مستأجر (مثلاً <code className="font-mono text-slate-300">smslocal</code> یا <code className="font-mono text-slate-300">asanlocal</code>) به کدام ماژول‌ها و پرمیژن‌ها استحقاق دارد. به محض سلب یک پرمیژن از مستأجر، آن مجوز به صورت خودکار از نقش‌ها و کاربران آن مستأجر نیز سلب می‌شود.
                </p>
              </div>

              <div className="pb-3.5 border-b border-slate-800/60">
                <div className="font-bold text-slate-100 mb-1 flex items-center justify-between">
                  <span>۲. مدیریت مجوزها و نقش‌های کاربران توسط Tenant Admin</span>
                  <span className="font-mono text-[11px] text-emerald-400">PUT /api/admin/users/:id/roles</span>
                </div>
                <p className="text-slate-400">
                  ادمین هر مستأجر می‌تواند برای کاربران زیرمجموعه خود نقش‌های سفارشی تعریف کند یا پرمیژن‌های مستقیم (Direct Permissions) در چارچوب پرمیژن‌های مجاز مستأجر اختصاص دهد.
                </p>
              </div>

              <div>
                <div className="font-bold text-slate-100 mb-1 flex items-center justify-between">
                  <span>۳. جعل هویت استاندارد RFC 8693 با ثبت Actor</span>
                  <span className="font-mono text-[11px] text-amber-400">POST /api/admin/impersonate</span>
                </div>
                <p className="text-slate-400">
                  ادمین مستأجر صرفاً مجاز به جعل هویت کاربران داخل مستأجر خود است و تلاش برای دسترسی به کاربران مستأجر دیگر با خطای <code className="font-mono text-rose-300">403 Forbidden</code> در گارد مرزی مسدود و در ممیزی ثبت می‌شود.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">مشاهده کاتالوگ و تغییر استحقاق‌ها</span>
            <button
              onClick={() => onSelectTab('permissions')}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>باز کردن ماتریس پرمیژن‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Left Column: Active Scoped Users & Effective Permission Count */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>کاربران و مجوزهای مؤثر در قلمرو #{targetTid}</span>
              </h2>
              <button
                onClick={() => onSelectTab('users')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
              >
                مدیریت کامل کاربران
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {scopedUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span className="text-sky-400">@{u.username}</span>
                      <span>·</span>
                      <span>{u.phone}</span>
                      <span>·</span>
                      <span>Tenant #{u.tenantId}</span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-xs font-mono text-slate-200 tabular-nums">
                      {(u.effectivePermissions || []).length} مجوز مؤثر
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {u.roles.join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>امکان ویرایش نقش‌ها و پرمیژن‌های مستقیم هر کاربر</span>
            <button
              onClick={() => onSelectTab('users')}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>ویرایش دسترسی کاربران</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
