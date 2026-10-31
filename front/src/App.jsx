import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ClaimsModal from './pages/ClaimsModal';
import {
  iamApi,
  getStoredToken,
  getStoredUser,
  getStoredActiveTenant,
  setStoredActiveTenant
} from './api/iamService';
import { TenantThemeProvider } from './context/TenantThemeContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getStoredToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [tenants, setTenants] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeTenantId, setActiveTenantId] = useState(() => getStoredActiveTenant() || '10');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isClaimsModalOpen, setIsClaimsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadBackendData = async (targetTenantId = activeTenantId) => {
    const resolvedTid = Number(targetTenantId || currentUser?.tenantId || 10);
    try {
      const [
        tenantsList,
        modulesList,
        usersData,
        rolesData,
        permsData,
        logsData,
        sessionsData
      ] = await Promise.all([
        iamApi.getTenants().catch(() => []),
        iamApi.getModules().catch(() => []),
        iamApi.getUsers(resolvedTid).catch(() => []),
        iamApi.getRoles(resolvedTid).catch(() => []),
        iamApi.getPermissions(resolvedTid).catch(() => []),
        iamApi.getAuditLogs(currentUser?.role === 'SUPER_ADMIN' ? null : resolvedTid).catch(() => []),
        iamApi.getMySessions().catch(() => [])
      ]);

      setTenants(tenantsList);
      setModules(modulesList);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissionGroups(permsData);
      setAuditLogs(logsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error loading backend data', err);
    }
  };

  const handleTenantSwitch = (newTenantId) => {
    const strId = String(newTenantId);
    setActiveTenantId(strId);
    setStoredActiveTenant(strId);
    loadBackendData(strId);
    const found = tenants.find((t) => String(t.id) === strId);
    showToast(`قلمرو مدیریت به مستأجر «${found ? found.name : `#${strId}`}» تغییر یافت.`);
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const initialTid =
        currentUser.role === 'SUPER_ADMIN'
          ? getStoredActiveTenant() || '10'
          : String(currentUser.tenantId || 10);
      setActiveTenantId(initialTid);
      loadBackendData(initialTid);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const initialTid = user.role === 'SUPER_ADMIN' ? '10' : String(user.tenantId || 10);
    setActiveTenantId(initialTid);
    setStoredActiveTenant(initialTid);
    showToast(`خوش آمدید! ورود به درگاه admin.asan.com با نقش ${user.role} انجام شد.`);
  };

  const handleLogout = async () => {
    try {
      await iamApi.logout();
    } catch {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
    setPermissionGroups([]);
    showToast('با موفقیت از درگاه یکپارچه admin.asan.com خارج شدید.');
  };

  // --- Impersonation Handlers ---
  const handleImpersonate = async (targetUsername) => {
    try {
      const updatedUser = await iamApi.impersonate(targetUsername);
      setCurrentUser(updatedUser);
      await loadBackendData(activeTenantId);
      showToast(`جعل هویت RFC 8693 برای کاربر @${targetUsername} فعال شد.`);
    } catch (err) {
      showToast(err.message, 'error');
      await loadBackendData(activeTenantId);
    }
  };

  const handleRevert = async () => {
    try {
      const reverted = await iamApi.revertImpersonation();
      setCurrentUser(reverted);
      await loadBackendData(activeTenantId);
      showToast('نشست به حساب ادمین اصلی در admin.asan.com بازگردانده شد.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- User & Access Handlers ---
  const handleUpdateUserStatus = async (userToUpdate) => {
    try {
      await iamApi.toggleUserStatus(userToUpdate.id, userToUpdate.enabled);
      await loadBackendData(activeTenantId);
      showToast(`وضعیت حساب @${userToUpdate.username} بروزرسانی شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUserAccess = async (userId, accessPayload) => {
    try {
      await iamApi.updateUserAccess(userId, accessPayload);
      await loadBackendData(activeTenantId);
      showToast('نقش‌ها و پرمیژن‌های مستقیم کاربر با موفقیت ذخیره شد.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateUser = async (newUserData) => {
    try {
      await iamApi.createUser(newUserData);
      await loadBackendData(activeTenantId);
      showToast(`کاربر جدید @${newUserData.username} با موفقیت ایجاد شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Role & Group Handlers ---
  const handleCreateRole = async (newRoleData) => {
    try {
      await iamApi.createRole(newRoleData);
      await loadBackendData(activeTenantId);
      showToast(`نقش سفارشی ${newRoleData.name} ایجاد شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateRole = async (roleId, roleData) => {
    try {
      await iamApi.updateRole(roleId, roleData);
      await loadBackendData(activeTenantId);
      showToast(`پرمیژن‌های نقش ${roleData.code} بروزرسانی شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAttachGroupToRole = async (roleId, groupId) => {
    try {
      const res = await iamApi.attachGroupToRole(roleId, groupId);
      await loadBackendData(activeTenantId);
      showToast(
        res.reason
          ? `گروه متصل شد (${res.added} مجوز اضافه شد · ${res.reason})`
          : `کلیه پرمیژن‌های مجاز این گروه (${res.added} مجوز) به نقش متصل شد.`
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDetachGroupFromRole = async (roleId, groupId) => {
    try {
      const res = await iamApi.detachGroupFromRole(roleId, groupId);
      await loadBackendData(activeTenantId);
      showToast(`پرمیژن‌های گروه (${res.removed} مجوز) از نقش جدا شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Super Admin Tenant Entitlement Handlers ---
  const handleGrantPermission = async (tenantId, permId, permCode) => {
    try {
      await iamApi.grantPermissionToTenant(tenantId, permId);
      await loadBackendData(tenantId);
      showToast(`پرمیژن ${permCode} به مستأجر #${tenantId} اعطا شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokePermission = async (tenantId, permId, permCode) => {
    try {
      await iamApi.revokePermissionFromTenant(tenantId, permId);
      await loadBackendData(tenantId);
      showToast(`پرمیژن ${permCode} از مستأجر #${tenantId} و نقش‌های آن سلب شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGrantGroup = async (tenantId, groupId, groupCode) => {
    try {
      await iamApi.grantGroupToTenant(tenantId, groupId);
      await loadBackendData(tenantId);
      showToast(`تمامی پرمیژن‌های ماژول ${groupCode} به مستأجر #${tenantId} اعطا شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeGroup = async (tenantId, groupId, groupCode) => {
    try {
      await iamApi.revokeGroupFromTenant(tenantId, groupId);
      await loadBackendData(tenantId);
      showToast(`ماژول ${groupCode} از مستأجر #${tenantId} سلب گردید.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreatePermission = async (payload) => {
    try {
      await iamApi.createPermission(payload);
      await loadBackendData(activeTenantId);
      showToast(`پرمیژن جدید ${payload.code} به کاتالوگ اضافه شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Tenant Lifecycle & Cloning Handlers ---
  const handleCreateTenant = async (payload) => {
    try {
      const created = await iamApi.createTenant(payload);
      setActiveTenantId(String(created.id));
      setStoredActiveTenant(String(created.id));
      await loadBackendData(created.id);
      showToast(`مستأجر جدید «${created.name}» و حساب ادمین @${created.adminUsername} ایجاد شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateTenant = async (tenantId, payload) => {
    try {
      await iamApi.updateTenant(tenantId, payload);
      await loadBackendData(activeTenantId);
      showToast('پیکربندی و ماژول‌های مستأجر بروزرسانی شد.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCloneTenant = async (sourceTenantId, payload) => {
    try {
      const cloned = await iamApi.cloneTenant(sourceTenantId, payload);
      setActiveTenantId(String(cloned.id));
      setStoredActiveTenant(String(cloned.id));
      await loadBackendData(cloned.id);
      showToast(`مستأجر «${cloned.name}» با موفقیت از روی مستأجر #${sourceTenantId} کلون شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await iamApi.revokeSession(sessionId);
      await loadBackendData(activeTenantId);
      showToast(`نشست #${sessionId} باطل شد.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <TenantThemeProvider currentUser={currentUser}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </TenantThemeProvider>
    );
  }

  const activeTenantObj =
    tenants.find((t) => String(t.id) === String(activeTenantId)) || tenants[0] || null;

  return (
    <TenantThemeProvider currentUser={currentUser}>
      <AdminDashboard
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        tenants={tenants}
        modules={modules}
        activeTenantId={activeTenantId}
        activeTenantObj={activeTenantObj}
        users={users}
        roles={roles}
        permissionGroups={permissionGroups}
        auditLogs={auditLogs}
        sessions={sessions}
        notification={notification}
        onTenantSwitch={handleTenantSwitch}
        onOpenClaimsModal={() => setIsClaimsModalOpen(true)}
        onLogout={handleLogout}
        onImpersonate={handleImpersonate}
        onRevert={handleRevert}
        onUpdateUserStatus={handleUpdateUserStatus}
        onUpdateUserAccess={handleUpdateUserAccess}
        onCreateUser={handleCreateUser}
        onCreateRole={handleCreateRole}
        onUpdateRole={handleUpdateRole}
        onAttachGroupToRole={handleAttachGroupToRole}
        onDetachGroupFromRole={handleDetachGroupFromRole}
        onGrantPermission={handleGrantPermission}
        onRevokePermission={handleRevokePermission}
        onGrantGroup={handleGrantGroup}
        onRevokeGroup={handleRevokeGroup}
        onCreatePermission={handleCreatePermission}
        onCreateTenant={handleCreateTenant}
        onUpdateTenant={handleUpdateTenant}
        onCloneTenant={handleCloneTenant}
        onRevokeSession={handleRevokeSession}
      />

      {isClaimsModalOpen && (
        <ClaimsModal
          currentUser={currentUser}
          activeTenantId={activeTenantId}
          onClose={() => setIsClaimsModalOpen(false)}
        />
      )}
    </TenantThemeProvider>
  );
}
