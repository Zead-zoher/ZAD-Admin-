import React, { useState } from 'react';
import { ShieldBan, Plus, Trash2, Globe, Smartphone, UserX, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BannedEntity } from '../types';

interface BannedManagerProps {
  bannedList: BannedEntity[];
  onAddBan: (entity: Omit<BannedEntity, 'id' | 'bannedAt'>) => void;
  onRemoveBan: (id: string) => void;
}

export const BannedManager: React.FC<BannedManagerProps> = ({ bannedList, onAddBan, onRemoveBan }) => {
  const [type, setType] = useState<'ip' | 'device' | 'username'>('ip');
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    onAddBan({
      type,
      value: value.trim(),
      reason: reason.trim() || 'حظر يدوي بواسطة الأدمن',
    });

    setValue('');
    setReason('');
    setShowForm(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" dir="rtl">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldBan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>قائمة الحظر الشامل (Banned IPs & Hardware Fingerprints)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">عناوين الـ IP وبصمات الأجهزة الممنوعة من دخول منصة Omni Zad</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-md shadow-rose-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showForm ? 'إلغاء' : 'إضافة حظر يدوي'}</span>
        </button>
      </div>

      {/* Manual Ban Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">نوع الحظر</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="ip">عنوان IP (IP Address)</option>
                <option value="device">بصمة جهاز (Device Fingerprint)</option>
                <option value="username">اسم مستخدم (Username)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">القيمة المحظورة (IP / ID)</label>
              <input
                type="text"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'ip' ? '185.220.101.4' : type === 'device' ? 'FP-11AA87DE-0021' : 'bad_user'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">سبب الحظر</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="محاولات اختراق أو نشاط مشبوه"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              تأكيد إضافة الحظر
            </button>
          </div>
        </form>
      )}

      {/* Banned List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
            <tr>
              <th className="py-3 px-4">النوع</th>
              <th className="py-3 px-4">القيمة المحظورة</th>
              <th className="py-3 px-4">السبب</th>
              <th className="py-3 px-4">تاريخ الحظر</th>
              <th className="py-3 px-4 text-center">إلغاء الحظر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {bannedList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                  لا توجد سجلات محظورة حالياً.
                </td>
              </tr>
            ) : (
              bannedList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  
                  {/* Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      {item.type === 'ip' && <Globe className="w-3.5 h-3.5 text-rose-400" />}
                      {item.type === 'device' && <Smartphone className="w-3.5 h-3.5 text-rose-400" />}
                      {item.type === 'username' && <UserX className="w-3.5 h-3.5 text-rose-400" />}
                      <span className="font-semibold uppercase">{item.type}</span>
                    </span>
                  </td>

                  {/* Value */}
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-300 select-all" dir="ltr">
                    {item.value}
                  </td>

                  {/* Reason */}
                  <td className="py-3 px-4 font-sans text-slate-300">
                    {item.reason}
                  </td>

                  {/* Banned At */}
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {item.bannedAt}
                  </td>

                  {/* Unban Action */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveBan(item.id)}
                      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg transition font-sans"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>فك الحظر</span>
                    </button>
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
