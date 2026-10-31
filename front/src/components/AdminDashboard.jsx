import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Key,
  ShieldCheck,
  Users,
  ShieldAlert,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import ImpersonationBanner from './layout/ImpersonationBanner';
import DashboardPage from '../pages/DashboardPage';
import TenantsPage from '../pages/TenantsPage';
import PermissionsPage from '../pages/PermissionsPage';
import RolesPage from '../pages/RolesPage';
import UsersPage from '../pages/UsersPage';
import AuditPage from '../pages/AuditPage';
import SettingsPage from '../pages/SettingsPage';

export default function AdminDashboard({
  activeTab,
  onSelectTab,
  currentUser,
  tenants = [],
  modules = [],
  activeTenantId,
  activeTenantObj,
  users = [],
  userGroups = [],
  roles = [],
  permissionGroups = [],
  auditLogs = [],
  sessions = [],
  notification,
  onTenantSwitch,
  onOpenClaimsModal,
  onLogout,
  onImpersonate,
  onImpersonateTenant,
  onRevert,
  onUpdateUserStatus,
  onUpdateUserAccess,
  onCreateUser,
  onDeleteUser,
  onCreateUserGroup,
  onAssignPermissionToUserGroup,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onAttachGroupToRole,
  onDetachGroupFromRole,
  onSetTenantDefaultRole,
  onGrantPermission,
  onRevokePermission,
  onGrantGroup,
  onRevokeGroup,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission,
  onCreatePermissionGroup,
  onDeletePermissionGroup,
  onCreateTenant,
  onUpdateTenant,
  onDeleteTenant,
  onCloneTenant,
  onRevokeSession,
  onRevokeAllOtherSessions
}) {
  const totalCatalogPerms = permissionGroups.reduce(
    (acc, g) => acc + (g.permissions ? g.permissions.length : 0),
    0
  );
  const entitledPermsCount = permissionGroups.reduce(
    (acc, g) =>
      acc + (g.permissions ? g.permissions.filter((p) => p.entitled !== false).length : 0),
    0
  );

  const quickTabs = [
    { id: 'dashboard', label: 'پیشخوان و معماری', icon: LayoutDashboard },
    { id: 'tenants', label: `مستأجرین و کلون (${tenants.length})`, icon: Building2 },
    {
      id: 'permissions',
      label: `استحقاق و پرمیژن‌ها (${entitledPermsCount}/${totalCatalogPerms || 14})`,
      icon: Key
    },
    { id: 'roles', label: `نقش‌ها و گروه‌ها (${roles.length})`, icon: ShieldCheck },
    { id: 'users', label: `کاربران و مجوزها (${users.length})`, icon: Users },
    { id: 'audit', label: `ممیزی و نشست‌ها (${auditLogs.length})`, icon: ShieldAlert },
    { id: 'settings', label: 'سیاست‌های ۲FA', icon: Settings }
  ];

  return (
    <div className="flex min-h-screen bg-theme-canvas text-slate-900 font-sans antialiased" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold border flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-theme-sidebar border-theme-sidebar text-stone-100'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        currentUser={currentUser}
        activeTenant={activeTenantObj}
        counts={{
          tenants: tenants.length,
          permissions: `${entitledPermsCount}/${totalCatalogPerms || 14}`,
          roles: roles.length,
          users: users.length,
          audit: auditLogs.length
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner
          isImpersonated={currentUser?.isImpersonated}
          targetUser={currentUser?.targetUsername || currentUser?.username}
          actor={currentUser?.actor}
          onRevert={onRevert}
        />

        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          tenants={tenants}
          activeTenantId={activeTenantId}
          onTenantSwitch={onTenantSwitch}
          onOpenClaimsModal={onOpenClaimsModal}
          onLogout={onLogout}
        />

        {/* Centralized Segmented Navigation Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 overflow-x-auto">
            {quickTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                      : 'bg-theme-card border-slate-200/80 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-indigo-600'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Workspace Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              users={users}
              roles={roles}
              tenants={tenants}
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
              roles={roles}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onSelectTenant={onTenantSwitch}
              onCreateTenant={onCreateTenant}
              onUpdateTenant={onUpdateTenant}
              onDeleteTenant={onDeleteTenant}
              onCloneTenant={onCloneTenant}
              onSetTenantDefaultRole={onSetTenantDefaultRole}
              onImpersonateTenant={onImpersonateTenant}
              onManageTenantPermissions={(tid) => {
                onTenantSwitch(String(tid));
                onSelectTab('permissions');
              }}
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
              onUpdatePermission={onUpdatePermission}
              onDeletePermission={onDeletePermission}
              onCreatePermissionGroup={onCreatePermissionGroup}
              onDeletePermissionGroup={onDeletePermissionGroup}
            />
          )}

          {activeTab === 'roles' && (
            <RolesPage
              roles={roles}
              tenants={tenants}
              permissionGroups={permissionGroups}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onCreateRole={onCreateRole}
              onUpdateRole={onUpdateRole}
              onDeleteRole={onDeleteRole}
              onAttachGroupToRole={onAttachGroupToRole}
              onDetachGroupFromRole={onDetachGroupFromRole}
              onSetTenantDefaultRole={onSetTenantDefaultRole}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              users={users}
              userGroups={userGroups}
              roles={roles}
              permissionGroups={permissionGroups}
              tenants={tenants}
              activeTenantId={activeTenantId}
              currentUser={currentUser}
              onImpersonate={onImpersonate}
              onUpdateUser={onUpdateUserStatus}
              onUpdateUserAccess={onUpdateUserAccess}
              onCreateUser={onCreateUser}
              onDeleteUser={onDeleteUser}
              onCreateUserGroup={onCreateUserGroup}
              onAssignPermissionToUserGroup={onAssignPermissionToUserGroup}
            />
          )}

          {activeTab === 'audit' && (
            <AuditPage
              auditLogs={auditLogs}
              sessions={sessions}
              currentUser={currentUser}
              onRevokeSession={onRevokeSession}
              onRevokeAllOtherSessions={onRevokeAllOtherSessions}
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
