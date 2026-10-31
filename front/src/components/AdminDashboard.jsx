import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Globe,
  Layers
} from 'lucide-react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import ImpersonationBanner from './layout/ImpersonationBanner';
import DashboardPage from '../pages/DashboardPage';
import TenantsPage from '../pages/TenantsPage';
import UsersPage from '../pages/UsersPage';
import PermissionsPage from '../pages/PermissionsPage';
import RolesPage from '../pages/RolesPage';
import AuditPage from '../pages/AuditPage';
import SettingsPage from '../pages/SettingsPage';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

/**
 * Centralized Admin Dashboard Component (admin.asan.com)
 * Unifies Tenant Management, User Management, and System-Wide Permission Settings
 * under a single host-bound governance shell with a synchronized navigation menu.
 */
export default function AdminDashboard({
  activeTab,
  onSelectTab,
  currentUser,
  tenants = [],
  modules = [],
  activeTenantId,
  activeTenantObj,
  users = [],
  roles = [],
  permissionGroups = [],
  auditLogs = [],
  sessions = [],
  notification,
  onTenantSwitch,
  onOpenClaimsModal,
  onLogout,
  onImpersonate,
  onRevert,
  onUpdateUserStatus,
  onUpdateUserAccess,
  onCreateUser,
  onCreateRole,
  onUpdateRole,
  onAttachGroupToRole,
  onDetachGroupFromRole,
  onGrantPermission,
  onRevokePermission,
  onGrantGroup,
  onRevokeGroup,
  onCreatePermission,
  onCreateTenant,
  onUpdateTenant,
  onCloneTenant,
  onRevokeSession
}) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const totalCatalogPerms = permissionGroups.reduce(
    (acc, g) => acc + (g.permissions ? g.permissions.length : 0),
    0
  );
  const entitledPermsCount = permissionGroups.reduce(
    (acc, g) =>
      acc + (g.permissions ? g.permissions.filter((p) => p.entitled !== false).length : 0),
    0
  );

  // Core Pillars defined for centralized switching
  const primaryNavigationTabs = [
    {
      id: 'dashboard',
      label: 'مرکز فرماندهی (Overview)',
      shortDesc: 'نمای یکپارچه سامانه',
      icon: LayoutDashboard,
      metric: UNIFIED_ADMIN_HOST
    },
    {
      id: 'tenants',
      label: 'مدیریت مستأجرین (Tenant Management)',
      shortDesc: isSuperAdmin ? 'ایجاد، کلون و ماژول‌های مستأجر' : 'مشخصات و ماژول‌های مستأجر جاری',
      icon: Building2,
      metric: `${tenants.length} مستأجر`
    },
    {
      id: 'users',
      label: 'مدیریت کاربران (User Management)',
      shortDesc: 'حساب‌ها، نقش‌ها و مجوزهای فردی',
      icon: Users,
      metric: `${users.length} کاربر`
    },
    {
      id: 'permissions',
      label: 'تنظیمات پرمیژن‌های سراسری (System Permissions)',
      shortDesc: isSuperAdmin ? 'کاتالوگ سراسری و استحقاق مستأجرین' : 'استحقاق پرمیژن‌های مستأجر',
      icon: Key,
      metric: `${entitledPermsCount}/${totalCatalogPerms || 14} مجوز`
    },
    {
      id: 'roles',
      label: 'ماتریس نقش‌ها (Roles)',
      shortDesc: 'اتصال گروه‌های پرمیژن به نقش',
      icon: ShieldCheck,
      metric: `${roles.length} نقش`
    },
    {
      id: 'audit',
      label: 'ممیزی و نشست‌ها (Audit)',
      shortDesc: 'لاگ‌های RFC 8693 و نشست‌های فعال',
      icon: ShieldAlert,
      metric: `${auditLogs.length} رویداد`
    },
    {
      id: 'settings',
      label: 'سیاست‌های ۲FA',
      shortDesc: 'تنظیمات امنیتی درگاه',
      icon: Settings,
      metric: 'OTP/2FA'
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 font-sans antialiased" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium border ${
            notification.type === 'error'
              ? 'bg-rose-950 border-rose-700 text-rose-100'
              : 'bg-slate-900 border-sky-500/60 text-slate-100'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Right-Hand Persistent Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        currentUser={currentUser}
        activeTenant={activeTenantObj}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* RFC 8693 Impersonation Banner */}
        <ImpersonationBanner
          isImpersonated={currentUser?.isImpersonated}
          targetUser={currentUser?.targetUsername || currentUser?.username}
          actor={currentUser?.actor}
          onRevert={onRevert}
        />

        {/* Top Bar Contract (Breadcrumb, Tenant Scope Switcher, JWT/Session Action) */}
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          tenants={tenants}
          activeTenantId={activeTenantId}
          onTenantSwitch={onTenantSwitch}
          onOpenClaimsModal={onOpenClaimsModal}
          onLogout={onLogout}
        />

        {/* Centralized Admin Navigation Bar (Quick Workspace Switcher) */}
        <div className="bg-[#111827]/90 border-b border-slate-800/80 px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Segmented Navigation Menu */}
            <nav
              aria-label="منوی ناوبری متمرکز مدیریت"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 no-scrollbar"
            >
              {primaryNavigationTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                      isActive
                        ? 'bg-sky-600/15 border-sky-500/50 text-sky-300 font-semibold'
                        : 'bg-[#0b0f17]/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums pr-1.5 border-r ${
                        isActive
                          ? 'text-sky-300 border-sky-500/40'
                          : 'text-slate-500 border-slate-800'
                      }`}
                    >
                      {tab.metric}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Active Tenant & Host Context Readout */}
            <div className="hidden 2xl:flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>قلمرو فعال:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeTenantObj ? `${activeTenantObj.name} (${activeTenantObj.code})` : `Tenant #${activeTenantId}`}
              </span>
              <span className="text-slate-700">·</span>
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-sky-400">{UNIFIED_ADMIN_HOST}</span>
            </div>
          </div>
        </div>

        {/* Active Workspace Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              users={users}
              roles={roles}
              tenants={tenants}
              modules={modules}
              permissionGroups={permissionGroups}
              auditLogs={auditLogs}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onSelectTab={onSelectTab}
              onTenantSwitch={onTenantSwitch}
            />
          )}

          {activeTab === 'tenants' && (
            <TenantsPage
              tenants={tenants}
              modules={modules}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onSelectTenant={onTenantSwitch}
              onCreateTenant={onCreateTenant}
              onUpdateTenant={onUpdateTenant}
              onCloneTenant={onCloneTenant}
              onManageTenantPermissions={(tid) => {
                onTenantSwitch(String(tid));
                onSelectTab('permissions');
              }}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              users={users}
              roles={roles}
              permissionGroups={permissionGroups}
              tenants={tenants}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onImpersonate={onImpersonate}
              onUpdateUser={onUpdateUserStatus}
              onUpdateUserAccess={onUpdateUserAccess}
              onCreateUser={onCreateUser}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionsPage
              permissionGroups={permissionGroups}
              tenants={tenants}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onTenantSwitch={onTenantSwitch}
              onGrantPermission={onGrantPermission}
              onRevokePermission={onRevokePermission}
              onGrantGroup={onGrantGroup}
              onRevokeGroup={onRevokeGroup}
              onCreatePermission={onCreatePermission}
            />
          )}

          {activeTab === 'roles' && (
            <RolesPage
              roles={roles}
              permissionGroups={permissionGroups}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onCreateRole={onCreateRole}
              onUpdateRole={onUpdateRole}
              onAttachGroupToRole={onAttachGroupToRole}
              onDetachGroupFromRole={onDetachGroupFromRole}
            />
          )}

          {activeTab === 'audit' && (
            <AuditPage
              auditLogs={auditLogs}
              sessions={sessions}
              currentUser={currentUser}
              onRevokeSession={onRevokeSession}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              activeTenant={activeTenantObj}
              onUpdateTenant={onUpdateTenant}
            />
          )}
        </main>
      </div>
    </div>
  );
}
