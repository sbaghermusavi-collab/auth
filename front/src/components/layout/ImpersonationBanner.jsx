import React from 'react';
import { Undo2, ShieldAlert } from 'lucide-react';

export default function ImpersonationBanner({ isImpersonated, targetUser, actor, onRevert }) {
  if (!isImpersonated) return null;

  return (
    <div
      id="impersonation-banner"
      className="bg-amber-500 text-slate-950 px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b border-amber-600 sticky top-0 z-50"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert className="w-4 h-4 text-slate-950" />
          <span>نشست جعل هویت فعال است (RFC 8693 Token Exchange)</span>
        </div>
        <span aria-hidden="true">·</span>
        <div className="font-mono">
          <span>کاربر هدف: </span>
          <strong id="banner-target-user">@{targetUser}</strong>
        </div>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <div className="hidden sm:block font-mono">
          <span>صادرکننده (Actor): </span>
          <strong id="banner-actor-info">@{actor?.username || 'admin'}</strong>
          <span> (Tenant #{actor?.tenantId || 1})</span>
        </div>
      </div>

      <button
        id="btn-revert-impersonation"
        onClick={onRevert}
        className="bg-slate-950 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Undo2 className="w-3.5 h-3.5 text-amber-400" />
        <span>پایان جعل هویت و بازگشت به ادمین</span>
      </button>
    </div>
  );
}
