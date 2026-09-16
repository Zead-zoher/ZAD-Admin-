import React, { useState } from 'react';
import { Terminal, Activity, Clock, ShieldAlert, CheckCircle2, Info, Trash2, Download, RefreshCw, Smartphone } from 'lucide-react';
import { AccessLog } from '../types';

interface LiveLogsTableProps {
  logs: AccessLog[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
}

export const LiveLogsTable: React.FC<LiveLogsTableProps> = ({ logs, onClearLogs, onRefreshLogs }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.eventType === filterType || log.status === filterType;
  });

  const exportLogs = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `omni_zad_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" dir="rtl">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>سجل الأحداث والفتح المباشر (Live Access Logs)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">مراقبة فورية لكل عمليات الدخول وزيارات الصفحة والـ IP</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRefreshLogs}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
            title="تحديث السجلات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exportLogs}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير JSON</span>
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>مسح السجل</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-4">التوقيت</th>
              <th className="py-2.5 px-4">نوع الحدث</th>
              <th className="py-2.5 px-4">عنوان IP والموقع</th>
              <th className="py-2.5 px-4">الجهاز والنظام</th>
              <th className="py-2.5 px-4">تفاصيل العملية</th>
              <th className="py-2.5 px-4 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  لا توجد سجلات مسجلة حالياً.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Timestamp */}
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  {/* Event Type */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
                      {log.eventType}
                    </span>
                  </td>

                  {/* IP & Location */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="text-indigo-400 font-semibold">{log.ip}</span>
                    <span className="text-slate-500 text-[10px] block">{log.location}</span>
                  </td>

                  {/* Device / OS */}
                  <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{log.os} / {log.device}</span>
                    </div>
                  </td>

                  {/* Details */}
                  <td className="py-2.5 px-4 font-sans text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>{log.details}</span>
                      {log.userRef && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
                          @{log.userRef}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    {log.status === 'success' && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                        SUCCESS
                      </span>
                    )}
                    {log.status === 'warning' && (
                      <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">
                        PENDING
                      </span>
                    )}
                    {log.status === 'danger' && (
                      <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[10px]">
                        BLOCKED
                      </span>
                    )}
                    {log.status === 'info' && (
                      <span className="text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded text-[10px]">
                        INFO
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
