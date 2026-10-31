import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Copy,
  CheckCircle2,
  Key,
  Users,
  ShieldCheck,
  X,
  ArrowUpLeft
} from 'lucide-react';

export default function TenantsPage({
  tenants = [],
  modules = [],
  activeTenantId,
  currentUser,
  onSelectTenant,
  onCreateTenant,
  onUpdateTenant,
  onCloneTenant,
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
    activeModules: ['phonebook', 'sms_single', 'sms_bulk', 'reports']
  });

  const [cloneData, setCloneData] = useState({
    targetCode: '',
    targetName: '',
    targetBaseUrl: '',
    adminUsername: '',
    copyBranding: true,
    copyModules: true,
    copyRoles: true
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const visibleTenants = isSuperAdmin
    ? tenants
    : tenants.filter((t) => t.id === currentUser?.tenantId);

  const handleToggleModuleOnTenant = (tenant, modCode) => {
    if (!isSuperAdmin) return;
    const currentMods = tenant.activeModules || [];
    const nextMods = currentMods.includes(modCode)
      ? currentMods.filter((m) => m !== modCode)
      : [...currentMods, modCode];
    onUpdateTenant(tenant.id, {
      ...tenant,
      activeModules: nextMods
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTenant.code || !newTenant.name) return;
    onCreateTenant({
      ...newTenant,
      baseUrl: newTenant.baseUrl || `https://${newTenant.code}.asan.com`
    });
    setIsCreateOpen(false);
    setNewTenant({
      code: '',
      name: '',
      baseUrl: '',
      description: '',
      adminUsername: '',
      activeModules: ['phonebook', 'sms_single', 'sms_bulk', 'reports']
    });
  };

  const handleCloneSubmit = (e) => {
    e.preventDefault();
    if (!cloneSourceTenant || !cloneData.targetCode || !cloneData.targetName) return;
    onCloneTenant(cloneSourceTenant.id, {
      ...cloneData,
      targetBaseUrl: cloneData.targetBaseUrl || `https://${cloneData.targetCode}.asan.com`
    });
    setCloneSourceTenant(null);
    setCloneData({
      targetCode: '',
      targetName: '',
      targetBaseUrl: '',
      adminUsername: '',
      copyBranding: true,
      copyModules: true,
      copyRoles: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>مدیریت مستأجرین، ماژول‌های فعال و کلون‌سازی (Tenant Lifecycle & Cloning)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? 'تعریف مستأجر جدید، کلون یک‌کلیکی مستأجرین همراه با نقش‌ها و پرمیژن‌ها، و مدیریت ماژول‌های هر مستأجر در admin.asan.com'
              : 'مشاهده اطلاعات پایه، دامنه و ماژول‌های فعال مستأجر شما در درگاه یکپارچه admin.asan.com'}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف مستأجر جدید</span>
          </button>
        )}
      </div>

      {/* Tenants List */}
      <div className="grid grid-cols-1 gap-5">
        {visibleTenants.map((tenant) => {
          const isSelected = String(tenant.id) === String(activeTenantId);
          return (
            <div
              key={tenant.id}
              className={`bg-[#111827] rounded-2xl border p-6 transition-colors ${
                isSelected ? 'border-sky-500/80' : 'border-slate-800/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-mono mb-1">
                    <span className="text-sky-400 font-bold">Tenant #{tenant.id}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">{tenant.code}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{tenant.baseUrl}</span>
                    {isSelected && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-emerald-400 font-sans font-semibold">قلمرو فعال جاری</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{tenant.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{tenant.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onManageTenantPermissions(tenant.id)}
                    className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>مدیریت پرمیژن‌های مستأجر</span>
                    <ArrowUpLeft className="w-3.5 h-3.5" />
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setCloneSourceTenant(tenant);
                        setCloneData({
                          targetCode: `${tenant.code}_branch`,
                          targetName: `شعبه جدید ${tenant.name}`,
                          targetBaseUrl: `https://${tenant.code}-branch.asan.com`,
                          adminUsername: `${tenant.code}_branch_admin`,
                          copyBranding: true,
                          copyModules: true,
                          copyRoles: true
                        });
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>کلون مستأجر (Clone)</span>
                    </button>
                  )}

                  {isSuperAdmin && !isSelected && (
                    <button
                      type="button"
                      onClick={() => onSelectTenant(String(tenant.id))}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      انتخاب به عنوان قلمرو فعال
                    </button>
                  )}
                </div>
              </div>

              {/* Tenant Stats & Auth Flags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800/70 text-xs">
                <div>
                  <span className="text-slate-500 block">ادمین اصلی مستأجر</span>
                  <span className="font-mono font-semibold text-slate-200 mt-0.5 block">
                    @{tenant.adminUsername || 'admin'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">کاربران ثبت‌شده</span>
                  <span className="font-mono font-semibold text-slate-200 mt-0.5 block tabular-nums">
                    {tenant.userCount ?? 2} کاربر
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">پرمیژن‌های دارای استحقاق</span>
                  <span className="font-mono font-semibold text-emerald-400 mt-0.5 block tabular-nums">
                    {tenant.entitledPermissionCount ?? 12} مجوز فعال
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">سیاست ورود در admin.asan.com</span>
                  <span className="font-mono text-slate-300 mt-0.5 block">
                    {tenant.otpEnabled ? '2FA OTP' : 'Password Only'} · {tenant.passwordEnabled ? 'Legacy Hash' : 'SSO'}
                  </span>
                </div>
              </div>

              {/* Active Modules Matrix (/api/admin/modules) */}
              <div className="pt-4">
                <div className="text-xs font-semibold text-slate-300 mb-2.5">
                  ماژول‌های سرویس‌دهی مستأجر ({isSuperAdmin ? 'کلیک برای فعال/غیرفعال‌سازی ماژول' : 'وضعیت ماژول‌ها'}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {modules.map((mod) => {
                    const enabled = (tenant.activeModules || []).includes(mod.code);
                    return (
                      <button
                        type="button"
                        key={mod.code}
                        disabled={!isSuperAdmin}
                        onClick={() => handleToggleModuleOnTenant(tenant, mod.code)}
                        className={`p-2.5 rounded-xl border text-right flex items-center justify-between gap-2 transition-colors ${
                          enabled
                            ? 'bg-slate-900/90 border-sky-500/40 text-slate-100'
                            : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
                        } ${isSuperAdmin ? 'cursor-pointer hover:border-sky-500/70' : 'cursor-default'}`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{mod.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{mod.code}</div>
                        </div>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            enabled ? 'text-emerald-400' : 'text-slate-700'
                          }`}
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

      {/* Modal: Create Tenant */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              <span>تعریف مستأجر سازمانی جدید</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">کد یکتای مستأجر (Code)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: payamresan"
                  value={newTenant.code}
                  onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام سازمانی مستأجر</label>
                <input
                  type="text"
                  required
                  placeholder="سامانه پیام‌رسان نوین"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام کاربری ادمین اولیه مستأجر</label>
                <input
                  type="text"
                  required
                  placeholder="payam_admin"
                  value={newTenant.adminUsername}
                  onChange={(e) => setNewTenant({ ...newTenant, adminUsername: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">توضیحات</label>
                <input
                  type="text"
                  placeholder="توضیحات حوزه فعالیت مستأجر..."
                  value={newTenant.description}
                  onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  ایجاد مستأجر و ادمین اولیه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Clone Tenant */}
      {cloneSourceTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCloneSourceTenant(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-400" />
              <span>کلون‌سازی مستأجر از روی «{cloneSourceTenant.name}»</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              POST /api/admin/tenants/{cloneSourceTenant.id}/clone
            </p>

            <form onSubmit={handleCloneSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">کد مستأجر جدید (Target Code)</label>
                <input
                  type="text"
                  required
                  value={cloneData.targetCode}
                  onChange={(e) => setCloneData({ ...cloneData, targetCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام مستأجر جدید</label>
                <input
                  type="text"
                  required
                  value={cloneData.targetName}
                  onChange={(e) => setCloneData({ ...cloneData, targetName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام کاربری ادمین مستأجر جدید</label>
                <input
                  type="text"
                  required
                  value={cloneData.adminUsername}
                  onChange={(e) => setCloneData({ ...cloneData, adminUsername: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneData.copyRoles}
                    onChange={(e) => setCloneData({ ...cloneData, copyRoles: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span>کپی تمام نقش‌ها و ماتریس استحقاق پرمیژن‌ها</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneData.copyModules}
                    onChange={(e) => setCloneData({ ...cloneData, copyModules: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span>کپی ماژول‌های فعال مستأجر مبدأ</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloneSourceTenant(null)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  اجرای کلون و ساخت مستأجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
