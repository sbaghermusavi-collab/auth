import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Layers,
  Key,
  Users,
  CheckCircle2,
  X,
  FileCheck,
  Link2,
  Unlink,
  Trash2,
  Star
} from 'lucide-react';

export default function RolesPage({
  roles = [],
  tenants = [],
  permissionGroups = [],
  activeTenantId,
  currentUser,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onAttachGroupToRole,
  onDetachGroupFromRole,
  onSetTenantDefaultRole
}) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || null);
  const [newRole, setNewRole] = useState({
    code: '',
    name: '',
    description: '',
    selectedPermissions: []
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTid = Number(activeTenantId || currentUser?.tenantId || 10);
  const activeTenant = tenants.find((t) => Number(t.id) === targetTid);

  const scopedRoles = roles.filter(
    (r) => r.tenantId === targetTid || (isSuperAdmin && r.tenantId === 1)
  );

  const selectedRoleDetail =
    scopedRoles.find((r) => r.id === selectedRoleId) || scopedRoles[0] || null;

  useEffect(() => {
    if (scopedRoles.length > 0 && !scopedRoles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(scopedRoles[0].id);
    }
  }, [activeTenantId, roles.length]);

  const handleToggleNewRolePerm = (permCode) => {
    const list = newRole.selectedPermissions;
    if (list.includes(permCode)) {
      setNewRole({ ...newRole, selectedPermissions: list.filter((p) => p !== permCode) });
    } else {
      setNewRole({ ...newRole, selectedPermissions: [...list, permCode] });
    }
  };

  const handleToggleExistingRolePerm = (permCode) => {
    if (!selectedRoleDetail || !onUpdateRole) return;
    const currentPerms = selectedRoleDetail.permissions || [];
    const updatedPerms = currentPerms.includes(permCode)
      ? currentPerms.filter((c) => c !== permCode)
      : [...currentPerms, permCode];

    onUpdateRole(selectedRoleDetail.id, {
      ...selectedRoleDetail,
      permissions: updatedPerms
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newRole.code || !newRole.name) return;
    onCreateRole({
      code: newRole.code.startsWith('ROLE_')
        ? newRole.code.toUpperCase()
        : `ROLE_${newRole.code.toUpperCase()}`,
      name: newRole.name,
      description: newRole.description || 'نقش سفارشی مستأجر',
      tenantId: targetTid,
      permissions: newRole.selectedPermissions
    });
    setIsBuilderOpen(false);
    setNewRole({ code: '', name: '', description: '', selectedPermissions: [] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-card border border-slate-200 border-r-4 border-r-teal-700 shadow-sm rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span>ماتریس مهندسی نقش‌ها و اتصال یک‌کلیکی گروه‌های پرمیژن (Role & Group Matrix)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            GET / POST / PUT / DELETE /api/admin/roles · POST / DELETE /api/admin/roles/:roleId/groups/:groupId
          </p>
        </div>

        <button
          id="btn-create-role"
          type="button"
          onClick={() => setIsBuilderOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف نقش سفارشی جدید</span>
        </button>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Roles List Column */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 px-1 flex items-center justify-between">
            <span>فهرست نقش‌های قلمرو #{targetTid}</span>
            <span className="font-mono text-indigo-600">{scopedRoles.length} نقش</span>
          </div>

          <div id="roles-list-container" className="space-y-2.5">
            {scopedRoles.map((r) => {
              const isSelected = selectedRoleDetail?.id === r.id;
              const isTenantDefault =
                r.isDefault || (activeTenant && Number(activeTenant.defaultRoleId) === Number(r.id));

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 border-r-4 shadow-sm'
                      : 'bg-theme-card border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-600">{r.code}</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      {isTenantDefault && (
                        <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>پیش‌فرض</span>
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">Tenant #{r.tenantId}</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{r.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2.5 border-t border-slate-200/80 font-mono tabular-nums">
                    <span className="flex items-center gap-1 font-semibold">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      {(r.permissions || []).length} مجوز فعال
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {r.userCount || 0} کاربر
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Role Matrix Detail */}
        <div className="lg:col-span-8">
          {selectedRoleDetail ? (
            <div className="bg-theme-card border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
              {/* Role Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 id="role-detail-name" className="text-base font-bold text-slate-900">
                      {selectedRoleDetail.name}
                    </h3>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {selectedRoleDetail.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedRoleDetail.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSetTenantDefaultRole && (
                    <button
                      type="button"
                      onClick={() =>
                        onSetTenantDefaultRole(selectedRoleDetail.tenantId, selectedRoleDetail.id)
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="PUT /api/admin/tenants/:tenantId/default-role"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>تنظیم به عنوان نقش پیش‌فرض مستأجر</span>
                    </button>
                  )}

                  {!selectedRoleDetail.isSystem && onDeleteRole && (
                    <button
                      type="button"
                      onClick={() => onDeleteRole(selectedRoleDetail.id, selectedRoleDetail.code)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="DELETE /api/admin/roles/:id"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نقش</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 1: One-Click Permission Group Attachment */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>۱. اتصال یا جداسازی یک‌کلیکی گروه‌های پرمیژن به این نقش:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    POST / DELETE /api/admin/roles/{selectedRoleDetail.id}/groups/:groupId
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissionGroups.map((grp) => {
                    const groupPermCodes = (grp.permissions || [])
                      .filter((p) => p.entitled !== false)
                      .map((p) => p.code);
                    const allAttached =
                      groupPermCodes.length > 0 &&
                      groupPermCodes.every((code) =>
                        (selectedRoleDetail.permissions || []).includes(code)
                      );

                    return (
                      <div
                        key={grp.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{grp.name}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {grp.code} · {groupPermCodes.length} مجوز مجاز مستأجر
                          </div>
                        </div>

                        {allAttached ? (
                          <button
                            type="button"
                            onClick={() => onDetachGroupFromRole(selectedRoleDetail.id, grp.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>جداسازی گروه</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={groupPermCodes.length === 0}
                            onClick={() => onAttachGroupToRole(selectedRoleDetail.id, grp.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>اتصال کامل گروه</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Grouped Permission Checkboxes Matrix */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>
                      ۲. ماتریس تک‌تک پرمیژن‌های نقش (کلیک برای فعال یا غیرفعال‌سازی مجوز در این نقش):
                    </span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>محافظت‌شده توسط گارد استحقاق مستأجر (Entitlement Guard)</span>
                  </span>
                </div>

                {permissionGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{grp.name}</span>
                      <span className="font-mono text-indigo-600 font-semibold">{grp.code}</span>
                    </div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-white">
                      {(grp.permissions || []).map((perm) => {
                        const isIncluded = (selectedRoleDetail.permissions || []).includes(
                          perm.code
                        );
                        const isEntitled = perm.entitled !== false;

                        return (
                          <button
                            type="button"
                            key={perm.id}
                            disabled={!isEntitled}
                            onClick={() => handleToggleExistingRolePerm(perm.code)}
                            className={`p-3 rounded-lg border text-right flex items-center justify-between gap-3 transition-colors ${
                              !isEntitled
                                ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                                : isIncluded
                                ? 'bg-indigo-50/70 border-indigo-500 cursor-pointer'
                                : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-bold text-slate-900 truncate">
                                {perm.code}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                {perm.name}
                              </div>
                            </div>

                            <div className="shrink-0 text-xs font-semibold">
                              {!isEntitled ? (
                                <span className="text-rose-600 font-mono text-[11px]">
                                  سلب از مستأجر
                                </span>
                              ) : isIncluded ? (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>متصل</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">غیرفعال</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
              یک نقش را از ستون سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Role Builder */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>تعریف نقش سفارشی جدید در مستأجر #{targetTid}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              پرمیژن‌های قابل انتخاب به صورت خودکار به مجوزهای دارای استحقاق این مستأجر محدود شده‌اند
            </p>

            <form
              onSubmit={handleCreateSubmit}
              className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 pl-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">عنوان فارسی نقش</label>
                  <input
                    id="input-role-name"
                    type="text"
                    required
                    placeholder="مثال: سرپرست کمپین‌های تبلیغاتی"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    کد سیستمی نقش (Code)
                  </label>
                  <input
                    id="input-role-code"
                    type="text"
                    required
                    placeholder="ROLE_CAMPAIGN_LEAD"
                    value={newRole.code}
                    onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">توضیحات اختیارات</label>
                <input
                  type="text"
                  placeholder="توضیح مختصر درباره دامنه اختیارات این نقش..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-800 mb-2 font-bold">
                  انتخاب پرمیژن‌های مجاز مستأجر #{targetTid}:
                </label>

                <div className="space-y-3">
                  {permissionGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                    >
                      <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="font-mono text-[11px] text-indigo-600">{group.code}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(group.permissions || [])
                          .filter((p) => p.entitled !== false)
                          .map((p) => {
                            const isChecked = newRole.selectedPermissions.includes(p.code);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-indigo-50 border-indigo-500'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleNewRolePerm(p.code)}
                                  className="mt-0.5 accent-indigo-600"
                                />
                                <div>
                                  <span className="font-mono text-xs font-bold text-slate-900 block">
                                    {p.code}
                                  </span>
                                  <span className="text-[11px] text-slate-600 block">{p.name}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-role"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد نقش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
