import React from 'react';
import { Shield, Lock, EyeOff, LogOut, Plus, Send, RefreshCw, Radio, Terminal, Bell } from 'lucide-react';

interface NavbarProps {
  onDisguise: () => void;
  onLogout: () => void;
  onOpenAddUser: () => void;
  onOpenTelegramModal: () => void;
  pendingCount: number;
  telegramOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onDisguise,
  onLogout,
  onOpenAddUser,
  onOpenTelegramModal,
  pendingCount,
  telegramOnline,
}) => {
  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 py-3.5" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Logo and Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 font-black text-sm">
              OZ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base">لوحة تحكم Omni Zad</span>
                <span className="text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  ADMIN v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">نظام إدارة المستخدمين والتحقق الأمني المستقل</p>
            </div>
          </div>

          {/* Mobile Admin badge */}
          <div className="sm:hidden flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Admin_0909</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          
          {/* Telegram Status Badge / Quick Trigger */}
          <button
            id="telegram-quick-btn"
            type="button"
            onClick={onOpenTelegramModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              telegramOnline
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">بوت تيليجرام</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          </button>

          {/* Add Admin Button */}
          <button
            id="add-user-top-btn"
            type="button"
            onClick={onOpenAddUser}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>إضافة أدمن</span>
          </button>

          {/* Disguise / Instant 404 Hide Button */}
          <button
            id="disguise-mode-btn"
            type="button"
            onClick={onDisguise}
            title="العودة لشاشة التمويه 404 مع الاحتفاظ بالجلسة"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl transition"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">تمويه (404)</span>
          </button>

          {/* Admin Identity pill & Logout */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-slate-200">Admin_0909</span>
          </div>

          {/* Logout */}
          <button
            id="admin-logout-btn"
            type="button"
            onClick={onLogout}
            title="تسجيل الخروج وإنهاء الجلسة"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
