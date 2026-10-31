import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldAlert, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  X
} from 'lucide-react';

export default function UsersPage({ users, currentUser, onImpersonate, onUpdateUser, onCreateUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'ROLE_USER'
  });

  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN' || currentUser.tenantId === 10;

  // Filter users based on search and status
  const filteredUsers = users.filter((u) => {
    // If tenant admin, strictly match tenant ID
    if (isTenantAdmin && u.tenantId !== currentUser.tenantId) return false;

    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (user) => {
    const isCurrentlyActive = user.status === 'ACTIVE' || user.enabled === true;
    const updated = {
      ...user,
      enabled: isCurrentlyActive,
      status: isCurrentlyActive ? 'BLOCKED' : 'ACTIVE'
    };
    onUpdateUser(updated);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.phone) {
      alert('لطفاً نام کاربری و شماره تماس را وارد کنید.');
      return;
    }
    const created = {
      id: Date.now(),
      username: newUserData.username,
      firstName: newUserData.firstName || 'کاربر',
      lastName: newUserData.lastName || 'جدید',
      phone: newUserData.phone,
      email: newUserData.email || `${newUserData.username}@tenant.local`,
      tenantId: currentUser.tenantId || 10,
      roles: [newUserData.role],
      status: 'ACTIVE',
      lastLogin: 'ثبت جدید',
      createdAt: '۱۴۰۵/۰۷/۲۰'
    };
    onCreateUser(created);
    setIsCreateModalOpen(false);
    setNewUserData({ username: '', firstName: '', lastName: '', phone: '', email: '', role: 'ROLE_USER' });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>مدیریت کاربران (User Management)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTenantAdmin 
              ? 'فهرست کاربران مقید به مستأجر پیامک (Tenant 10) - تفکیک کامل دسترسی و داده'
              : 'فهرست فراگیر کاربران در کلیه مستأجرین پلتفرم'}
          </p>
        </div>

        <button
          id="btn-create-user"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ تعریف کاربر جدید</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            id="input-user-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام کاربری، نام، شماره موبایل..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="ACTIVE">فقط کاربران فعال (ACTIVE)</option>
            <option value="BLOCKED">کاربران مسدود شده (BLOCKED)</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table id="table-users" className="w-full text-right text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">مشخصات کاربر</th>
                <th className="py-3 px-4">نام کاربری</th>
                <th className="py-3 px-4">شماره تماس (2FA)</th>
                <th className="py-3 px-4">مستأجر</th>
                <th className="py-3 px-4">نقش‌ها</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-left">اقدامات امنیتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    هیچ کاربری با مشخصات مورد نظر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-750/50 transition-colors">
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-cyan-900/40 border border-cyan-700/50 text-cyan-300 flex items-center justify-center font-bold text-xs">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{user.firstName} {user.lastName}</div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                      @{user.username}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {user.phone || '—'}
                    </td>

                    {/* Tenant */}
                    <td className="py-3 px-4">
                      <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                        شناسه {user.tenantId} ({user.tenantName || 'اختصاصی'})
                      </span>
                    </td>

                    {/* Roles */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              r.includes('ADMIN')
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title="کلیک برای تغییر وضعیت"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/60 hover:bg-rose-900'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>مسدود</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Impersonate Button */}
                        <button
                          id={`btn-impersonate-${user.username}`}
                          onClick={() => onImpersonate(user.username)}
                          disabled={user.username === currentUser.username}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            user.username === currentUser.username
                              ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow cursor-pointer'
                          }`}
                          title="جعل هویت این کاربر (RFC 8693 Token Exchange)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>جعل هویت</span>
                        </button>

                        {/* Assign Role Button */}
                        <button
                          id={`btn-assign-role-${user.username}`}
                          onClick={() => setSelectedUserForRoles(user)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>تخصیص نقش</span>
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

      {/* Modal: Create User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-850 bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <span>تعریف کاربر جدید در مستأجر {currentUser.tenantName || 'smslocal'}</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام کاربری (Username)</label>
                <input
                  id="modal-create-username"
                  type="text"
                  required
                  placeholder="مثال: sms_operator_1"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نام</label>
                  <input
                    type="text"
                    placeholder="علی"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نام خانوادگی</label>
                  <input
                    type="text"
                    placeholder="محمدی"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">شماره تماس ۲FA</label>
                <input
                  id="modal-create-phone"
                  type="text"
                  required
                  placeholder="09120000000"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نقش اولیه</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ROLE_USER">کاربر عادی پنل (ROLE_USER)</option>
                  <option value="ROLE_SMS_OPERATOR">اپراتور ارسال و پشتیبانی پیامک</option>
                  <option value="TENANT_ADMIN">ادمین مستأجر (TENANT_ADMIN)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-user"
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-cyan-900/30"
                >
                  ذخیره و ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Roles */}
      {selectedUserForRoles && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedUserForRoles(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>تخصیص نقش به کاربر @{selectedUserForRoles.username}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              انتخاب نقش‌های مجاز در حوزه مستأجر {selectedUserForRoles.tenantId}
            </p>

            <div className="space-y-2 text-xs mb-6">
              {['ROLE_USER', 'ROLE_SMS_OPERATOR', 'TENANT_ADMIN'].map((r) => {
                const hasRole = selectedUserForRoles.roles.includes(r);
                return (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      hasRole ? 'bg-cyan-950/60 border-cyan-700' : 'bg-slate-800/40 border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{r}</span>
                      <span className="text-[11px] text-slate-400">
                        {r === 'TENANT_ADMIN' ? 'مدیر کامل مستأجر' : r === 'ROLE_SMS_OPERATOR' ? 'اپراتور کمپین‌های پیامک' : 'دسترسی عادی ارسال'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasRole}
                      onChange={() => {
                        const newRoles = hasRole
                          ? selectedUserForRoles.roles.filter(x => x !== r)
                          : [...selectedUserForRoles.roles, r];
                        const updated = { ...selectedUserForRoles, roles: newRoles };
                        setSelectedUserForRoles(updated);
                        onUpdateUser(updated);
                      }}
                      className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700"
                    />
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedUserForRoles(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl text-xs font-bold shadow"
            >
              بستن و ذخیره تغییرات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
