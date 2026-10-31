import React from 'react';
import { AlertTriangle, Undo2, ShieldAlert } from 'lucide-react';

export default function ImpersonationBanner({ isImpersonated, targetUser, actor, onRevert }) {
  if (!isImpersonated) return null;

  return (
    <div
      id="impersonation-banner"
      className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-6 py-2.5 font-medium shadow-lg flex items-center justify-between border-b border-amber-600 sticky top-0 z-50 transition-all duration-300"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-950"></span>
        </span>
        
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert className="w-5 h-5 text-amber-950" />
          <span>حالت جعل هویت فعال است (RFC 8693 Impersonation):</span>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-950 text-amber-100 px-3 py-0.5 rounded-full text-xs font-mono font-bold">
          <span>کاربر هدف:</span>
          <span id="banner-target-user">{targetUser}</span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-amber-900/20 text-slate-950 px-2.5 py-0.5 rounded text-xs font-mono border border-amber-800/30">
          <span>actor:</span>
          <span id="banner-actor-info" className="font-bold">{actor?.username || 'sms_admin'}</span>
          <span>(tenant: {actor?.tenantId || 10})</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="btn-revert-impersonation"
          onClick={onRevert}
          className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4 text-amber-400" />
          <span>بازگشت به حساب ادمین اصلی (Revert)</span>
        </button>
      </div>
    </div>
  );
}
