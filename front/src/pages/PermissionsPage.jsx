import React, { useState } from 'react';
import {
  Key,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Building2
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
  onCreatePermission
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ENTITLED' | 'REVOKED'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPerm, setNewPerm] = useState({
    code: '',
    name: '',
    description: '',
    groupCode: 'SMS_ENGINE'
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const targetTid = Number(activeTenantId || currentUser?.tenantId || 10);
  const activeTenant = tenants.find((t) => Number(t.id) === targetTid);

  const handleTogglePermEntitlement = (perm) => {
    if (!isSuperAdmin) return;
    if (perm.entitled !== false) {
      onRevokePermission(targetTid, perm.id, perm.code);
    } else {
      onGrantPermission(targetTid, perm.id, perm.code);
    }
  };

  const handleToggleGroupEntitlement = (group) => {
    if (!isSuperAdmin) return;
    const allEntitled = (group.permissions || []).every((p) => p.entitled !== false);
    if (allEntitled) {
      onRevokeGroup(targetTid, group.id, group.code);
    } else {
      onGrantGroup(targetTid, group.id, group.code);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newPerm.code || !newPerm.name) return;
    onCreatePermission({
      ...newPerm,
      entitleToTenantId: targetTid
    });
    setIsCreateModalOpen(false);
    setNewPerm({ code: '', name: '', description: '', groupCode: 'SMS_ENGINE' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Super Admin Tenant Target Bar */}
      <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>
              {isSuperAdmin
                ? 'مدیریت استحقاق پرمیژن‌های مستأجر (Super Admin Tenant Entitlement Control)'
                : `کاتالوگ پرمیژن‌ها و سقف استحقاق مستأجر (${activeTenant?.name || currentUser.tenantName})`}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? 'به عنوان راهبر کل در admin.asan.com می‌توانید پرمیژن‌ها یا ماژول‌های کامل را به هر مستأجر اعطا (Grant) یا از آن سلب (Revoke) نمایید.'
              : 'فهرست مجوزهایی که توسط راهبر کل پلتفرم در admin.asan.com برای مستأجر شما فعال شده و قابل تخصیص به کاربران و نقش‌هاست.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isSuperAdmin && tenants.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span className="text-slate-400">مستأجر در حال ویرایش:</span>
              <select
                value={targetTid}
                onChange={(e) => onTenantSwitch && onTenantSwitch(e.target.value)}
                className="bg-transparent text-slate-100 font-semibold outline-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.name} (#{t.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف پرمیژن جدید در کاتالوگ</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در کد پرمیژن (مثلاً sms.smr.getSmsStats) یا عنوان فارسی..."
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg shrink-0">
          {[
            { id: 'ALL', label: 'همه پرمیژن‌ها' },
            { id: 'ENTITLED', label: 'دارای استحقاق (Entitled)' },
            { id: 'REVOKED', label: 'سلب‌شده (Revoked)' }
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

      {/* Permission Groups & Granular Entitlement Matrix */}
      <div className="space-y-5">
        {permissionGroups.map((group) => {
          const filteredPerms = (group.permissions || []).filter((p) => {
            const matchesSearch =
              p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.name.includes(searchTerm) ||
              (p.description && p.description.includes(searchTerm));
            const isEntitled = p.entitled !== false;
            const matchesStatus =
              statusFilter === 'ALL' ||
              (statusFilter === 'ENTITLED' && isEntitled) ||
              (statusFilter === 'REVOKED' && !isEntitled);
            return matchesSearch && matchesStatus;
          });

          if (filteredPerms.length === 0) return null;

          const allGroupEntitled = (group.permissions || []).every((p) => p.entitled !== false);
          const entitledInGroupCount = (group.permissions || []).filter((p) => p.entitled !== false).length;

          return (
            <div
              key={group.id}
              className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden"
            >
              {/* Group Header Bar */}
              <div className="bg-slate-900/90 px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-sm text-slate-100">{group.name}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-xs text-sky-400">{group.code}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {entitledInGroupCount}/{(group.permissions || []).length} مجاز در مستأجر #{targetTid}
                  </span>
                </div>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleGroupEntitlement(group)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      allGroupEntitled
                        ? 'bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {allGroupEntitled
                      ? 'سلب کل ماژول از این مستأجر (Revoke Group)'
                      : 'اعطای کل ماژول به این مستأجر (Grant Group)'}
                  </button>
                )}
              </div>

              {/* Permissions Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPerms.map((perm) => {
                  const isEntitled = perm.entitled !== false;
                  return (
                    <div
                      key={perm.id}
                      className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                        isEntitled
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-rose-950/15 border-rose-900/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="font-mono text-xs font-bold text-amber-300">
                            {perm.code}
                            <span className="text-slate-600 mx-1.5">·</span>
                            <span className="text-[11px] text-slate-500 font-normal tabular-nums">
                              ID #{perm.id}
                            </span>
                          </div>

                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePermEntitlement(perm)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                                isEntitled
                                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-800'
                                  : 'bg-rose-950/70 text-rose-300 border border-rose-800/70 hover:bg-emerald-950 hover:text-emerald-200 hover:border-emerald-800'
                              }`}
                              title="تغییر وضعیت استحقاق مستأجر"
                            >
                              {isEntitled ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>مجاز (کلیک برای سلب)</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  <span>سلب‌شده (کلیک برای اعطا)</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${
                                isEntitled ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isEntitled ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ENTITLED</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>REVOKED</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-100 mb-1">{perm.name}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">
                          {perm.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Global Permission (Super Admin) */}
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
              <Key className="w-5 h-5 text-amber-400" />
              <span>تعریف پرمیژن جدید در کاتالوگ سراسری</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">کد فنی پرمیژن (Code)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: sms.VoiceOtp.send"
                  value={newPerm.code}
                  onChange={(e) => setNewPerm({ ...newPerm, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">عنوان فارسی پرمیژن</label>
                <input
                  type="text"
                  required
                  placeholder="ارسال پیامک صوتی OTP"
                  value={newPerm.name}
                  onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">گروه ماژول</label>
                <select
                  value={newPerm.groupCode}
                  onChange={(e) => setNewPerm({ ...newPerm, groupCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  {permissionGroups.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">توضیحات</label>
                <input
                  type="text"
                  placeholder="توضیحات عملیاتی این مجوز..."
                  value={newPerm.description}
                  onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
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
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ثبت و اعطا به مستأجر #{targetTid}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
