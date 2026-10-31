import React from 'react';
import { ShieldAlert, Laptop, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function AuditPage({
  auditLogs = [],
  sessions = [],
  currentUser,
  onRevokeSession
}) {
  return (
    <div className="space-y-6">
      {/* Active Sessions Section (/api/sessions/my) */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-sky-400" />
              <span>نشست‌های فعال در درگاه admin.asan.com (Active Sessions)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              واکشی زنده از <code className="font-mono text-sky-400">GET /api/sessions/my</code> — امکان ابطال آنی نشست‌ها
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {sessions.length} نشست فعال
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sky-400">@{sess.username}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Tenant #{sess.tenantId}
                  </span>
                </div>
                <div className="text-slate-200 font-medium">{sess.userAgent}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                  IP: {sess.ip} · {sess.createdAt}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-500">
                  {sess.sessionTokenId}
                </span>
                {sess.current ? (
                  <span className="text-[11px] text-emerald-400 font-semibold">نشست جاری</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRevokeSession && onRevokeSession(sess.id)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ابطال نشست</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>لاگ ممیزی تغییرات پرمیژن و جعل هویت (RFC 8693 Security Audit Trail)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ثبت تمامی رخدادهای اعطا/سلب پرمیژن مستأجرین، تغییر نقش کاربران و تبادل توکن جعل هویت
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {auditLogs.length} رخداد ثبت‌شده
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">شناسه</th>
                <th className="py-3.5 px-4">زمان ثبت</th>
                <th className="py-3.5 px-4">کاربر مجری (Actor)</th>
                <th className="py-3.5 px-4">هدف عملیات</th>
                <th className="py-3.5 px-4">نوع رخداد</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4">شرح فنی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400 tabular-nums">
                    {log.id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px] tabular-nums">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-sky-400">
                    @{log.actor}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">{log.target}</td>
                  <td className="py-3 px-4 font-mono text-amber-300">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {log.status === 'SUCCESS' ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        {log.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
