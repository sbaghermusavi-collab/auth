/**
 * Unified IAM & BFF Admin Service for admin.asan.com
 * Connects both Super Admin and Tenant Admins to:
 * - /api/auth/login, /api/auth/send-otp, /api/auth/verify-2fa
 * - /api/admin/tenants, /api/admin/tenants/:id/clone, /api/admin/modules
 * - /api/admin/tenants/:tenantId/permissions/:permissionId (Grant / Revoke)
 * - /api/admin/tenants/:tenantId/permission-groups/:groupId (Grant / Revoke Group)
 * - /api/admin/users, /api/tenant-admin/users, /api/admin/users/:id/roles
 * - /api/admin/roles, /api/admin/roles/:roleId/groups/:groupId
 * - /api/admin/impersonate, /api/admin/impersonate/revert
 * - /api/admin/audit-logs, /api/reports/users/:username/logs, /api/sessions/my
 */

const TOKEN_KEY = 'iam_access_token';
const USER_KEY = 'iam_current_user';
const ACTIVE_TENANT_KEY = 'iam_active_tenant_id';
export const UNIFIED_ADMIN_HOST = 'admin.asan.com';

export function getStoredActiveTenant() {
  return localStorage.getItem(ACTIVE_TENANT_KEY) || sessionStorage.getItem(ACTIVE_TENANT_KEY) || null;
}

export function setStoredActiveTenant(tenantId) {
  if (tenantId) {
    localStorage.setItem(ACTIVE_TENANT_KEY, String(tenantId));
    sessionStorage.setItem(ACTIVE_TENANT_KEY, String(tenantId));
  } else {
    localStorage.removeItem(ACTIVE_TENANT_KEY);
    sessionStorage.removeItem(ACTIVE_TENANT_KEY);
  }
}

export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function setStoredToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'access_token=; path=/; Max-Age=0';
  }
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user) {
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

function getAuthHeaders(overrideTenantId) {
  const token = getStoredToken();
  const user = getStoredUser();
  const activeTenant = overrideTenantId || getStoredActiveTenant();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Forwarded-Host': UNIFIED_ADMIN_HOST
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeTenant) {
    headers['X-Active-Tenant-Id'] = String(activeTenant);
    headers['X-Tenant-Id'] = String(activeTenant);
  } else if (user && user.tenantId) {
    headers['X-Active-Tenant-Id'] = String(user.tenantId);
    headers['X-Tenant-Id'] = String(user.tenantId);
  }
  if (user) {
    if (user.role) headers['X-Actor-Role'] = user.role;
    if (user.tenantId) headers['X-Actor-Tenant-Id'] = String(user.tenantId);
  }
  return headers;
}

