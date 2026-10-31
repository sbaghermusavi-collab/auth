import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldAlert,
  Key,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  X,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { iamApi } from '../api/iamService';

export default function UsersPage({
  users = [],
  roles = [],
  permissionGroups = [],
  tenants = [],
  activeTenantId,
  currentUser,
  onImpersonate,
  onUpdateUser,
  onUpdateUserAccess,
  onCreateUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
  const [accessTab, setAccessTab] = useState('PERMISSIONS'); // 'PERMISSIONS' | 'LOGS'
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

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTenantId = Number(activeTenantId || currentUser?.tenantId || 10);

  // Filter users based on search, status, and tenant scope
  const filteredUsers = users.filter((u) => {
    if (!isSuperAdmin && u.tenantId !== currentUser.tenantId) return false;
    if (isSuperAdmin && activeTenantId && u.tenantId !== targetTenantId && u.tenantId !== 1) return false;

    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleToggleStatus = (user) => {
    onUpdateUser(user);
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

  // Compute permissions granted via draftRoles for live preview in modal
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>مدیریت کاربران، نقش‌های فردی و پرمیژن‌های مستقیم</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? `مشاهده و مدیریت دسترسی کاربران در قلمرو انتخابی (Tenant #${targetTenantId}) و حساب‌های سراسری`
              : `مدیریت کاربران مقید به مستأجر ${currentUser.tenantName} (شناسه ${currentUser.tenantId}) — تخصیص نقش و مجوزهای مجاز مستأجر`}
          </p>
        </div>

        <button
          id="btn-create-user"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>تعریف کاربر جدید</span>
        </button>
      </div>

      {/* Search & Segmented Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
          <input
            id="input-user-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام کاربری، نام و نام خانوادگی یا شماره موبایل..."
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg shrink-0">
          {[
            { id: 'ALL', label: 'همه کاربران' },
            { id: 'ACTIVE', label: 'فقط فعال' },
            { id: 'BLOCKED', label: 'مسدود شده' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Users Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-users" className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">کاربر</th>
                <th className="py-3.5 px-4">شناسه کاربری و موبایل</th>
                <th className="py-3.5 px-4">قلمرو مستأجر</th>
                <th className="py-3.5 px-4">نقش‌ها و مجوزهای مؤثر</th>
                <th className="py-3.5 px-4 text-center">وضعیت حساب</th>
                <th className="py-3.5 px-4 text-left">مدیریت دسترسی و عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    هیچ کاربری با فیلترهای انتخابی در این قلمرو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {user.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="text-sky-400 font-semibold">@{user.username}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{user.phone || '—'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <span>{user.tenantName || 'smslocal'}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="font-mono text-slate-400 tabular-nums">#{user.tenantId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200 font-semibold">
                        {(user. roles || []).join(' · ')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                        {(user.effectivePermissions || []).length} مجوز مؤثر فعال
                        {(user.directPermissions || []).length > 0 &&
                          ` · شامل ${user.directPermissions.length} مجوز مستقیم`}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title="کلیک برای تغییر وضعیت فعال / مسدود"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          user.status === 'ACTIVE'
                            ? 'text-emerald-400 hover:bg-emerald-950/50'
                            : 'text-rose-400 hover:bg-rose-950/50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>مسدود</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-assign-role-${user.username}`}
                          onClick={() => openAccessInspector(user)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                          <span>مدیریت پرمیژن‌ها و نقش</span>
                        </button>

                        <button
                          id={`btn-impersonate-${user.username}`}
                          onClick={() => onImpersonate(user.username)}
                          disabled={user.username === currentUser.username}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                            user.username === currentUser.username
                              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer'
                          }`}
                          title="جعل هویت استاندارد RFC 8693"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>جعل هویت</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: User Permissions & Access Inspector */}
      {selectedUserForAccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedUserForAccess(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
                <span>USER ACCESS INSPECTOR</span>
                <span>·</span>
                <span>@{selectedUserForAccess.username}</span>
                <span>·</span>
                <span>Tenant #{selectedUserForAccess.tenantId}</span>
              </div>
              <h3 className="text-base font-bold text-white">
                مدیریت نقش‌ها و پرمیژن‌های کاربر {selectedUserForAccess.firstName} {selectedUserForAccess.lastName}
              </h3>
            </div>

            {/* Segmented Modal Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg mb-4 self-start">
              <button
                type="button"
                onClick={() => setAccessTab('PERMISSIONS')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  accessTab === 'PERMISSIONS' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                نقش‌ها و ماتریس پرمیژن‌های کاربر
              </button>
              <button
                type="button"
                onClick={() => setAccessTab('LOGS')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                  accessTab === 'LOGS' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>لاگ فعالیت‌های امنیتی کاربر ({userLogs.length})</span>
              </button>
            </div>

            {accessTab === 'PERMISSIONS' ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 pl-2 text-xs">
                {/* Section 1: Role Assignment */}
                <div>
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>۱. نقش‌های منتسب به کاربر (Role Assignment):</span>
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
                                ? 'bg-sky-950/40 border-sky-500/60'
                                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-mono font-bold text-slate-100">{r.code}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{r.name}</div>
                              <div className="text-[10px] text-sky-400 font-mono mt-1">
                                {(r.permissions || []).length} مجوز متصل
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleDraftRole(r.code)}
                              className="mt-1 w-4 h-4 accent-sky-500"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Section 2: Granular User Permissions (Direct Overrides within Tenant Entitlement) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>۲. پرمیژن‌های مستقیم و مؤثر کاربر (محدود به استحقاق مستأجر #{selectedUserForAccess.tenantId}):</span>
                    </h4>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      مجموع مجوزهای مؤثر: {new Set([...roleGrantedPerms, ...draftDirectPerms]).size}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {permissionGroups.map((group) => (
                      <div key={group.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                          <span className="font-bold text-slate-200">{group.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">{group.code}</span>
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
                                    ? 'bg-slate-950/50 border-slate-800/50 opacity-50 cursor-not-allowed'
                                    : isEffective
                                    ? 'bg-sky-950/30 border-sky-600/50 cursor-pointer'
                                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 cursor-pointer'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-mono text-xs font-semibold text-slate-200 truncate">
                                    {perm.code}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">{perm.name}</div>
                                  <div className="text-[10px] font-mono mt-1">
                                    {!isTenantEntitled ? (
                                      <span className="text-rose-400">سلب‌شده از مستأجر توسط Super Admin</span>
                                    ) : viaRole ? (
                                      <span className="text-emerald-400">اعطا شده از طریق نقش کاربر</span>
                                    ) : viaDirect ? (
                                      <span className="text-sky-400">مجوز مستقیم فردی (Direct Grant)</span>
                                    ) : (
                                      <span className="text-slate-500">غیرفعال برای این کاربر</span>
                                    )}
                                  </div>
                                </div>

                                <input
                                  type="checkbox"
                                  disabled={!isTenantEntitled || viaRole}
                                  checked={isEffective}
                                  onChange={() => handleToggleDraftDirectPerm(perm.code)}
                                  className="mt-1 w-4 h-4 accent-sky-500 shrink-0"
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
                  <div className="py-10 text-center text-slate-400">
                    هیچ رخداد ممیزی برای این کاربر ثبت نشده است.
                  </div>
                ) : (
                  userLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-200">
                          {log.action} <span className="text-slate-500">·</span>{' '}
                          <span className="text-sky-400">{log.target}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                      </div>
                      <div className="text-left font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                        <div>{log.timestamp}</div>
                        <div className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {log.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUserForAccess(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                انصراف
              </button>
              {accessTab === 'PERMISSIONS' && (
                <button
                  type="button"
                  disabled={savingAccess}
                  onClick={handleSaveUserAccess}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-400" />
              <span>تعریف کاربر جدید در درگاه مدیریت</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">مستأجر هدف</label>
                  <select
                    value={newUserData.tenantId}
                    onChange={(e) => setNewUserData({ ...newUserData, tenantId: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
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
                <label className="block text-slate-300 mb-1 font-semibold">نام کاربری (Username)</label>
                <input
                  id="modal-create-username"
                  type="text"
                  required
                  placeholder="مثال: sms_operator_2"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نام</label>
                  <input
                    type="text"
                    placeholder="علی"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نام خانوادگی</label>
                  <input
                    type="text"
                    placeholder="احمدی"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">شماره موبایل ۲FA</label>
                <input
                  id="modal-create-phone"
                  type="text"
                  required
                  placeholder="09120000000"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نقش اولیه</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ROLE_USER">کاربر بهره‌بردار (ROLE_USER)</option>
                  <option value="ROLE_SMS_OPERATOR">اپراتور کمپین و پیامک (ROLE_SMS_OPERATOR)</option>
                  <option value="TENANT_ADMIN">مدیر مستأجر (TENANT_ADMIN)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-user"
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
