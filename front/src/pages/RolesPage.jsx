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
  Unlink
} from 'lucide-react';

export default function RolesPage({
  roles = [],
  permissionGroups = [],
  activeTenantId,
  currentUser,
  onCreateRole,
  onUpdateRole,
  onAttachGroupToRole,
  onDetachGroupFromRole
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span>مهندسی نقش‌ها و اتصال یک‌کلیکی گروه‌های پرمیژن (Role & Group Matrix)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف نقش‌های مقید به مستأجر #{targetTid} با پشتیبانی از اتصال دسته‌ای ماژول‌ها و گارد استحقاق
          </p>
        </div>

        <button
          id="btn-create-role"
          onClick={() => setIsBuilderOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف نقش سفارشی جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Roles List Column */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 px-1">
            فهرست نقش‌های قلمرو ({scopedRoles.length})
          </div>

          <div id="roles-list-container" className="space-y-2">
            {scopedRoles.map((r) => {
              const isSelected = selectedRoleDetail?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] border-sky-500'
                      : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-sky-400">{r.code}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {r.isSystem ? 'System Role' : `Tenant #${r.tenantId}`}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-1">{r.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80 font-mono tabular-nums">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      {(r.permissions || []).length} مجوز
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {r.userCount || 0} کاربر
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Role Detail & Interactive Group/Permission Matrix */}
        <div className="lg:col-span-8">
          {selectedRoleDetail ? (
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 id="role-detail-name" className="text-base font-bold text-white">
                      {selectedRoleDetail.name}
                    </h3>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-xs text-sky-400">
                      {selectedRoleDetail.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedRoleDetail.description}</p>
                </div>

                <div className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                  Tenant #{selectedRoleDetail.tenantId} · {(selectedRoleDetail.permissions || []).length} Active Perms
                </div>
              </div>

              {/* One-Click Permission Group Attachment (Backend Endpoint: /api/admin/roles/:roleId/groups/:groupId) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>اتصال یک‌کلیکی گروه‌های پرمیژن به این نقش (One-Click Group Attach):</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    POST / DELETE /api/admin/roles/{selectedRoleDetail.id}/groups/:groupId
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">{grp.name}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {grp.code} · {groupPermCodes.length} مجوز مجاز
                          </div>
                        </div>

                        {allAttached ? (
                          <button
                            type="button"
                            onClick={() => onDetachGroupFromRole(selectedRoleDetail.id, grp.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 text-[11px] font-medium flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>جداسازی گروه</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={groupPermCodes.length === 0}
                            onClick={() => onAttachGroupToRole(selectedRoleDetail.id, grp.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>اتصال کامل گروه</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permission Matrix on Selected Role */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>ماتریس پرمیژن‌های منتسب به نقش (کلیک برای افزودن یا حذف مجوز):</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>محافظت‌شده توسط گارد استحقاق مستأجر</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {permissionGroups
                    .flatMap((g) => g.permissions || [])
                    .map((perm) => {
                      const isIncluded = (selectedRoleDetail.permissions || []).includes(perm.code);
                      const isEntitled = perm.entitled !== false;

                      return (
                        <button
                          type="button"
                          key={perm.id}
                          disabled={!isEntitled}
                          onClick={() => handleToggleExistingRolePerm(perm.code)}
                          className={`p-3 rounded-xl border text-right flex items-center justify-between gap-3 transition-colors ${
                            !isEntitled
                              ? 'bg-slate-950/40 border-slate-800/40 opacity-45 cursor-not-allowed'
                              : isIncluded
                              ? 'bg-sky-950/30 border-sky-500/60 cursor-pointer'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-semibold text-slate-100 truncate">
                              {perm.code}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {perm.name}
                            </div>
                          </div>

                          <div className="shrink-0 text-[11px] font-mono">
                            {!isEntitled ? (
                              <span className="text-rose-400">REVOKED</span>
                            ) : isIncluded ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                فعال
                              </span>
                            ) : (
                              <span className="text-slate-500">غیرفعال</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-10 text-center text-slate-400 text-xs">
              یک نقش را از ستون سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Role Builder */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsBuilderOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>تعریف نقش سفارشی جدید در مستأجر #{targetTid}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              پرمیژن‌های قابل انتخاب به صورت خودکار به مجوزهای دارای استحقاق این مستأجر محدود شده‌اند
            </p>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 pl-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">عنوان فارسی نقش</label>
                  <input
                    id="input-role-name"
                    type="text"
                    required
                    placeholder="مثال: سرپرست کمپین‌های تبلیغاتی"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">کد سیستمی نقش (Code)</label>
                  <input
                    id="input-role-code"
                    type="text"
                    required
                    placeholder="ROLE_CAMPAIGN_LEAD"
                    value={newRole.code}
                    onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">توضیحات اختیارات</label>
                <input
                  type="text"
                  placeholder="توضیح مختصر درباره دامنه اختیارات این نقش..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-bold">
                  انتخاب پرمیژن‌های مجاز مستأجر #{targetTid}:
                </label>

                <div className="space-y-3">
                  {permissionGroups.map((group) => (
                    <div key={group.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                      <div className="font-bold text-slate-200 mb-2 flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="font-mono text-[11px] text-sky-400">{group.code}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(group.permissions || [])
                          .filter((p) => p.entitled !== false)
                          .map((p) => {
                            const isChecked = newRole.selectedPermissions.includes(p.code);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-sky-950/50 border-sky-500'
                                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleNewRolePerm(p.code)}
                                  className="mt-0.5 accent-sky-500"
                                />
                                <div>
                                  <span className="font-mono text-xs font-semibold text-slate-200 block">
                                    {p.code}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">{p.name}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-role"
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
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
