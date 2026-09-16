import React, { useState } from 'react';
import { ShieldBan, AlertTriangle, X, Send } from 'lucide-react';
import { UserRecord } from '../types';

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  onConfirmBan: (user: UserRecord, reason: string, banIpAndDevice: boolean) => void;
}

export const BanModal: React.FC<BanModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmBan,
}) => {
  const [reason, setReason] = useState<string>('مخالفة شروط الاستخدام وهجمات مشبوهة');
  const [banIpAndDevice, setBanIpAndDevice] = useState<boolean>(true);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBan(user, reason.trim() || 'حظر بواسطة الأدمن', banIpAndDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-rose-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldBan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-200">
                تأكيد الحظر الشامل للحساب والجهاز
              </h3>
              <p className="text-xs text-rose-300/70 font-mono">Omni Zad Blacklist Enforcer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">المستخدم:</span>
              <span className="text-slate-200 font-bold">{user.displayName} (@{user.username})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">البريد:</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الـ IP المستهدف:</span>
              <span className="text-rose-400 font-bold">{user.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">بصمة الجهاز:</span>
              <span className="text-rose-400">{user.deviceId}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              سبب الحظر (Ban Reason)
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: محاولة اختراق متعددة واستخدام VPN"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={banIpAndDevice}
                onChange={(e) => setBanIpAndDevice(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
              />
              <span>إدراج الـ IP وبصمة الجهاز في القائمة السوداء الفورية</span>
            </label>
            <p className="text-[11px] text-slate-500 pr-6">
              سيتم منع أي جهاز يحمل هذا الـ IP أو البصمة من الوصول للموقع نهائياً وإظهار شاشة الحظر.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-rose-600/30"
            >
              تأكيد الحظر الشامل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
