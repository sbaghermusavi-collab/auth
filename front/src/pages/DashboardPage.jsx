import React from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Building2,
  Globe,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Layers,
  SlidersHorizontal
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
      {/* Executive Welcome & Scope Switcher Box */}
      <div className="bg-theme-card border border-slate-200 border-r-4 border-r-indigo-600 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span className="font-mono font-bold text-indigo-600">{UNIFIED_ADMIN_HOST}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">
              {isSuperAdmin
                ? 'کنسول راهبری کل (Super Admin Governance)'
                : `کنسول مدیریت مستأجر (${activeTenant?.name || currentUser?.tenantName})`}
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            پیشخوان یکپارچه مدیریت دسترسی، نقش‌ها و مستأجرین
          </h1>

          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            {isSuperAdmin ? (
              <>
                شما با نقش <strong className="font-mono text-slate-900">SUPER_ADMIN</strong> وارد شده‌اید. در حال حاضر قلمرو{' '}
                <strong className="text-indigo-700">{activeTenant?.name || `Tenant #${targetTid}`}</strong> انتخاب شده است و می‌توانید استحقاق پرمیژن‌های این مستأجر، نقش‌ها و دسترسی‌های مستقیم کاربران را مدیریت کنید.
              </>
            ) : (
              <>
                شما با نقش <strong className="font-mono text-slate-900">TENANT_ADMIN</strong> در قلمرو اختصاصی{' '}
                <strong className="text-indigo-700">{activeTenant?.name || currentUser?.tenantName} (#{currentUser?.tenantId})</strong> قرار دارید و می‌توانید نقش‌ها و دسترسی کاربران زیرمجموعه خود را در چارچوب پرمیژن‌های مجاز مستأجر مدیریت نمایید.
              </>
            )}
          </p>

          {/* Quick Tenant Scope Switcher Boxes for Super Admin */}
          {isSuperAdmin && tenants.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">قلمرو مستأجر فعال:</span>
              {tenants.map((t) => {
                const isSelected = Number(t.id) === targetTid;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTenantSwitch && onTenantSwitch(String(t.id))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className={`font-mono mr-1.5 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                      (#{t.id})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('users')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            مدیریت کاربران و مجوزها
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('roles')}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            ماتریس نقش‌ها و گروه‌ها
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('permissions')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            استحقاق پرمیژن‌ها
          </button>
        </div>
      </div>

      {/* 4-Column Multi-Hue Architectural KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Terracotta Copper */}
        <div
          onClick={() => onSelectTab('users')}
          className="bg-theme-card border border-slate-200 border-r-4 border-r-indigo-600 shadow-sm p-5 rounded-2xl hover:border-indigo-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">کاربران قلمرو #{targetTid}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {scopedUsers.length}
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
            <span>{scopedUsers.filter((u) => u.enabled !== false).length} حساب فعال</span>
            <span className="text-indigo-600 font-bold">مدیریت کاربران ←</span>
          </div>
        </div>

        {/* Card 2: Antique Gold / Ochre */}
        <div
          onClick={() => onSelectTab('permissions')}
          className="bg-theme-card border border-slate-200 border-r-4 border-r-amber-600 shadow-sm p-5 rounded-2xl hover:border-amber-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">استحقاق پرمیژن مستأجر</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {entitledPermsCount}{' '}
            <span className="text-base text-slate-400 font-normal">/ {totalCatalogPerms || 14}</span>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
            <span>در {permissionGroups.length} گروه دسترسی</span>
            <span className="text-amber-700 font-bold">تنظیم استحقاق ←</span>
          </div>
        </div>

        {/* Card 3: Persian Turquoise / Teal */}
        <div
          onClick={() => onSelectTab('roles')}
          className="bg-theme-card border border-slate-200 border-r-4 border-r-teal-700 shadow-sm p-5 rounded-2xl hover:border-teal-600 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">نقش‌های تعریف‌شده</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {scopedRoles.length}
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
            <span>مجهز به گارد استحقاق</span>
            <span className="text-teal-700 font-bold">ماتریس نقش‌ها ←</span>
          </div>
        </div>

        {/* Card 4: Royal Pomegranate / Crimson */}
        <div
          onClick={() => onSelectTab('tenants')}
          className="bg-theme-card border border-slate-200 border-r-4 border-r-rose-700 shadow-sm p-5 rounded-2xl hover:border-rose-600 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">مستأجرین متصل</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {tenants.length}
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
            <span>پشتیبانی از کلونینگ</span>
            <span className="text-rose-700 font-bold">مدیریت مستأجرین ←</span>
          </div>
        </div>
      </div>

      {/* Boxed Permission Group Entitlement Matrix Cards */}
      <div className="bg-theme-card border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>باکس‌های استحقاق ماژول‌ها و گروه‌های پرمیژن در قلمرو «{activeTenant?.name || `Tenant #${targetTid}`}»</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              نمایش سقف مجوزهای اعطاشده توسط Super Admin به این مستأجر در هر گروه عملیاتی
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('permissions')}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>مدیریت استحقاق‌ها و کاتالوگ پرمیژن</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {permissionGroups.map((grp) => {
            const total = (grp.permissions || []).length;
            const entitled = (grp.permissions || []).filter((p) => p.entitled !== false).length;
            const allEntitled = total > 0 && entitled === total;
            const pct = total > 0 ? Math.round((entitled / total) * 100) : 0;

            return (
              <div
                key={grp.id}
                onClick={() => onSelectTab('permissions')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-theme-card hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-indigo-600">{grp.code}</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        allEntitled
                          ? 'text-teal-700'
                          : entitled > 0
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {entitled}/{total}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{grp.name}</div>
                </div>

                <div className="space-y-2">
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        allEntitled
                          ? 'bg-teal-600'
                          : entitled > 0
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>{allEntitled ? 'استحقاق کامل' : entitled > 0 ? 'استحقاق جزئی' : 'سلب شده'}</span>
                    <span className="text-indigo-600 font-bold">مشاهده ←</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Live Data Tables: Roles Table Box & Users Table Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Roles Summary Table Box */}
        <div className="lg:col-span-6 bg-theme-card border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>جدول نقش‌ها و مجوزهای متصل (Roles Matrix)</span>
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  نقش‌های فعال در مستأجر #{targetTid} و تعداد پرمیژن‌های تخصیص‌یافته
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('roles')}
                className="px-3 py-1.5 rounded-lg bg-theme-card border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-indigo-600 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>مدیریت نقش‌ها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">عنوان و کد نقش</th>
                    <th className="py-3.5 px-4">گروه‌های متصل</th>
                    <th className="py-3.5 px-4 text-center">تعداد پرمیژن</th>
                    <th className="py-3.5 px-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scopedRoles.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="font-mono text-[11px] text-indigo-600 font-semibold mt-0.5">
                          {r.code} {r.isDefault && '· پیش‌فرض'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {(r.groupCodes || []).length > 0
                          ? r.groupCodes.join(' · ')
                          : 'انتخاب موردی'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {(r.permissions || []).length} مجوز
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <button
                          type="button"
                          onClick={() => onSelectTab('roles')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold cursor-pointer"
                        >
                          ویرایش ماتریس
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Users Summary Table Box */}
        <div className="lg:col-span-6 bg-theme-card border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>جدول کاربران و دسترسی‌های مؤثر در قلمرو #{targetTid}</span>
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  خلاصه وضعیت کاربران، نقش‌ها و مجموع مجوزهای مؤثر هر کاربر
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('users')}
                className="px-3 py-1.5 rounded-lg bg-theme-card border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-indigo-600 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>مدیریت کاربران</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">کاربر</th>
                    <th className="py-3.5 px-4">نقش‌ها</th>
                    <th className="py-3.5 px-4 text-center">مجوزهای مؤثر</th>
                    <th className="py-3.5 px-4 text-center">وضعیت</th>
                    <th className="py-3.5 px-4 text-left">دسترسی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scopedUsers.slice(0, 6).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="font-mono text-[11px] text-indigo-600 font-semibold mt-0.5">
                          @{u.username}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 font-medium">
                        {(u.roles || []).join(' · ')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {(u.effectivePermissions || []).length} مجوز
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {u.enabled !== false ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>فعال</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>مسدود</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <button
                          type="button"
                          onClick={() => onSelectTab('users')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>مجوزها</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
