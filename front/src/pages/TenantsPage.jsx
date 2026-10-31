import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Copy,
  Key,
  CheckCircle2,
  Layers,
  X,
  ShieldAlert,
  Trash2
} from 'lucide-react';

export default function TenantsPage({
  tenants = [],
  modules = [],
  activeTenantId,
  currentUser,
  onSelectTenant,
  onCreateTenant,
  onUpdateTenant,
  onDeleteTenant,
  onCloneTenant,
  onImpersonateTenant,
  onManageTenantPermissions
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cloneSourceTenant, setCloneSourceTenant] = useState(null);

  const [newTenant, setNewTenant] = useState({
    code: '',
    name: '',
    baseUrl: '',
    description: '',
    adminUsername: '',
    activeModules: ['phonebook', 'sms_single', 'reports', 'finance']
  });

  const [cloneData, setCloneData] = useState({
    targetCode: '',
    targetName: '',
    targetBaseUrl: '',
    adminUsername: '',
    copyRoles: true
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleToggleModuleForExisting = (tenant, moduleCode) => {
    if (!isSuperAdmin || !onUpdateTenant) return;
    const currentMods = tenant.activeModules || [];
    const updatedMods = currentMods.includes(moduleCode)
      ? currentMods.filter((m) => m !== moduleCode)
      : [...currentMods, moduleCode];
    onUpdateTenant(tenant.id, { activeModules: updatedMods });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTenant.code || !newTenant.name) return;
    onCreateTenant(newTenant);
    setIsCreateOpen(false);
    setNewTenant({
      code: '',
      name: '',
      baseUrl: '',
      description: '',
      adminUsername: '',
      activeModules: ['phonebook', 'sms_single', 'reports', 'finance']
    });
  };

  const openCloneModal = (tenant) => {
    setCloneSourceTenant(tenant);
    setCloneData({
      targetCode: `${tenant.code}_v2`,
      targetName: `${tenant.name} (نسخه کلون)`,
      targetBaseUrl: `https://${tenant.code}-v2.asan.com`,
      adminUsername: `${tenant.code}_v2_admin`,
      copyRoles: true
    });
  };

  const handleCloneSubmit = (e) => {
    e.preventDefault();
    if (!cloneSourceTenant || !cloneData.targetCode) return;
    onCloneTenant(cloneSourceTenant.id, cloneData);
    setCloneSourceTenant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-card p-5 rounded-xl border border-slate-200 border-r-4 border-r-indigo-600 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>مدیریت چرخه حیات مستأجرین، ماژول‌های فعال و کلونینگ یک‌کلیکی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            GET / POST / PUT / DELETE /api/admin/tenants · POST /api/admin/tenants/:id/clone · /impersonate
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد مستأجر جدید</span>
          </button>
        )}
      </div>

      {/* Tenants Table Summary */}
      <div className="bg-theme-card border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">شناسه و کد</th>
                <th className="py-3.5 px-4">نام مستأجر و دامنه</th>
                <th className="py-3.5 px-4">ادمین مستأجر</th>
                <th className="py-3.5 px-4 text-center">ماژول‌های فعال</th>
                <th className="py-3.5 px-4 text-center">سیاست ۲FA</th>
                <th className="py-3.5 px-4 text-left">عملیات راهبری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {tenants.map((t) => {
                const isSelected = String(t.id) === String(activeTenantId);
                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className="font-bold text-indigo-600">{t.code}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-slate-500">#{t.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">{t.baseUrl}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                      @{t.adminUsername || 'admin'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                      {(t.activeModules || []).length} ماژول
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600">
                      OTP: {t.otpEnabled ? 'ON' : 'OFF'} · Captcha: {t.captchaEnabled ? 'ON' : 'OFF'}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectTenant(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50 text-teal-800 border border-teal-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          {isSelected ? 'قلمرو فعال' : 'انتخاب قلمرو'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onManageTenantPermissions(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>استحقاق پرمیژن</span>
                        </button>

                        {isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => openCloneModal(t)}
                              className="px-3 py-1.5 rounded-lg bg-theme-card hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="POST /api/admin/tenants/:id/clone"
                            >
                              <Copy className="w-3.5 h-3.5 text-indigo-600" />
                              <span>کلون</span>
                            </button>

                            {t.id !== 1 && onImpersonateTenant && (
                              <button
                                type="button"
                                onClick={() => onImpersonateTenant(t.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="POST /api/admin/tenants/:id/impersonate"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                <span>ورود ادمین</span>
                              </button>
                            )}

                            {t.id !== 1 && onDeleteTenant && (
                              <button
                                type="button"
                                onClick={() => onDeleteTenant(t.id, t.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="DELETE /api/admin/tenants/:id"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
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

      {/* Tenant Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {tenants.map((t) => {
          const isSelected = String(t.id) === String(activeTenantId);
          return (
            <div
              key={t.id}
              className={`bg-theme-card rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-colors ${
                isSelected ? 'border-indigo-500 shadow-sm' : 'border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-mono text-xs font-bold text-indigo-600">
                      {t.code} · Tenant #{t.id}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{t.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">@{t.adminUsername}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                <div>
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ماژول‌های فعال مستأجر (کلیک جهت تغییر وضعیت):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {modules.map((mod) => {
                      const active = (t.activeModules || []).includes(mod.code);
                      return (
                        <button
                          key={mod.code}
                          type="button"
                          disabled={!isSuperAdmin}
                          onClick={() => handleToggleModuleForExisting(t, mod.code)}
                          className={`px-2.5 py-1.5 rounded-lg border text-right text-[11px] flex items-center justify-between gap-1 transition-colors ${
                            active
                              ? 'bg-indigo-50/70 border-indigo-400 text-indigo-900 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          } ${isSuperAdmin ? 'cursor-pointer hover:border-indigo-500' : 'cursor-default'}`}
                        >
                          <span className="truncate">{mod.name}</span>
                          {active && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Tenant */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>ایجاد مستأجر جدید (POST /api/admin/tenants)</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    کد یکتا (Tenant Code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="payamak_corp"
                    value={newTenant.code}
                    onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">نام فارسی مستأجر</label>
                  <input
                    type="text"
                    required
                    placeholder="پیامک سازمانی سپهر"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">آدرس دامنه</label>
                  <input
                    type="text"
                    placeholder="https://sepehr.asan.com"
                    value={newTenant.baseUrl}
                    onChange={(e) => setNewTenant({ ...newTenant, baseUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    نام کاربری ادمین اولیه
                  </label>
                  <input
                    type="text"
                    placeholder="sepehr_admin"
                    value={newTenant.adminUsername}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, adminUsername: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">توضیحات</label>
                <input
                  type="text"
                  placeholder="توضیح کوتاه درباره سازمان یا کاربرد مستأجر..."
                  value={newTenant.description}
                  onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد مستأجر و حساب ادمین
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Clone Tenant */}
      {cloneSourceTenant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCloneSourceTenant(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-600" />
              <span>کلون کردن مستأجر از روی «{cloneSourceTenant.name}»</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              POST /api/admin/tenants/{cloneSourceTenant.id}/clone
            </p>

            <form onSubmit={handleCloneSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">کد مستأجر مقصد</label>
                  <input
                    type="text"
                    required
                    value={cloneData.targetCode}
                    onChange={(e) => setCloneData({ ...cloneData, targetCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">نام مستأجر مقصد</label>
                  <input
                    type="text"
                    required
                    value={cloneData.targetName}
                    onChange={(e) => setCloneData({ ...cloneData, targetName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">دامنه مقصد</label>
                  <input
                    type="text"
                    value={cloneData.targetBaseUrl}
                    onChange={(e) => setCloneData({ ...cloneData, targetBaseUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    نام کاربری ادمین جدید
                  </label>
                  <input
                    type="text"
                    value={cloneData.adminUsername}
                    onChange={(e) => setCloneData({ ...cloneData, adminUsername: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={cloneData.copyRoles}
                  onChange={(e) => setCloneData({ ...cloneData, copyRoles: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4"
                />
                <span>کپی کردن کلیه نقش‌های سفارشی و استحقاق پرمیژن‌ها</span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloneSourceTenant(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  اجرای عملیات کلون مستأجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
