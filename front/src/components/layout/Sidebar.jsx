import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  LayoutDashboard, 
  ShieldAlert, 
  Settings, 
  Layers, 
  Lock,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { useTenantTheme } from '../../context/TenantThemeContext';

export default function Sidebar({ activeTab, onSelectTab, currentUser }) {
  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN' || currentUser.tenantId === 10;
  const { logoUrl, tenantCode, tenantName } = useTenantTheme();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'میزکار و وضعیت سامانه',
      icon: LayoutDashboard,
      badge: 'BFF'
    },
    {
      id: 'users',
      label: 'مدیریت کاربران (User Management)',
      icon: Users,
      badge: isTenantAdmin ? 'مستأجر ۱۰' : 'سراسری'
    },
    {
      id: 'roles',
      label: 'مدیریت نقش‌ها (Role Management)',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'permissions',
      label: 'پرمیژن‌ها و استحقاق (Permissions)',
      icon: Key,
      badge: null
    },
    {
      id: 'audit',
      label: 'ممیزی جعل هویت (RFC 8693)',
      icon: ShieldAlert,
      badge: 'JWT'
    },
    {
      id: 'settings',
      label: 'تنظیمات و احراز هویت ۲FA',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 border-l border-slate-800 flex flex-col shrink-0 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 p-1.5 flex items-center justify-center shadow-lg shadow-cyan-950/40 shrink-0">
          <img
            src={logoUrl}
            alt={tenantCode}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
          <span className="hidden w-full h-full rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 items-center justify-center text-white font-black text-sm">
            {tenantCode.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-white tracking-wide">
            {currentUser?.tenantName ? `کنسول ${currentUser.tenantName}` : 'کنسول مدیریت آسانک'}
          </h1>
          <p className="text-[11px] text-cyan-400 font-medium">IAM & User Management</p>
        </div>
      </div>

      {/* Scoped Boundary Alert for Tenant Admins */}
      {isTenantAdmin && (
        <div id="scoped-boundary-notice" className="mx-3 my-3 p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-[11px] leading-5 text-cyan-300">
          <div className="flex items-center gap-1.5 font-bold mb-0.5 text-cyan-200">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>ایزولاسیون مستأجر فعال است</span>
          </div>
          <p className="text-cyan-400/80">
            شما مقید به داده‌های <strong className="text-cyan-200">{currentUser?.tenantName || 'مستأجر اختصاصی'} (شناسه {currentUser?.tenantId || ''})</strong> هستید.
          </p>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-3 mb-2">
          منوهای ادمین و سیستم
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30 font-bold'
                  : 'text-slate-200 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-cyan-700/80 text-cyan-100' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            اتصال به درگاه BFF
          </span>
          <span className="font-mono text-emerald-400 font-bold">Port 8080</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          HttpOnly Token Relay Active
        </div>
      </div>
    </aside>
  );
}
