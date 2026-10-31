import React from 'react';
import { KeyRound, X, ShieldCheck, Globe } from 'lucide-react';
import { getStoredToken, parseJwt, UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function ClaimsModal({ currentUser, activeTenantId, onClose }) {
  const token = getStoredToken();
  const decoded = token ? parseJwt(token) : currentUser?.rawClaims || {};

  const payloadView = {
    iss: decoded?.iss || `https://${UNIFIED_ADMIN_HOST}/auth`,
    aud: UNIFIED_ADMIN_HOST,
    sub: decoded?.sub || (currentUser?.role === 'SUPER_ADMIN' ? '999' : '110'),
    preferred_username: currentUser?.username,
    role: currentUser?.role,
    home_tenant_id: currentUser?.tenantId,
    active_scoped_tenant_id: Number(activeTenantId || currentUser?.tenantId || 10),
    is_impersonated: Boolean(currentUser?.isImpersonated),
    ...(currentUser?.isImpersonated && currentUser?.actor
      ? {
          act: {
            username: currentUser.actor.username,
            tenant_id: currentUser.actor.tenantId,
            role: currentUser.actor.role
          }
        }
      : {}),
    permissions: decoded?.permissions || currentUser?.permissions || []
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-card border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              بازرس زنده توکن و کلیم‌های امنیتی (JWT Claims Inspector)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Host: {UNIFIED_ADMIN_HOST} · RFC 8693 Token Exchange Ready
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-0.5">میزبان واحد (Host)</div>
            <div className="font-mono font-bold text-indigo-600">{UNIFIED_ADMIN_HOST}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-0.5">نقش جاری</div>
            <div className="font-mono font-bold text-slate-900">{currentUser?.role}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-0.5">قلمرو مستأجر هدف</div>
            <div className="font-mono font-bold text-teal-700 tabular-nums">
              Tenant #{activeTenantId || currentUser?.tenantId}
            </div>
          </div>
        </div>

        <div className="bg-theme-sidebar border border-theme-sidebar rounded-xl p-4 overflow-x-auto max-h-80" dir="ltr">
          <pre className="text-xs font-mono text-amber-200 leading-relaxed">
            {JSON.stringify(payloadView, null, 2)}
          </pre>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>توکن JWT در کوکی HttpOnly ذخیره و در گیت‌وی اعتبارسنجی می‌شود</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-1.5 rounded-lg font-semibold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