export const iamApi = {
  async login(identifier, password) {
    const formData = new URLSearchParams();
    formData.append('identifier', identifier);
    formData.append('password', password);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-Host': UNIFIED_ADMIN_HOST
      },
      body: formData.toString(),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'خطا در نام کاربری یا رمز عبور');
    }
    return data;
  },

  async sendOtp(authSessionId, phone) {
    const formData = new URLSearchParams();
    formData.append('authSessionId', authSessionId);
    formData.append('phone', phone);
    formData.append('deliveryMethod', 'sms');

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-Host': UNIFIED_ADMIN_HOST
      },
      body: formData.toString(),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'خطا در ارسال کد تایید');
    }
    return data;
  },

  async verify2fa(authSessionId, code = '999999') {
    const formData = new URLSearchParams();
    formData.append('authSessionId', authSessionId);
    formData.append('code', code);

    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-Host': UNIFIED_ADMIN_HOST
      },
      body: formData.toString(),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'کد تایید نامعتبر است');
    }

    const token = data.accessToken;
    if (!token) {
      throw new Error('توکن احراز هویت دریافت نشد');
    }

    setStoredToken(token);
    const jwtClaims = parseJwt(token) || {};

    const isSuper =
      jwtClaims.preferred_username === 'superadmin' ||
      jwtClaims.sub === '999' ||
      jwtClaims.tenant_numeric_id === 1 ||
      (Array.isArray(jwtClaims.roles) && jwtClaims.roles.includes('SUPER_ADMIN'));

    const resolvedTenantId = jwtClaims.tenant_numeric_id || (isSuper ? 1 : 10);
    const resolvedTenantCode = jwtClaims.tenant_id || (isSuper ? 'default' : 'smslocal');

    const userObj = {
      username: jwtClaims.preferred_username || jwtClaims.username || 'admin',
      displayName: isSuper
        ? 'راهبر کل پلتفرم (Super Admin)'
        : `مدیر مستأجر (${jwtClaims.preferred_username || 'admin'})`,
      tenantId: resolvedTenantId,
      tenantName: resolvedTenantCode,
      host: UNIFIED_ADMIN_HOST,
      role: isSuper ? 'SUPER_ADMIN' : 'TENANT_ADMIN',
      roles: jwtClaims.realm_access?.roles || jwtClaims.roles || (isSuper ? ['SUPER_ADMIN'] : ['TENANT_ADMIN']),
      permissions: jwtClaims.permissions || [],
      isImpersonated: false,
      actor: null,
      rawClaims: jwtClaims
    };

    setStoredUser(userObj);
    setStoredActiveTenant(isSuper ? 10 : resolvedTenantId);
    return { token, user: userObj };
  },

  async logout() {
    try {
      await fetch('/api/v1/permission/logout', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch {}

    try {
      await fetch('/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch {}

    setStoredToken(null);
    setStoredUser(null);
    return { loggedOut: true };
  },

  // --- Tenants & Modules (Super Admin) ---
  async getTenants() {
    const res = await fetch('/api/admin/tenants', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async getModules() {
    const res = await fetch('/api/admin/modules', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async createTenant(payload) {
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در ایجاد مستأجر');
    return data;
  },

  async updateTenant(tenantId, payload) {
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در ویرایش مستأجر');
    return data;
  },

  async cloneTenant(sourceTenantId, payload) {
    const res = await fetch(`/api/admin/tenants/${sourceTenantId}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...payload, sourceTenantId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در کلون کردن مستأجر');
    return data;
  },

  // --- Users & User Permissions ---
  async getUsers(tenantId) {
    const currentUser = getStoredUser();
    const isSuper = currentUser?.role === 'SUPER_ADMIN';
    const url = isSuper
      ? tenantId && Number(tenantId) !== 0
        ? `/api/admin/users?tenantId=${tenantId}`
        : '/api/admin/users'
      : '/api/tenant-admin/users';

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`خطای دریافت کاربران (${res.status})`);
    const data = await res.json();
    return data.map((u) => ({
      ...u,
      status: u.enabled !== false ? 'ACTIVE' : 'BLOCKED',
      enabled: u.enabled !== false
    }));
  },

  async createUser(userData) {
    const currentUser = getStoredUser();
    const isSuper = currentUser?.role === 'SUPER_ADMIN';
    const endpoint = isSuper ? '/api/admin/users' : '/api/tenant-admin/users';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(userData.tenantId),
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در ایجاد کاربر');
    return {
      ...data,
      status: data.enabled !== false ? 'ACTIVE' : 'BLOCKED',
      enabled: data.enabled !== false
    };
  },

  async toggleUserStatus(userId, currentEnabled) {
    const currentUser = getStoredUser();
    const isSuper = currentUser?.role === 'SUPER_ADMIN';
    const endpoint = isSuper
      ? `/api/admin/users/${userId}/status`
      : `/api/tenant-admin/users/${userId}/status`;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled: !currentEnabled }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در تغییر وضعیت کاربر');
    return data;
  },

  async updateUserAccess(userId, { roles, directPermissions }) {
    const currentUser = getStoredUser();
    const isSuper = currentUser?.role === 'SUPER_ADMIN';
    const endpoint = isSuper
      ? `/api/admin/users/${userId}/roles`
      : `/api/tenant-admin/users/${userId}/roles`;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roles, directPermissions }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در بروزرسانی دسترسی‌های کاربر');
    return data;
  },

  // --- Roles & One-Click Permission Groups ---
  async getRoles(tenantId) {
    const url = tenantId ? `/api/admin/roles?tenantId=${tenantId}` : '/api/admin/roles';
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('خطا در واکشی نقش‌ها');
    const data = await res.json();
    return data.map((r) => ({
      ...r,
      isSystem: r.isDefault || r.tenantId === 1 || r.code === 'TENANT_ADMIN' || r.code === 'SUPER_ADMIN',
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      groupCodes: Array.isArray(r.groupCodes) ? r.groupCodes : []
    }));
  },

  async createRole(roleData) {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: getAuthHeaders(roleData.tenantId),
      body: JSON.stringify(roleData),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در ایجاد نقش');
    return data;
  },

  async updateRole(roleId, roleData) {
    const res = await fetch(`/api/admin/roles/${roleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(roleData.tenantId),
      body: JSON.stringify(roleData),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در بروزرسانی نقش');
    return data;
  },

  async attachGroupToRole(roleId, groupId) {
    const res = await fetch(`/api/admin/roles/${roleId}/groups/${groupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در اتصال گروه دسترسی به نقش');
    return data;
  },

  async detachGroupFromRole(roleId, groupId) {
    const res = await fetch(`/api/admin/roles/${roleId}/groups/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در جداسازی گروه دسترسی از نقش');
    return data;
  },

  // --- Tenant Permissions & Entitlements ---
  async getPermissions(tenantId = 10) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/permissions`, {
      method: 'GET',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('خطا در دریافت کاتالوگ پرمیژن‌ها');
    const data = await res.json();
    return data.catalog || [];
  },

  async grantPermissionToTenant(tenantId, permissionId) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/permissions/${permissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در اعطای پرمیژن به مستأجر');
    return data;
  },

  async revokePermissionFromTenant(tenantId, permissionId) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در سلب پرمیژن از مستأجر');
    return data;
  },

  async grantGroupToTenant(tenantId, groupId) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/permission-groups/${groupId}`, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در اعطای ماژول دسترسی به مستأجر');
    return data;
  },

  async revokeGroupFromTenant(tenantId, groupId) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/permission-groups/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(tenantId),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در سلب ماژول دسترسی از مستأجر');
    return data;
  },

  async createPermission(payload) {
    const res = await fetch('/api/admin/permissions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'خطا در تعریف پرمیژن جدید');
    return data;
  },

  // --- RFC 8693 Impersonation ---
  async impersonate(targetUsername) {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetUsername }),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `خطا در جعل هویت کاربر ${targetUsername}`);
    }

    const newToken = data.accessToken;
    const currentUser = getStoredUser();
    const updatedUser = {
      ...currentUser,
      isImpersonated: true,
      originalToken: getStoredToken(),
      impersonatedToken: newToken,
      actor: {
        username: currentUser?.username || 'admin',
        tenantId: currentUser?.tenantId || 1,
        role: currentUser?.role || 'TENANT_ADMIN'
      },
      targetUsername
    };

    if (newToken) {
      setStoredToken(newToken);
    }
    setStoredUser(updatedUser);
    return updatedUser;
  },

  async revertImpersonation() {
    const res = await fetch('/api/admin/impersonate/revert', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'خطا در بازگشت به نشست ادمین');
    }

    const currentUser = getStoredUser();
    if (currentUser?.originalToken) {
      setStoredToken(currentUser.originalToken);
    }

    const restoredUser = {
      ...currentUser,
      isImpersonated: false,
      actor: null,
      targetUsername: null,
      impersonatedToken: null
    };

    setStoredUser(restoredUser);
    return restoredUser;
  },

  // --- Audit Trail & Active Sessions ---
  async getAuditLogs(tenantId) {
    const url = tenantId ? `/api/admin/audit-logs?tenantId=${tenantId}` : '/api/admin/audit-logs';
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(tenantId)
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async getUserLogs(username) {
    const res = await fetch(`/api/reports/users/${encodeURIComponent(username)}/logs`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async getMySessions() {
    const res = await fetch('/api/sessions/my', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async revokeSession(sessionId) {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('خطا در ابطال نشست');
    return await res.json();
  }
};
