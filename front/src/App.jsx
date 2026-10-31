import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ImpersonationBanner from './components/layout/ImpersonationBanner';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PermissionsPage from './pages/PermissionsPage';
import DashboardPage from './pages/DashboardPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import ClaimsModal from './pages/ClaimsModal';
import { iamApi, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from './api/iamService';
import { TenantThemeProvider } from './context/TenantThemeContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('users');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getStoredToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [tenants, setTenants] = useState([]);
  const [activeTenantId, setActiveTenantId] = useState(() => localStorage.getItem('iam_active_tenant_id') || '');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [isClaimsModalOpen, setIsClaimsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // Load live data from Backend APIs when authenticated
  const loadBackendData = async (targetTenantId = activeTenantId) => {
    setLoadingData(true);
    try {
      const [tenantsList, usersData, rolesData, permsData] = await Promise.all([
        iamApi.getTenants().catch((err) => {
          console.warn('Failed to load tenants:', err);
          return [];
        }),
        iamApi.getUsers(targetTenantId || undefined).catch((err) => {
          console.warn('Failed to load users from backend:', err);
          return [];
        }),
        iamApi.getRoles(targetTenantId || undefined).catch((err) => {
          console.warn('Failed to load roles from backend:', err);
          return [];
        }),
        iamApi.getPermissions(targetTenantId || undefined).catch((err) => {
          console.warn('Failed to load permissions from backend:', err);
          return [];
        })
      ]);

      setTenants(tenantsList);
      if (tenantsList.length > 0 && !targetTenantId) {
        const firstId = String(tenantsList[0].id);
        setActiveTenantId(firstId);
        localStorage.setItem('iam_active_tenant_id', firstId);
      }
      setUsers(usersData);
      setRoles(rolesData);
      setPermissionGroups(permsData);
    } catch (err) {
      console.error('Error loading backend data', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTenantSwitch = (newTenantId) => {
    setActiveTenantId(newTenantId);
    localStorage.setItem('iam_active_tenant_id', String(newTenantId));
    setActiveTab('dashboard'); // State reset per plan: jump to dashboard cleanly
    loadBackendData(newTenantId);
    showToast(`مستأجر فعال با موفقیت تغییر یافت.`);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBackendData();
    }
  }, [isAuthenticated]);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`خوش آمدید! ورود به عنوان ${user.displayName} با موفقیت انجام شد.`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await iamApi.logout();
    } catch (e) {
      console.warn('Logout API error', e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
    setPermissionGroups([]);
    showToast('با موفقیت از حساب کاربری خارج شدید.');
  };

  // Handle impersonation (RFC 8693)
  const handleImpersonate = async (targetUsername) => {
    try {
      const updatedUser = await iamApi.impersonate(targetUsername);
      setCurrentUser(updatedUser);
      showToast(`جعل هویت با موفقیت فعال گردید. محیط کاربری ${targetUsername} در تب جدید باز شد.`);
    } catch (err) {
      alert(`خطا در جعل هویت: ${err.message}`);
    }
  };

  // Handle revert impersonation
  const handleRevert = async () => {
    try {
      const reverted = await iamApi.revertImpersonation();
      setCurrentUser(reverted);
      showToast('نشست با موفقیت به حساب اصلی مدیر بازگردانده شد.');
    } catch (err) {
      alert(`خطا در بازگشت از جعل هویت: ${err.message}`);
    }
  };

  // Handle user status toggle via Backend API
  const handleUpdateUser = async (userToUpdate) => {
    try {
      await iamApi.toggleUserStatus(userToUpdate.id, userToUpdate.enabled);
      const refreshedUsers = await iamApi.getUsers();
      setUsers(refreshedUsers);
      showToast(`وضعیت کاربر ${userToUpdate.username} در پایگاه داده به‌روزرسانی شد.`);
    } catch (err) {
      alert(`خطا در به‌روزرسانی وضعیت کاربر: ${err.message}`);
    }
  };

  // Handle create user via Backend API
  const handleCreateUser = async (newUserData) => {
    try {
      await iamApi.createUser(newUserData);
      const refreshedUsers = await iamApi.getUsers();
      setUsers(refreshedUsers);
      showToast(`کاربر جدید ${newUserData.username} با موفقیت در پایگاه داده ایجاد گردید.`);
    } catch (err) {
      alert(`خطا در ایجاد کاربر: ${err.message}`);
    }
  };

  // Handle create role via Backend API
  const handleCreateRole = async (newRoleData) => {
    try {
      await iamApi.createRole(newRoleData);
      const refreshedRoles = await iamApi.getRoles();
      setRoles(refreshedRoles);
      showToast(`نقش سفارشی ${newRoleData.name} با موفقیت در بک‌اند ثبت شد.`);
    } catch (err) {
      alert(`خطا در ایجاد نقش: ${err.message}`);
    }
  };

  // If not authenticated, render Login Page
  if (!isAuthenticated || !currentUser) {
    return (
      <TenantThemeProvider currentUser={currentUser}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </TenantThemeProvider>
    );
  }

  return (
    <TenantThemeProvider currentUser={currentUser}>
      <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans antialiased" dir="rtl">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 left-5 z-50 bg-cyan-900 border border-cyan-700 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>{notification}</span>
          </div>
        )}

        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* RFC 8693 Impersonation Top Banner */}
          <ImpersonationBanner
            isImpersonated={currentUser?.isImpersonated}
            targetUser={currentUser?.targetUsername || currentUser?.username}
            actor={currentUser?.actor}
            onRevert={handleRevert}
          />

          {/* Global Navigation Header with Logout & Tenant Switcher */}
          <Header
            currentUser={currentUser}
            tenants={tenants}
            activeTenantId={activeTenantId}
            onTenantSwitch={handleTenantSwitch}
            onOpenClaimsModal={() => setIsClaimsModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Tab Pages */}
          <main className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                users={users}
                roles={roles}
                currentUser={currentUser}
                onSelectTab={setActiveTab}
              />
            )}

            {activeTab === 'users' && (
              <UsersPage
                users={users}
                currentUser={currentUser}
                onImpersonate={handleImpersonate}
                onUpdateUser={handleUpdateUser}
                onCreateUser={handleCreateUser}
              />
            )}

            {activeTab === 'roles' && (
              <RolesPage
                roles={roles}
                permissionGroups={permissionGroups}
                currentUser={currentUser}
                onCreateRole={handleCreateRole}
              />
            )}

            {activeTab === 'permissions' && (
              <PermissionsPage
                permissionGroups={permissionGroups}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'audit' && (
              <AuditPage currentUser={currentUser} />
            )}

            {activeTab === 'settings' && (
              <SettingsPage currentUser={currentUser} />
            )}
          </main>
        </div>

        {/* Claims Modal */}
        {isClaimsModalOpen && (
          <ClaimsModal
            currentUser={currentUser}
            onClose={() => setIsClaimsModalOpen(false)}
          />
        )}
      </div>
    </TenantThemeProvider>
  );
}
