import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Globe, Smartphone, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { UserRecord, UserStatus } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<UserRecord>) => void;
  userToEdit?: UserRecord | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ip, setIp] = useState('');
  const [location, setLocation] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [os, setOs] = useState('');
  const [status, setStatus] = useState<UserStatus>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setDisplayName(userToEdit.displayName);
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setPassword(userToEdit.password);
      setIp(userToEdit.ip);
      setLocation(userToEdit.location);
      setDeviceId(userToEdit.deviceId);
      setOs(userToEdit.os);
      setStatus(userToEdit.status);
      setNotes(userToEdit.notes || '');
    } else {
      // Defaults for new user
      setDisplayName('');
      setUsername('');
      setEmail('');
      setPassword('Zad#' + Math.random().toString(36).substring(2, 8) + '!99');
      setIp('197.' + Math.floor(Math.random() * 200 + 10) + '.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250));
      setLocation('القاهرة، مصر');
      setDeviceId('FP-' + Math.random().toString(36).substring(2, 10).toUpperCase());
      setOs('Windows 11 / Chrome 128');
      setStatus('pending');
      setNotes('');
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const generateRandomCreds = () => {
    setPassword('Zad#' + Math.random().toString(36).substring(2, 8) + '!99');
    setDeviceId('FP-' + Math.random().toString(36).substring(2, 10).toUpperCase());
    setIp('197.' + Math.floor(Math.random() * 200 + 10) + '.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username || !email || !password) return;

    onSave({
      displayName,
      username: username.replace(/^@/, '').trim(),
      email: email.trim(),
      password,
      ip: ip.trim() || '197.38.112.44',
      location: location.trim() || 'القاهرة، مصر',
      countryCode: 'EG',
      deviceId: deviceId.trim() || 'FP-CUSTOM-001',
      os: os.trim() || 'Windows 11',
      browser: 'Chrome',
      status,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {userToEdit ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">Omni Zad User Registry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل (Display Name)</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="زياد محمود"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المستخدم (Username)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ziad_omni"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ziad@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">كلمة المرور (Password)</label>
                <button
                  type="button"
                  onClick={generateRandomCreds}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>توليد عشوائي</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان IP (IP Address)</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="197.38.112.44"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الموقع الجغرافي (Location)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="القاهرة، مصر"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">بصمة الجهاز (Device ID)</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="FP-8A4F19B2-C391"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نظام التشغيل والمتصفح (OS)</label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Windows 11 / Chrome 128"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الحساب (Status)</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="pending">معلق (Pending Approval) ⏳</option>
                <option value="active">نشط (Active) ✅</option>
                <option value="banned">محظور (Banned) 🚫</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات إدارية (Notes)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مستخدم مميز / فحص يدوي"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 -mx-5 -mb-5 mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            >
              {userToEdit ? 'حفظ التعديلات' : 'إضافة الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
