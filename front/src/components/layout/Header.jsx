import React from 'react';
import { KeyRound, LogOut, ChevronDown, Globe, Building2, Palette } from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../../api/iamService';
import { useTenantTheme } from '../../context/TenantThemeContext';

const TAB_LABELS = {
  dashboard: 'پیشخوان مدیریتی و معماری دسترسی',
  tenants: 'مدیریت مستأجرین، ماژول‌ها و کلونینگ',
  permissions: 'استحقاق مستأجر و کاتالوگ پرمیژن‌های سراسری',
  roles: 'ماتریس نقش‌ها و اتصال یک‌کلیکی گروه‌ها',
  users: 'مدیریت کاربران، مجوزهای مستقیم و گروه‌های کاربری',
  audit: 'ممیزی امنیتی و نشست‌های فعال',
  settings: 'سیاست‌های احراز هویت و ۲FA'
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
  const { paletteId, palettes, setPaletteId } = useTenantTheme();

  return (
    <header className="bg-theme-card border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between gap-6 shadow-sm">
      {/* Zone 1: Contextual Breadcrumb */}
      <div className="flex items-center gap-2 text-xs whitespace-nowrap shrink-0">
        <span className="font-mono font-bold text-indigo-600 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-indigo-600" />
          {UNIFIED_ADMIN_HOST}
        </span>
        <span className="text-slate-300" aria-hidden="true">/</span>
        <span className="text-slate-900 font-bold text-sm">
          {TAB_LABELS[activeTab] || 'کنسول مدیریت'}
        </span>
      </div>

      {/* Zone 2: Target Tenant Scope Switcher & Color Palette Bar */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>قلمرو مستأجر هدف:</span>
          </span>
          {isSuperAdmin && tenants.length > 0 ? (
            <div className="relative inline-block">
              <select
                id="select-tenant-switcher"
                value={activeTenantId || ''}
                onChange={(e) => onTenantSwitch && onTenantSwitch(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs rounded-lg px-3.5 py-1.5 font-bold outline-none cursor-pointer focus:border-indigo-600 appearance-none pr-3.5 pl-8 transition-colors whitespace-nowrap"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — #{t.id} ({t.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-800 font-semibold whitespace-nowrap bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span>{activeTenantObj?.name || currentUser?.tenantName || 'smslocal'}</span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="font-mono text-indigo-600 tabular-nums">
                Tenant #{currentUser?.tenantId || 10}
              </span>
            </div>
          )}
        </div>

        {/* Quick Palette Swatches */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
          <Palette className="w-3.5 h-3.5 text-indigo-600 ml-1" />
          {palettes.map((p) => {
            const isSelected = p.id === paletteId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaletteId(p.id)}
                title={`تم رنگ: ${p.name}`}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.primaryHex }}
                />
                <span>{p.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone 3: Identity, JWT Claims Inspector & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-700 pl-2 border-l border-slate-200 whitespace-nowrap">
          <span className="font-bold text-slate-900">
            {currentUser?.displayName || currentUser?.username}
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-indigo-600 font-bold">
            @{currentUser?.username}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenClaimsModal}
          id="btn-jwt-claims"
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
          <span>کلیم‌های JWT</span>
        </button>

        <button
          type="button"
          id="btn-logout"
          onClick={onLogout}
          className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
