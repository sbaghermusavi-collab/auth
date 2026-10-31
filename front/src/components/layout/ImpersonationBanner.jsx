import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export default function ImpersonationBanner({
  isImpersonated,
  targetUser,
  actor,
  onRevert
}) {
  if (!isImpersonated) return null;

  return (
    <div
      id="impersonation-banner"
      className="bg-amber-50 border-b border-amber-300 text-amber-950 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs"
    >
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold">نشست جعل هویت فعال (RFC 8693 Token Exchange):</span>{' '}
          <span>
            شما با هویت ادمین اصلی{' '}
            <code className="font-mono font-bold text-amber-900">
              @{actor?.username || 'admin'}
            </code>{' '}
            در حال مشاهده و مدیریت سامانه از دیدگاه کاربر{' '}
            <code className="font-mono font-bold text-indigo-700">@{targetUser}</code> هستید.
          </span>
        </div>
      </div>

      <button
        id="btn-revert-impersonation"
        type="button"
        onClick={onRevert}
        className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>بازگشت به نشست اصلی ادمین (POST /api/admin/impersonate/revert)</span>
      </button>
    </div>
  );
}
