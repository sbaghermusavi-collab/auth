import React from 'react';
import { X, KeyRound, ShieldAlert } from 'lucide-react';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

export default function ClaimsModal({ currentUser, activeTenantId, onClose }) {
  const jwtPayload = {
    iss: `https://${UNIFIED_ADMIN_HOST}/auth`,
    aud: UNIFIED_ADMIN_HOST,
    sub: currentUser.isImpersonated ? '111' : currentUser.username === 'superadmin' ? '999' : '110',
    preferred_username: currentUser.targetUsername || currentUser.username,
    tenant_id: String(activeTenantId || currentUser.tenantId || 10),
    tenant_code: currentUser.tenantName || 'smslocal',
    roles: currentUser.roles || [currentUser.role],
    is_impersonated: !!currentUser.isImpersonated,
    act: currentUser.isImpersonated
      ? {
          sub: currentUser.actor?.sub || '110',
          username: currentUser.actor?.username || 'sms_admin',
          tenant_id: String(currentUser.actor?.tenantId || 10)
        }
      : null,
    scope: 'openid profile email admin:governance',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-sky-400" />
          <span>محتوای توکن نشست در {UNIFIED_ADMIN_HOST} (JWT Payload)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          کلیم‌های صادر شده برای احراز هویت و کنترل دسترسی در درگاه BFF
        </p>

        {currentUser.isImpersonated && (
          <div className="mb-3 bg-amber-950/50 border border-amber-800/80 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>نشست در حالت جعل هویت (RFC 8693):</strong> کلیم <code className="font-mono">act</code> مشخصات ادمین اصلی صادرکننده درخواست را نگهداری می‌کند.
            </div>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-x-auto max-h-80">
          <pre id="jwt-payload-view">{JSON.stringify(jwtPayload, null, 2)}</pre>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
