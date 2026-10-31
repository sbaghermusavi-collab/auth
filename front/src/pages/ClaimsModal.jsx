import React from 'react';
import { X, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ClaimsModal({ currentUser, onClose }) {
  const jwtPayload = {
    iss: 'http://auth.bagherlocal.ir/auth',
    sub: currentUser.isImpersonated ? '111' : currentUser.username === 'superadmin' ? '999' : '110',
    preferred_username: currentUser.username,
    tenant_id: String(currentUser.tenantId || 10),
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
    scope: 'openid profile email admin',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <span>کلیم‌های توکن احراز هویت (RFC 8693 Live JWT Payload)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          نمایش اطلاعات رمزنگاری‌شده در نشست جاری درگاه BFF و سرور Auth
        </p>

        {currentUser.isImpersonated && (
          <div className="mb-3 bg-amber-950/60 border border-amber-800/80 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>توکن در حالت جعل هویت صادر شده است:</strong> کلیم <code>act</code> شامل شناسه ادمین واقعی صادرکننده درخواست است.
            </div>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72">
          <pre id="jwt-payload-view">{JSON.stringify(jwtPayload, null, 2)}</pre>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
