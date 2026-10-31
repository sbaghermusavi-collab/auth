import React, { useState } from 'react';
import {
  ShieldAlert,
  Laptop,
  Trash2,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react';

export default function AuditPage({
  auditLogs = [],
  sessions = [],
  currentUser,
  onRevokeSession,
  onRevokeAllOtherSessions
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.actor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Active Sessions Management (/api/sessions/my, DELETE /api/sessions/:id, DELETE /api/sessions/all-other) */}
      <div className="bg-theme-card border border-slate-200 border-r-4 border-r-indigo-600 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              <span>مدیریت نشست‌های فعال و توکن‌ها (Session Management)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              GET /api/sessions/my · DELETE /api/sessions/:id · DELETE /api/sessions/all-other
            </p>
          </div>

          {onRevokeAllOtherSessions && (
            <button
              type="button"
              onClick={onRevokeAllOtherSessions}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ابطال سایر نشست‌ها (DELETE /api/sessions/all-other)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                s.current
                  ? 'bg-indigo-50/50 border-indigo-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-600">@{s.username}</span>
                  <span className="font-mono text-[11px] text-slate-500">{s.sessionTokenId}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{s.device}</div>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  IP: {s.ip} · Tenant #{s.tenantId}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{s.createdAt}</span>
                {s.current ? (
                  <span className="text-teal-700 font-bold text-[11px]">نشست فعلی شما</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRevokeSession(s.id)}
                    className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
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

      {/* Section 2: Security Audit Trail Table */}
      <div className="bg-theme-card border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>لاگ ممیزی امنیتی و وقایع دسترسی (Audit Trail — RFC 8693)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              GET /api/admin/audit-logs · GET /api/reports/users/:username/logs
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام عامل، هدف یا عملیات..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">شناسه و زمان</th>
                <th className="py-3.5 px-4">عامل (Actor)</th>
                <th className="py-3.5 px-4">عملیات سیستمی</th>
                <th className="py-3.5 px-4">موجودیت هدف</th>
                <th className="py-3.5 px-4">شرح فنی رویداد</th>
                <th className="py-3.5 px-4 text-left">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <div className="text-slate-900 font-bold">{log.id}</div>
                    <div className="text-[11px] text-slate-500">{log.timestamp}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-indigo-600 font-bold">@{log.actor}</span>
                    <div className="text-[11px] text-slate-500">{log.ip}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{log.target}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">{log.details}</td>
                  <td className="py-3 px-4 text-left font-mono">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SUCCESS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{log.status}</span>
                      </span>
                    )}
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
