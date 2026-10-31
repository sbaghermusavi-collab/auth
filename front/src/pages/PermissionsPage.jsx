import React, { useState } from 'react';
import { 
  Key, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Info,
  SlidersHorizontal
} from 'lucide-react';

export default function PermissionsPage({ permissionGroups, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entitlements, setEntitlements] = useState({
    126: true, // sms.smr.getSmsStats
    127: true, // Campaign
    130: true, // Contacts_Customers
    140: true, // Report_Analytics
    150: true, // USER_READ
    151: true  // USER_WRITE
  });

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const handleToggleEntitlement = (permId, permCode) => {
    if (!isSuperAdmin) {
      alert('تنها راهبر کل پلتفرم (Superadmin) مجاز به سلب یا اعطای استحقاق ماژول‌ها به مستأجرین است.');
      return;
    }
    const currentVal = entitlements[permId];
    setEntitlements({
      ...entitlements,
      [permId]: !currentVal
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>کاتالوگ پرمیژن‌ها و ماتریس استحقاق (Permissions & Entitlements)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            دسته‌بندی ماژول‌های دسترسی و استحقاق‌های اعطاشده به مستأجر {currentUser.tenantName || 'smslocal'}
          </p>
        </div>

        {/* Superadmin Mode Info */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">وضعیت مدیریت:</span>
          <span className={`font-bold ${isSuperAdmin ? 'text-purple-400' : 'text-cyan-400'}`}>
            {isSuperAdmin ? 'سراسری (Superadmin - قابلیت Grant/Revoke)' : 'مقید به مستأجر (ReadOnly)'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجو در کدها و عناوین پرمیژن‌ها..."
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Permission Groups Catalog */}
      <div className="space-y-4">
        {permissionGroups.map((group) => {
          const filteredPerms = group.permissions.filter(
            (p) =>
              p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.name.includes(searchTerm) ||
              p.description.includes(searchTerm)
          );

          if (filteredPerms.length === 0) return null;

          return (
            <div
              key={group.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="bg-slate-850 bg-slate-900/80 px-5 py-3 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm text-slate-100">{group.name}</span>
                  <span className="font-mono text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {group.code}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredPerms.length} مجوز در این ماژول
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPerms.map((perm) => {
                  const isEntitled = entitlements[perm.id] !== false;
                  return (
                    <div
                      key={perm.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isEntitled
                          ? 'bg-slate-900/60 border-slate-700/80'
                          : 'bg-rose-950/20 border-rose-900/50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {perm.code}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ID: {perm.id}
                          </span>
                        </div>

                        {/* Entitlement Status Badge / Toggle */}
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleToggleEntitlement(perm.id, perm.code)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                              isEntitled
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-rose-950 hover:text-rose-300'
                                : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-emerald-950 hover:text-emerald-300'
                            }`}
                            title="کلیک برای سلب یا اعطای پرمیژن به تننت ۱۰"
                          >
                            {isEntitled ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>مجاز (Revoke?)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>سلب‌شده (Grant?)</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                              isEntitled
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            }`}
                          >
                            {isEntitled ? 'ENTITLED' : 'REVOKED'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-200 mb-1">{perm.name}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed">
                        {perm.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
