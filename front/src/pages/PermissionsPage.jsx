import React, { useState } from 'react';
import {
  Key,
  Layers,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Building2,
  X,
  Trash2,
  FolderPlus
} from 'lucide-react';

export default function PermissionsPage({
  permissionGroups = [],
  tenants = [],
  activeTenantId,
  currentUser,
  onTenantSwitch,
  onGrantPermission,
  onRevokePermission,
  onGrantGroup,
  onRevokeGroup,
  onCreatePermission,
  onDeletePermission,
  onCreatePermissionGroup,
  onDeletePermissionGroup
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [newPerm, setNewPerm] = useState({
    code: '',
    name: '',
    description: '',
    groupCode: 'SMS_ENGINE'
  });

  const [newGroup, setNewGroup] = useState({
    code: '',
    name: '',
    description: ''
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTid = Number(activeTenantId || currentUser?.tenantId || 10);
  const activeTenant = tenants.find((t) => Number(t.id) === targetTid);

  const filteredGroups = permissionGroups
    .filter((g) => selectedGroup === 'ALL' || g.code === selectedGroup)
    .map((group) => ({
      ...group,
      permissions: (group.permissions || []).filter(
        (p) =>
          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }))
    .filter((group) => group.permissions.length > 0);

  const handleCreatePermSubmit = (e) => {
    e.preventDefault();
    if (!newPerm.code || !newPerm.name) return;
    onCreatePermission({
      ...newPerm,
      entitleToTenantId: targetTid
    });
    setIsCreateModalOpen(false);
    setNewPerm({ code: '', name: '', description: '', groupCode: 'SMS_ENGINE' });
  };

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    if (!newGroup.code || !newGroup.name) return;
    if (onCreatePermissionGroup) {
      onCreatePermissionGroup(newGroup);
    }
    setIsGroupModalOpen(false);
    setNewGroup({ code: '', name: '', description: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Tenant Entitlement Scope Bar */}
      <div className="bg-theme-card p-5 rounded-xl border border-slate-200 border-r-4 border-r-amber-600 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            <span>
              {isSuperAdmin
                ? 'مدیریت استحقاق پرمیژن‌های مستأجر و کاتالوگ سراسری (Super Admin Entitlements)'
                : `ماتریس پرمیژن‌های دارای استحقاق مستأجر (${activeTenant?.name || currentUser.tenantName})`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            GET / POST / DELETE /api/admin/tenants/{targetTid}/permissions/:permissionId · /permission-groups/:groupId
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isSuperAdmin && tenants.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-600 font-medium">مستأجر هدف:</span>
              <select
                value={targetTid}
                onChange={(e) => onTenantSwitch(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (#{t.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(true)}
                className="bg-theme-card hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>گروه پرمیژن جدید</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف پرمیژن سراسری جدید</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کد سیستمی پرمیژن، نام فارسی یا شرح عملکرد..."
            className="w-full bg-theme-card border border-slate-300 rounded-lg pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-theme-card border border-slate-200 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              selectedGroup === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            همه گروه‌ها ({permissionGroups.length})
          </button>
          {permissionGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.code)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer font-mono ${
                selectedGroup === g.code
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g.code}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Groups & Tenant Entitlement Tables */}
      <div className="space-y-5">
        {filteredGroups.map((group) => {
          const totalInGroup = group.permissions.length;
          const entitledInGroup = group.permissions.filter((p) => p.entitled !== false).length;
          const allEntitled = totalInGroup > 0 && entitledInGroup === totalInGroup;

          return (
            <div
              key={group.id}
              className="bg-theme-card rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Group Header Bar */}
              <div className="bg-slate-100/90 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{group.name}</h3>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {group.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-600 font-semibold tabular-nums">
                    {entitledInGroup} از {totalInGroup} مجوز فعال برای مستأجر #{targetTid}
                  </span>

                  {isSuperAdmin && targetTid !== 1 && (
                    <div className="flex items-center gap-1.5">
                      {!allEntitled ? (
                        <button
                          type="button"
                          onClick={() => onGrantGroup(targetTid, group.id, group.code)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                        >
                          اعطای کل گروه به مستأجر
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRevokeGroup(targetTid, group.id, group.code)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                        >
                          سلب کل گروه از مستأجر
                        </button>
                      )}
                    </div>
                  )}

                  {isSuperAdmin && onDeletePermissionGroup && totalInGroup === 0 && (
                    <button
                      type="button"
                      onClick={() => onDeletePermissionGroup(group.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="حذف گروه خالی"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions Table inside Group */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-56">کد سیستمی پرمیژن</th>
                      <th className="py-3 px-4 w-64">عنوان فارسی مجوز</th>
                      <th className="py-3 px-4">شرح عملکرد در سرویس‌ها</th>
                      <th className="py-3 px-4 text-left w-64">
                        وضعیت استحقاق در مستأجر #{targetTid}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {group.permissions.map((perm) => {
                      const isEntitled = perm.entitled !== false;
                      return (
                        <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {perm.code}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{perm.name}</td>
                          <td className="py-3 px-4 text-slate-600">{perm.description}</td>
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {isSuperAdmin && targetTid !== 1 ? (
                                isEntitled ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRevokePermission(targetTid, perm.id, perm.code)
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border border-emerald-200 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                    title="کلیک برای سلب استحقاق این پرمیژن از مستأجر"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>دارای استحقاق (کلیک جهت سلب)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onGrantPermission(targetTid, perm.id, perm.code)
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                    title="کلیک برای اعطای استحقاق این پرمیژن به مستأجر"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    <span>سلب شده (کلیک جهت اعطا)</span>
                                  </button>
                                )
                              ) : isEntitled ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>مجاز در مستأجر</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>عدم استحقاق مستأجر</span>
                                </span>
                              )}

                              {isSuperAdmin && onDeletePermission && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePermission(perm.id, perm.code)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="حذف پرمیژن از کاتالوگ سراسری (DELETE /api/admin/permissions/:id)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Global Permission */}
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
              <Key className="w-5 h-5 text-indigo-600" />
              <span>تعریف پرمیژن جدید در کاتالوگ (POST /api/admin/permissions)</span>
            </h3>

            <form onSubmit={handleCreatePermSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  کد سیستمی پرمیژن (Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: sms.template.approve"
                  value={newPerm.code}
                  onChange={(e) => setNewPerm({ ...newPerm, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">عنوان فارسی مجوز</label>
                <input
                  type="text"
                  required
                  placeholder="تایید قالب‌های پیامکی سازمانی"
                  value={newPerm.name}
                  onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">گروه پرمیژن</label>
                <select
                  value={newPerm.groupCode}
                  onChange={(e) => setNewPerm({ ...newPerm, groupCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  {permissionGroups.map((g) => (
                    <option key={g.id} value={g.code}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">شرح عملکرد</label>
                <input
                  type="text"
                  placeholder="توضیح کاربرد این پرمیژن در میکروسرویس‌ها..."
                  value={newPerm.description}
                  onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
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
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد و اعطا به مستأجر #{targetTid}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Permission Group */}
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
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              <span>تعریف گروه پرمیژن جدید (POST /api/admin/permission-groups)</span>
            </h3>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  کد سیستمی گروه (Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: CRM_INTEGRATION"
                  value={newGroup.code}
                  onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">عنوان فارسی گروه</label>
                <input
                  type="text"
                  required
                  placeholder="یکپارچه‌سازی CRM و باشگاه مشتریان"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">توضیحات</label>
                <input
                  type="text"
                  placeholder="دسته‌بندی مجوزهای مرتبط با..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
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
                  ثبت گروه پرمیژن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
