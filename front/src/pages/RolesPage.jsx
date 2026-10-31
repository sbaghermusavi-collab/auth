import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Lock, 
  Layers, 
  Key, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileCheck
} from 'lucide-react';

export default function RolesPage({ roles, permissionGroups, currentUser, onCreateRole }) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState(roles[0] || null);
  const [newRole, setNewRole] = useState({
    code: '',
    name: '',
    description: '',
    selectedPermissions: []
  });

  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN' || currentUser.tenantId === 10;

  const handleTogglePermission = (permCode) => {
    const list = newRole.selectedPermissions;
    if (list.includes(permCode)) {
      setNewRole({ ...newRole, selectedPermissions: list.filter((p) => p !== permCode) });
    } else {
      setNewRole({ ...newRole, selectedPermissions: [...list, permCode] });
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newRole.code || !newRole.name) {
      alert('لطفاً عنوان و کد نقش را وارد کنید.');
      return;
    }
    const created = {
      id: Date.now(),
      code: newRole.code.startsWith('ROLE_') ? newRole.code : `ROLE_${newRole.code.toUpperCase()}`,
      name: newRole.name,
      description: newRole.description || 'نقش سفارشی مستأجر',
      tenantId: currentUser.tenantId || 10,
      isSystem: false,
      userCount: 0,
      permissions: newRole.selectedPermissions
    };
    onCreateRole(created);
    setIsBuilderOpen(false);
    setSelectedRoleDetail(created);
    setNewRole({ code: '', name: '', description: '', selectedPermissions: [] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>مدیریت نقش‌ها و ماتریس استحقاق (Role Management)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف نقش‌های مقید به مستأجر (Scoped Roles) با کنترل گارد استحقاق پرمیژن‌ها
          </p>
        </div>

        <button
          id="btn-create-role"
          onClick={() => setIsBuilderOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ ایجاد نقش سفارشی جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            فهرست نقش‌های فعال ({roles.length})
          </div>

          <div id="roles-list-container" className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRoleDetail?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleDetail(r)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'bg-slate-850 bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">{r.code}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        r.isSystem
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {r.isSystem ? 'سیستمی' : 'سفارشی مستأجر'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-1">{r.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      {r.permissions.length} مجوز
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      {r.userCount || 0} کاربر منتسب
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Role Detail & Entitlements */}
        <div className="lg:col-span-2">
          {selectedRoleDetail ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 id="role-detail-name" className="text-base font-bold text-white">
                      {selectedRoleDetail.name}
                    </h3>
                    <span className="font-mono text-xs bg-slate-900 text-cyan-300 px-2.5 py-0.5 rounded border border-slate-700">
                      {selectedRoleDetail.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedRoleDetail.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded-xl text-xs font-mono">
                    مستأجر: {selectedRoleDetail.tenantId}
                  </span>
                </div>
              </div>

              {/* Scoped Entitlement Guard Notice */}
              <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-xl p-3 text-xs text-cyan-300 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>گارد استحقاق مستأجر (Entitlement Guard Active):</strong>
                  <span className="text-cyan-400/80 block mt-0.5">
                    این نقش صرفاً مجاز است از پرمیژن‌های استحقاق‌یافته برای مستأجر {currentUser.tenantId} استفاده کند. هرگونه مجوز خارج از این حوزه در لایه سرور مسدود خواهد شد.
                  </span>
                </div>
              </div>

              {/* Matrix of Included Permissions */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>مجوزهای منتسب به این نقش:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedRoleDetail.permissions.map((permCode) => (
                    <div
                      key={permCode}
                      className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-200 block">{permCode}</span>
                          <span className="text-[10px] text-slate-400">دارای استحقاق در تننت ۱۰</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded font-mono">
                        ENTITLED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 text-center text-slate-400">
              یک نقش را از فهرست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Role Builder */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsBuilderOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>سازنده نقش مقید جدید (Role Builder)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              تعریف نقش جدید در حوزه مستأجر {currentUser.tenantName || 'smslocal'}
            </p>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 pl-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">عنوان نقش (فارسی)</label>
                  <input
                    id="input-role-name"
                    type="text"
                    required
                    placeholder="مثال: کارشناس تیکتینگ و پیامک"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">کد لاتین نقش (Code)</label>
                  <input
                    id="input-role-code"
                    type="text"
                    required
                    placeholder="مثال: ROLE_SMS_SUPPORT"
                    value={newRole.code}
                    onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">توضیحات عملکرد نقش</label>
                <input
                  type="text"
                  placeholder="اختیارات و مسوولیت‌های این نقش..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Permission Matrix with Entitlement Selection */}
              <div>
                <label className="block text-slate-300 mb-2 font-bold flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>انتخاب پرمیژن‌های مجاز (محدود به استحقاق مستأجر ۱۰):</span>
                </label>

                <div className="space-y-3">
                  {permissionGroups.map((group) => (
                    <div key={group.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                      <div className="font-bold text-slate-200 mb-2 text-xs flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{group.code}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((p) => {
                          const isChecked = newRole.selectedPermissions.includes(p.code);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                isChecked
                                  ? 'bg-cyan-950/60 border-cyan-600'
                                  : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p.code)}
                                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-cyan-600"
                              />
                              <div>
                                <span className="font-mono text-xs font-semibold text-slate-200 block">{p.code}</span>
                                <span className="text-[10px] text-slate-400 block">{p.name}</span>
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
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  id="btn-submit-create-role"
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-cyan-900/30 cursor-pointer"
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
