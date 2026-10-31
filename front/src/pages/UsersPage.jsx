import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ShieldAlert,
  Trash2,
  X,
  Activity,
  ShieldCheck,
  Key,
  FolderTree,
  Plus
} from 'lucide-react';
import { iamApi } from '../api/iamService';

export default function UsersPage({
  users = [],
  userGroups = [],
  roles = [],
  permissionGroups = [],
  tenants = [],
  activeTenantId,
  currentUser,
  onImpersonate,
  onUpdateUser,
  onUpdateUserAccess,
  onCreateUser,
  onDeleteUser,
  onCreateUserGroup,
  onAssignPermissionToUserGroup
}) {
  const [subView, setSubView] = useState('USERS'); // 'USERS' | 'GROUPS'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
  const [accessTab, setAccessTab] = useState('PERMISSIONS');
  const [draftRoles, setDraftRoles] = useState([]);
  const [draftDirectPerms, setDraftDirectPerms] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    tenantId: activeTenantId || currentUser?.tenantId || 10,
    role: 'ROLE_USER'
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    fatherUserId: 110
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTenantId = Number(activeTenantId || currentUser?.tenantId || 10);

  const filteredUsers = users.filter((u) => {
    if (!isSuperAdmin && u.tenantId !== currentUser.tenantId) return false;
    if (isSuperAdmin && activeTenantId && u.tenantId !== targetTenantId && u.tenantId !== 1) {
      return false;
    }

    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scopedUserGroups = userGroups.filter(
    (g) => !activeTenantId || Number(g.tenantId) === targetTenantId || isSuperAdmin
  );

  const openAccessInspector = async (user) => {
    setSelectedUserForAccess(user);
    setDraftRoles(user.roles || []);
    setDraftDirectPerms(user.directPermissions || []);
    setAccessTab('PERMISSIONS');
    const logs = await iamApi.getUserLogs(user.username);
    setUserLogs(logs);
  };

  const handleToggleDraftRole = (roleCode) => {
    if (draftRoles.includes(roleCode)) {
      setDraftRoles(draftRoles.filter((r) => r !== roleCode));
    } else {
      setDraftRoles([...draftRoles, roleCode]);
    }
  };

  const handleToggleDraftDirectPerm = (permCode) => {
    if (draftDirectPerms.includes(permCode)) {
      setDraftDirectPerms(draftDirectPerms.filter((p) => p !== permCode));
    } else {
      setDraftDirectPerms([...draftDirectPerms, permCode]);
    }
  };

  const handleSaveUserAccess = async () => {
    if (!selectedUserForAccess) return;
    setSavingAccess(true);
    try {
      await onUpdateUserAccess(selectedUserForAccess.id, {
        roles: draftRoles,
        directPermissions: draftDirectPerms
      });
      setSelectedUserForAccess(null);
    } finally {
      setSavingAccess(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.phone) return;
    onCreateUser({
      username: newUserData.username,
      firstName: newUserData.firstName || 'کاربر',
      lastName: newUserData.lastName || 'جدید',
      phone: newUserData.phone,
      email: newUserData.email || `${newUserData.username}@asan.com`,
      tenantId: isSuperAdmin ? Number(newUserData.tenantId || targetTenantId) : currentUser.tenantId,
      roles: [newUserData.role],
      directPermissions: []
    });
    setIsCreateModalOpen(false);
    setNewUserData({
      username: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      tenantId: targetTenantId,
      role: 'ROLE_USER'
    });
  };

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    if (!newGroupData.name) return;
    if (onCreateUserGroup) {
      onCreateUserGroup({
        name: newGroupData.name,
        tenantId: targetTenantId,
        fatherUserId: Number(newGroupData.fatherUserId || 110)
      });
    }
    setIsGroupModalOpen(false);
    setNewGroupData({ name: '', fatherUserId: 110 });
  };

  const roleGrantedPerms = new Set();
  if (selectedUserForAccess) {
    for (const r of roles) {
      if (
        draftRoles.includes(r.code) &&
        (r.tenantId === selectedUserForAccess.tenantId || r.tenantId === 1)
      ) {
        for (const p of r.permissions || []) {
          roleGrantedPerms.add(p);
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-theme-card border border-slate-200 border-r-4 border-r-indigo-600 shadow-sm rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>مدیریت کاربران، نقش‌های فردی، مجوزهای مستقیم و گروه‌های کاربری</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            GET / POST / PUT / DELETE /api/admin/users · /api/tenant-admin/users · /api/groups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Sub-view Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setSubView('USERS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subView === 'USERS'
                  ? 'bg-theme-card text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جدول کاربران ({filteredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('GROUPS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subView === 'GROUPS'
                  ? 'bg-theme-card text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
              <span>گروه‌های کاربری سلسله‌مراتبی ({scopedUserGroups.length})</span>
            </button>
          </div>

          {subView === 'USERS' ? (
            <button
              id="btn-create-user"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>تعریف کاربر جدید</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد گروه کاربری (/api/groups)</span>
            </button>
          )}
        </div>
      </div>

      {subView === 'USERS' ? (
        <>
          {/* Search & Status Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
              <input
                id="input-user-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس نام کاربری، نام و نام خانوادگی یا شماره موبایل..."
                className="w-full bg-theme-card border border-slate-300 rounded-lg pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-theme-card border border-slate-200 rounded-lg shrink-0">
              {[
                { id: 'ALL', label: 'همه کاربران' },
                { id: 'ACTIVE', label: 'فقط فعال' },
                { id: 'BLOCKED', label: 'مسدود شده' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Users Data Grid */}
          <div className="bg-theme-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table id="table-users" className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">مشخصات کاربر</th>
                    <th className="py-3.5 px-4">نام کاربری و موبایل ۲FA</th>
                    <th className="py-3.5 px-4">مستأجر</th>
                    <th className="py-3.5 px-4">نقش‌های تخصیص‌یافته</th>
                    <th className="py-3.5 px-4">پرمیژن‌های مؤثر و مستقیم</th>
                    <th className="py-3.5 px-4 text-center">وضعیت حساب</th>
                    <th className="py-3.5 px-4 text-left">مدیریت دسترسی و عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-500">
                        هیچ کاربری با فیلترهای انتخابی در این قلمرو یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {user.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          <div className="text-indigo-600 font-bold">@{user.username}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{user.phone || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <span>{user.tenantName || 'smslocal'}</span>
                          <span className="mx-1 text-slate-400">·</span>
                          <span className="font-mono text-slate-500 tabular-nums">#{user.tenantId}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-800">
                            {(user.roles || []).join(' · ')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-slate-900 tabular-nums">
                            {(user.effectivePermissions || []).length} مجوز مؤثر فعال
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs font-mono">
                            {(user.effectivePermissions || []).slice(0, 3).join(', ')}
                            {(user.effectivePermissions || []).length > 3 ? ' ...' : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onUpdateUser(user)}
                            title="تغییر وضعیت فعال / مسدود (PUT /users/:id/status)"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                              user.status === 'ACTIVE'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>فعال</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>مسدود</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-assign-role-${user.username}`}
                              type="button"
                              onClick={() => openAccessInspector(user)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                              <span>نقش و پرمیژن‌ها</span>
                            </button>

                            <button
                              id={`btn-impersonate-${user.username}`}
                              type="button"
                              onClick={() => onImpersonate(user.username)}
                              disabled={user.username === currentUser.username}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                user.username === currentUser.username
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 cursor-pointer'
                              }`}
                              title="جعل هویت استاندارد RFC 8693"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              <span>جعل هویت</span>
                            </button>

                            {!user.systemUser && onDeleteUser && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(user.id, user.username)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف کاربر (DELETE /users/:id)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Hierarchical User Groups View (/api/groups) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scopedUserGroups.map((grp) => {
            const allCatalogPerms = permissionGroups.flatMap((g) => g.permissions || []);
            return (
              <div
                key={grp.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-indigo-600" />
                        <span>{grp.name}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Group #{grp.id} · Tenant #{grp.tenantId} · سرگروه (Father): @{grp.fatherUsername || grp.fatherUserId}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 tabular-nums">
                      {(grp.permissions || []).length} مجوز
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-semibold pt-1">
                    تخصیص پرمیژن به زیرگروه توسط سرگروه (POST /api/groups/{grp.id}/permissions):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {allCatalogPerms.slice(0, 8).map((perm) => {
                      const hasPerm = (grp.permissions || []).includes(perm.code);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() =>
                            onAssignPermissionToUserGroup &&
                            onAssignPermissionToUserGroup(grp.id, {
                              actorUserId: grp.fatherUserId,
                              permissionId: perm.id,
                              permissionCode: perm.code,
                              toggle: true
                            })
                          }
                          className={`p-2.5 rounded-lg border text-right flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                            hasPerm
                              ? 'bg-indigo-50/70 border-indigo-400 text-slate-900 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-mono text-[11px] text-indigo-700 truncate">
                              {perm.code}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">{perm.name}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={hasPerm}
                            readOnly
                            className="w-4 h-4 accent-indigo-600 shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: User Access & Granular Permissions Inspector */}
      {selectedUserForAccess && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedUserForAccess(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 mb-1">
                <span>PUT /api/admin/users/{selectedUserForAccess.id}/roles</span>
                <span>·</span>
                <span>@{selectedUserForAccess.username}</span>
                <span>·</span>
                <span>Tenant #{selectedUserForAccess.tenantId}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                مدیریت نقش‌ها و پرمیژن‌های مستقیم کاربر «{selectedUserForAccess.firstName}{' '}
                {selectedUserForAccess.lastName}»
              </h3>
            </div>

            {/* Segmented Modal Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg mb-4 self-start">
              <button
                type="button"
                onClick={() => setAccessTab('PERMISSIONS')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  accessTab === 'PERMISSIONS'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                نقش‌ها و ماتریس پرمیژن‌های کاربر
              </button>
              <button
                type="button"
                onClick={() => setAccessTab('LOGS')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  accessTab === 'LOGS'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>لاگ فعالیت کاربر ({userLogs.length})</span>
              </button>
            </div>

            {accessTab === 'PERMISSIONS' ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 pl-2 text-xs">
                {/* 1. Roles Selection */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>۱. انتخاب نقش‌های کاربر (Role Assignment):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {roles
                      .filter(
                        (r) =>
                          r.tenantId === selectedUserForAccess.tenantId ||
                          (selectedUserForAccess.tenantId === 1 && r.tenantId === 1)
                      )
                      .map((r) => {
                        const checked = draftRoles.includes(r.code);
                        return (
                          <label
                            key={r.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                              checked
                                ? 'bg-indigo-50/70 border-indigo-500'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-mono font-bold text-slate-900">{r.code}</div>
                              <div className="text-[11px] text-slate-600 mt-0.5">{r.name}</div>
                              <div className="text-[10px] text-indigo-600 font-mono mt-1">
                                {(r.permissions || []).length} مجوز در این نقش
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleDraftRole(r.code)}
                              className="mt-1 w-4 h-4 accent-indigo-600"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* 2. Direct & Effective Permissions Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>
                        ۲. ماتریس پرمیژن‌های مستقیم و مؤثر کاربر (محدود به استحقاق مستأجر #
                        {selectedUserForAccess.tenantId}):
                      </span>
                    </h4>
                    <span className="font-mono text-xs font-bold text-indigo-600 tabular-nums">
                      مجموع مجوزهای مؤثر: {new Set([...roleGrantedPerms, ...draftDirectPerms]).size}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {permissionGroups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5"
                      >
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
                          <span className="font-bold text-slate-900">{group.name}</span>
                          <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                            {group.code}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(group.permissions || []).map((perm) => {
                            const isTenantEntitled = perm.entitled !== false;
                            const viaRole = roleGrantedPerms.has(perm.code);
                            const viaDirect = draftDirectPerms.includes(perm.code);
                            const isEffective = isTenantEntitled && (viaRole || viaDirect);

                            return (
                              <label
                                key={perm.id}
                                className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 transition-colors ${
                                  !isTenantEntitled
                                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                                    : isEffective
                                    ? 'bg-white border-indigo-400 shadow-2xs cursor-pointer'
                                    : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-mono text-xs font-bold text-slate-900 truncate">
                                    {perm.code}
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate">
                                    {perm.name}
                                  </div>
                                  <div className="text-[10px] font-semibold mt-1">
                                    {!isTenantEntitled ? (
                                      <span className="text-rose-600">
                                        سلب‌شده از مستأجر توسط Super Admin
                                      </span>
                                    ) : viaRole ? (
                                      <span className="text-emerald-700">
                                        فعال از طریق نقش کاربر
                                      </span>
                                    ) : viaDirect ? (
                                      <span className="text-indigo-600">
                                        مجوز مستقیم فردی (Direct Grant)
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">غیرفعال</span>
                                    )}
                                  </div>
                                </div>

                                <input
                                  type="checkbox"
                                  disabled={!isTenantEntitled || viaRole}
                                  checked={isEffective}
                                  onChange={() => handleToggleDraftDirectPerm(perm.code)}
                                  className="mt-1 w-4 h-4 accent-indigo-600 shrink-0"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1 pl-2">
                {userLogs.length === 0 ? (
                  <div className="py-10 text-center text-slate-500">
                    هیچ رخداد ممیزی برای این کاربر ثبت نشده است.
                  </div>
                ) : (
                  userLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">
                          {log.action} <span className="text-slate-400">·</span>{' '}
                          <span className="text-indigo-600">{log.target}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                      </div>
                      <div className="text-left font-mono text-[11px] text-slate-500 shrink-0 tabular-nums">
                        <div>{log.timestamp}</div>
                        <div
                          className={
                            log.status === 'SUCCESS'
                              ? 'text-emerald-600 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {log.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUserForAccess(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                انصراف
              </button>
              {accessTab === 'PERMISSIONS' && (
                <button
                  type="button"
                  disabled={savingAccess}
                  onClick={handleSaveUserAccess}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {savingAccess ? 'در حال ذخیره...' : 'ذخیره نقش‌ها و پرمیژن‌های کاربر'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>تعریف کاربر جدید در سامانه</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">مستأجر هدف</label>
                  <select
                    value={newUserData.tenantId}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, tenantId: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (#{t.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  نام کاربری (Username)
                </label>
                <input
                  id="modal-create-username"
                  type="text"
                  required
                  placeholder="مثال: sms_operator_2"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">نام</label>
                  <input
                    type="text"
                    placeholder="علی"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">نام خانوادگی</label>
                  <input
                    type="text"
                    placeholder="احمدی"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">شماره موبایل ۲FA</label>
                <input
                  id="modal-create-phone"
                  type="text"
                  required
                  placeholder="09120000000"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نقش اولیه</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  {roles
                    .filter((r) => r.tenantId === Number(newUserData.tenantId || targetTenantId))
                    .map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  <option value="ROLE_USER">کاربر بهره‌بردار (ROLE_USER)</option>
                  <option value="TENANT_ADMIN">مدیر مستأجر (TENANT_ADMIN)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-user"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User Group (/api/groups) */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              <span>ایجاد گروه کاربری جدید (POST /api/groups)</span>
            </h3>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">عنوان گروه کاربری</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تیم فروش سازمانی منطقه ۱"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  کاربر سرگروه (Father User)
                </label>
                <select
                  value={newGroupData.fatherUserId}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, fatherUserId: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ثبت گروه کاربری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
