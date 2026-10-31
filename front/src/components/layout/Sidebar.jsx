import React from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  Building2,
  Globe
} from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../../api/iamService';

export default function Sidebar({ activeTab, onSelectTab, currentUser, activeTenant }) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'نمای کلی و وضعیت دسترسی',
      icon: LayoutDashboard
    },
    {
      id: 'users',
      label: 'کاربران و مجوزهای فردی',
      icon: Users
    },
    {
      id: 'roles',
      label: 'مهندسی نقش‌ها و گروه‌ها',
      icon: ShieldCheck
    },
    {
      id: 'permissions',
      label: isSuperAdmin ? 'مدیریت پرمیژن‌های مستأجرین' : 'کاتالوگ استحقاق مستأجر',
      icon: Key
    },
    {
      id: 'tenants',
      label: 'مستأجرین، ماژول‌ها و کلون',
      icon: Building2
    },
    {
      id: 'audit',
      label: 'ممیزی امنیتی و نشست‌ها',
      icon: ShieldAlert
    },
    {
      id: 'settings',
      label: 'سیاست‌های احراز هویت ۲FA',
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 bg-[#0b0f17] text-slate-200 border-l border-slate-800/80 flex flex-col shrink-0 select-none min-h-screen">
      {/* Unified Host Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-100 tracking-tight truncate">
              درگاه مدیریت یکپارچه آسان
            </div>
            <div className="text-[11px] font-mono text-sky-400 truncate">
              {UNIFIED_ADMIN_HOST}
            </div>
          </div>
        </div>
      </div>

      {/* Active Governance Context Summary */}
      <div id="scoped-boundary-notice" className="mx-3 mt-4 p-3 rounded-lg bg-[#111827] border border-slate-800/80 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span>سطح دسترسی جاری</span>
          <span className="font-mono font-semibold text-slate-200">
            {isSuperAdmin ? 'SUPER_ADMIN' : 'TENANT_ADMIN'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
          <span>قلمرو فعال:</span>
          <span className="font-mono text-sky-400 tabular-nums">
            {activeTenant ? `${activeTenant.code} (#${activeTenant.id})` : `${currentUser?.tenantName || 'smslocal'} (#${currentUser?.tenantId || 10})`}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 px-3 mb-2">
          ماژول‌های راهبری هویت و دسترسی
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Clean Footer Context (No Fake Telemetry) */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>میزبان احراز هویت</span>
          <span className="font-mono text-slate-400">{UNIFIED_ADMIN_HOST}</span>
        </div>
        <div className="text-slate-600">
          پشتیبانی از استاندارد تبادل توکن RFC 8693
        </div>
      </div>
    </aside>
  );
}
