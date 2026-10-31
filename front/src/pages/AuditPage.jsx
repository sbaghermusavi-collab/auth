import React from 'react';
import { ShieldAlert, ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AuditPage({ currentUser }) {
  const auditLogs = [
    {
      id: 'AUD-901',
      timestamp: '۱۴۰۵/۰۷/۱۹ ۲۰:۱۵:۴۲',
      actor: 'sms_admin',
      target: 'sms_user',
      action: 'IMPERSONATE_USER',
      tenantId: 10,
      status: 'SUCCESS',
      ip: '127.0.0.1',
      details: 'RFC 8693 token exchange via BFF Gateway'
    },
    {
      id: 'AUD-889',
      timestamp: '۱۴۰۵/۰۷/۱۹ ۱۹:۴۰:۱۰',
      actor: 'superadmin',
      target: 'TENANT_10',
      action: 'REVOKE_PERMISSION_126',
      tenantId: 1,
      status: 'SUCCESS',
      ip: '127.0.0.1',
      details: 'Revoked sms.smr.getSmsStats from tenant smslocal'
    },
    {
      id: 'AUD-874',
      timestamp: '۱۴۰۵/۰۷/۱۹ ۱۸:۳۰:۰۰',
      actor: 'sms_admin',
      target: 'asan_user (Tenant 20)',
      action: 'CROSS_TENANT_IMPERSONATE',
      tenantId: 10,
      status: 'BLOCKED_403',
      ip: '127.0.0.1',
      details: 'Rejected by Security Boundary Guard: Outside tenant'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>ممیزی جعل هویت و لاگ‌های امنیتی (RFC 8693 Audit Trail)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          ثبت تغییر هویت‌ها، انتساب نقش‌ها و رخدادهای رد صلاحیت دسترسی در سراسر مستأجرین
        </p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-3 px-4">شناسه لاگ</th>
              <th className="py-3 px-4">زمان ثبت</th>
              <th className="py-3 px-4">کاربر مجری (Actor)</th>
              <th className="py-3 px-4">هدف عملیات (Target)</th>
              <th className="py-3 px-4">نوع عملیات</th>
              <th className="py-3 px-4">وضعیت</th>
              <th className="py-3 px-4">توضیحات و رخداد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-750/50 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-400">{log.id}</td>
                <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{log.timestamp}</td>
                <td className="py-3 px-4 font-mono font-semibold text-cyan-300">@{log.actor}</td>
                <td className="py-3 px-4 font-mono text-slate-200">{log.target}</td>
                <td className="py-3 px-4 font-mono text-xs text-amber-300">{log.action}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
