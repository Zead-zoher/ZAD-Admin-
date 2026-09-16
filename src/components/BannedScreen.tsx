import React from 'react';
import { ShieldBan, AlertOctagon, Terminal } from 'lucide-react';

interface BannedScreenProps {
  ip: string;
  deviceId: string;
  reason?: string;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({ ip, deviceId, reason }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-rose-500 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-5 shadow-inner">
          <ShieldBan className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-100 mb-2 tracking-tight">
          تم حظر هذا الجهاز والـ IP
        </h1>
        <p className="text-xs text-rose-400 font-mono mb-6">
          ACCESS_DENIED_HARDWARE_BLACKLIST
        </p>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          تم حظر وصولك إلى منصة Omni Zad نظراً لرصد نشاط يخالف سياسات الأمان أو محاولات وصول غير مصرح بها.
        </p>

        {/* Technical Diagnostics */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-right text-xs font-mono text-slate-400 space-y-2 mb-6">
          <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-slate-500">عنوان الـ IP:</span>
            <span className="text-rose-400 font-bold">{ip}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-slate-500">بصمة الجهاز:</span>
            <span className="text-slate-300">{deviceId}</span>
          </div>
          {reason && (
            <div className="flex justify-between">
              <span className="text-slate-500">السبب:</span>
              <span className="text-slate-300 font-sans">{reason}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-600 font-mono">
          إذا كنت تعتقد أن هذا الإجراء تم عن طريق الخطأ، يرجى التواصل مع إدارة النظام عبر معرّف الدعم الرسمي.
        </p>
      </div>
    </div>
  );
};
