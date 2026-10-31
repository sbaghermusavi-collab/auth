import React from 'react';
import { Shield, KeyRound, User, LogOut, Bell, Layers, CheckCircle2, ChevronDown } from 'lucide-react';
import { useTenantTheme } from '../../context/TenantThemeContext';

export default function Header({ 
  currentUser, 
  tenants = [], 
  activeTenantId, 
  onTenantSwitch, 
  onOpenClaimsModal, 
  onLogout 
}) {
  const { logoUrl, tenantCode, tenantName } = useTenantTheme();
  return (
    <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Dynamic Multi-Tenant Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">مستأجر فعال:</span>
          {tenants && tenants.length > 0 ? (
            <div className="relative inline-block">
              <select
                id="select-tenant-switcher"
                value={activeTenantId || ''}
                onChange={(e) => onTenantSwitch && onTenantSwitch(e.target.value)}
                className="bg-cyan-950/80 text-cyan-200 border border-cyan-800/70 text-xs rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500 appearance-none pr-8 pl-3 shadow-sm transition-all"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.name || t.code} (شناسه {t.id})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm">
              <span id="header-tenant-name">{currentUser?.tenantName || tenantName} (شناسه {currentUser?.tenantId || ''})</span>
            </span>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 border-r border-slate-700 pr-4">
          <span className="text-xs text-slate-400">نقش فعال:</span>
          <span id="active-role-badge" className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
            {currentUser?.role || 'SUPER_ADMIN'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Claims Viewer Quick Button */}
        <button
          onClick={onOpenClaimsModal}
          id="btn-jwt-claims"
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-600"
          title="مشاهده زنده کلیم‌های توکن JWT"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">کلیم‌های JWT</span>
        </button>

        {/* User Info Display */}
        <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-900/60 border border-slate-700/70 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
            {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col text-right">
            <span id="header-user-display" className="text-xs font-bold text-slate-200">
              {currentUser?.displayName || currentUser?.username || 'کاربر سیستم'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">@{currentUser?.username}</span>
          </div>
        </div>

        {/* PROMINENT LOGOUT BUTTON */}
        <button
          id="btn-logout"
          onClick={onLogout}
          className="bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          title="خروج از حساب کاربری و باطل‌سازی نشست"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">خروج از حساب</span>
        </button>
      </div>
    </header>
  );
}
