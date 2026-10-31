import React from 'react';
import { KeyRound, LogOut, ChevronDown, Globe } from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../../api/iamService';

const TAB_LABELS = {
  dashboard: 'نمای کلی و وضعیت دسترسی',
  users: 'مدیریت کاربران و مجوزها',
  roles: 'مهندسی نقش‌ها و گروه‌ها',
  permissions: 'ماتریس استحقاق مستأجر',
  tenants: 'مدیریت مستأجرین و کلون',
  audit: 'لاگ ممیزی و نشست‌های فعال',
  settings: 'سیاست‌های امنیتی و ۲FA'
};

export default function Header({
  activeTab,
  currentUser,
  tenants = [],
  activeTenantId,
  onTenantSwitch,
  onOpenClaimsModal,
  onLogout
}) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const activeTenantObj = tenants.find((t) => String(t.id) === String(activeTenantId));

  return (
    <header className="bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2.5 text-xs whitespace-nowrap shrink-0">
        <span className="font-mono font-semibold text-sky-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          {UNIFIED_ADMIN_HOST}
        </span>
        <span className="text-slate-600" aria-hidden="true">/</span>
        <span className="text-slate-200 font-semibold">
          {TAB_LABELS[activeTab] || 'کنسول مدیریت'}
        </span>
        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
        <span className="text-slate-400 hidden sm:inline">
          {isSuperAdmin ? 'دسترسی راهبر کل (Super Admin)' : `مدیر مستأجر (${currentUser?.tenantName || 'smslocal'})`}
        </span>
      </div>

      {/* Zone 2: Tenant Target Selector (Interactive Control for Super Admin, Unboxed Metadata for Tenant Admin) */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-xs text-slate-400 whitespace-nowrap">قلمرو مستأجر هدف:</span>
        {isSuperAdmin && tenants.length > 0 ? (
          <div className="relative inline-block">
            <select
              id="select-tenant-switcher"
              value={activeTenantId || ''}
              onChange={(e) => onTenantSwitch && onTenantSwitch(e.target.value)}
              className="bg-slate-900 text-slate-100 border border-slate-700/80 hover:border-sky-500/60 text-xs rounded-lg px-3 py-1.5 font-medium outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/40 appearance-none pr-3 pl-8 transition-colors whitespace-nowrap"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                  {t.name} — ID {t.id} ({t.code})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <div id="header-tenant-name" className="text-xs text-slate-300 font-medium whitespace-nowrap">
            <span>{activeTenantObj?.name || currentUser?.tenantName || 'smslocal'}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="font-mono text-slate-400 tabular-nums">Tenant #{currentUser?.tenantId || 10}</span>
          </div>
        )}
      </div>

      {/* Zone 3: Primary Actions & Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenClaimsModal}
          id="btn-jwt-claims"
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          title="مشاهده زنده کلیم‌های توکن JWT"
        >
          <KeyRound className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">توکن JWT</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 px-2 border-r border-slate-800 pr-3 whitespace-nowrap">
          <span id="header-user-display" className="font-semibold text-slate-100">
            {currentUser?.displayName || currentUser?.username}
          </span>
          <span className="text-slate-600">·</span>
          <span id="active-role-badge" className="font-mono text-slate-400">
            @{currentUser?.username}
          </span>
        </div>

        <button
          id="btn-logout"
          onClick={onLogout}
          className="bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-800/70 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="خروج از درگاه یکپارچه admin.asan.com"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
