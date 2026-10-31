import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Key,
  ShieldAlert,
  Settings,
  Globe,
  Layers,
  Palette
} from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../../api/iamService';
import { useTenantTheme } from '../../context/TenantThemeContext';

export default function Sidebar({
  activeTab,
  onSelectTab,
  currentUser,
  activeTenant,
  counts = {}
}) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const { paletteId, palettes, setPaletteId } = useTenantTheme();

  const navGroups = [
    {
      title: 'مرکز فرماندهی',
      items: [
        {
          id: 'dashboard',
          label: 'پیشخوان و معماری دسترسی',
          icon: LayoutDashboard,
          count: null
        }
      ]
    },
    {
      title: 'مدیریت مستأجرین و استحقاق (Super Admin)',
      items: [
        {
          id: 'tenants',
          label: 'مستأجرین، ماژول‌ها و کلونینگ',
          icon: Building2,
          count: counts.tenants
        },
        {
          id: 'permissions',
          label: isSuperAdmin ? 'استحقاق مستأجر و کاتالوگ پرمیژن' : 'کاتالوگ پرمیژن‌های مجاز مستأجر',
          icon: Key,
          count: counts.permissions
        }
      ]
    },
    {
      title: 'مدیریت دسترسی مستأجر (Tenant IAM)',
      items: [
        {
          id: 'roles',
          label: 'ماتریس نقش‌ها و گروه‌های دسترسی',
          icon: ShieldCheck,
          count: counts.roles
        },
        {
          id: 'users',
          label: 'کاربران، مجوزها و گروه‌های کاربری',
          icon: Users,
          count: counts.users
        }
      ]
    },
    {
      title: 'امنیت، نشست‌ها و ممیزی',
      items: [
        {
          id: 'audit',
          label: 'لاگ ممیزی و نشست‌های فعال',
          icon: ShieldAlert,
          count: counts.audit
        },
        {
          id: 'settings',
          label: 'سیاست‌های احراز هویت و ۲FA',
          icon: Settings,
          count: null
        }
      ]
    }
  ];

  return (
    <aside className="w-72 bg-theme-sidebar text-stone-200 flex flex-col shrink-0 min-h-screen border-l border-theme-sidebar select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-theme-sidebar flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-amber-400/30 flex items-center justify-center text-white shadow-sm shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-stone-100 tracking-tight truncate">
            درگاه یکپارچه مدیریت آسان
          </div>
          <div className="text-xs font-mono text-amber-400 truncate mt-0.5">
            {UNIFIED_ADMIN_HOST}
          </div>
        </div>
      </div>

      {/* Active Scope Summary Box */}
      <div className="mx-4 mt-4 p-3.5 rounded-xl bg-theme-sidebar-card border border-theme-sidebar text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-stone-400">نقش نشست جاری:</span>
          <span className="font-mono font-bold text-amber-300">
            {isSuperAdmin ? 'SUPER_ADMIN' : 'TENANT_ADMIN'}
          </span>
        </div>
        <div className="pt-2 border-t border-theme-sidebar flex items-center justify-between">
          <span className="text-stone-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>قلمرو هدف:</span>
          </span>
          <span className="font-mono text-stone-100 font-semibold tabular-nums">
            {activeTenant
              ? `${activeTenant.code} (#${activeTenant.id})`
              : `${currentUser?.tenantName || 'smslocal'} (#${currentUser?.tenantId || 10})`}
          </span>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold text-stone-400 mb-1.5">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm border-r-4 border-amber-300'
                      : 'text-stone-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-200' : 'text-stone-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== null && item.count !== undefined && (
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive ? 'text-amber-100 font-bold' : 'text-stone-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Palette Switcher Box */}
      <div className="mx-4 mb-3 p-3 rounded-xl bg-theme-sidebar-card border border-theme-sidebar space-y-2">
        <div className="flex items-center justify-between text-[11px] text-stone-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>پالت رنگ معماری:</span>
          </span>
          <span className="text-amber-300 text-[10px]">
            {palettes.find((p) => p.id === paletteId)?.name}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {palettes.map((p) => {
            const active = p.id === paletteId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaletteId(p.id)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  active
                    ? 'bg-white/15 border-amber-400 text-white'
                    : 'bg-black/20 border-white/10 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                  style={{ backgroundColor: p.primaryHex }}
                />
                <span className="truncate">{p.name.split(' ')[0]} {p.name.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-theme-sidebar text-[11px] text-stone-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>میزبان BFF</span>
          <span className="font-mono text-amber-300/90">{UNIFIED_ADMIN_HOST}</span>
        </div>
        <div className="text-stone-500">
          پشتیبانی کامل از استاندارد RFC 8693
        </div>
      </div>
    </aside>
  );
}
