import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, Terminal, ShieldAlert, WifiOff } from 'lucide-react';

interface FakeErrorScreenProps {
  onSecretTriggered: () => void;
}

export const FakeErrorScreen: React.FC<FakeErrorScreenProps> = ({ onSecretTriggered }) => {
  const clickCountRef = useRef<number>(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handle404Click = () => {
    clickCountRef.current += 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      onSecretTriggered();
    } else {
      resetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2500);
    }
  };

  useEffect(() => {
    // Keyboard shortcut alternative: Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش')) {
        e.preventDefault();
        onSecretTriggered();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSecretTriggered]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col justify-between selection:bg-slate-800 font-sans relative overflow-hidden" dir="rtl">
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-950/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top disguised mini header */}
      <header className="w-full border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-indigo-400 text-sm">
            OZ
          </div>
          <span className="font-semibold text-slate-300 text-sm tracking-wide font-mono">Omni Zad Gateway</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          <span>HTTP 404 (RESOURCE_NOT_FOUND)</span>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center z-10 max-w-2xl mx-auto w-full">
        
        {/* Error Code 404 - The Secret Click Target */}
        <div className="relative mb-6 select-none">
          <div
            id="secret-404-trigger"
            onClick={handle404Click}
            className="cursor-default select-none block mx-auto"
          >
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-slate-400 drop-shadow-md">
              404
            </span>
          </div>
        </div>

        {/* Error Headings */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3 tracking-tight">
          عذراً، الصفحة المطلوبة غير متوفرة
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-lg leading-relaxed">
          لم يتم العثور على المسار أو الصفحة التي تحاول الوصول إليها على خوادم منصة Omni Zad. قد يكون الرابط قد تم حذفه أو تغييره.
        </p>

        {/* Technical Trace Log Box */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-right mb-8 text-xs font-mono text-slate-400">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Trace Diagnostic Log</span>
            </span>
            <span>ERR_ROUTE_NULL</span>
          </div>
          <p className="text-slate-500">Host: <span className="text-slate-400">{typeof window !== 'undefined' ? window.location.hostname : 'omni-zad.vercel.app'}</span></p>
          <p className="text-slate-500">Status: <span className="text-amber-500/90">404 NOT FOUND</span></p>
          <p className="text-slate-500">Time: <span className="text-slate-400">{new Date().toISOString()}</span></p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تحميل الصفحة</span>
          </button>
          <a
            id="back-to-home-link"
            href="https://omni-zad.vercel.app/"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-300 text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </a>
        </div>
      </main>

      {/* Disguised Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-600 font-mono z-10">
        <p>© 2026 Omni Zad Infrastructure. All rights reserved. Server ID: OZ-SRV-909</p>
      </footer>
    </div>
  );
};
