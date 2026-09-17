import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, User, AlertCircle, CheckCircle2, Send, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { UserRecord } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserRecord[];
  userToEdit?: UserRecord | null;
  onSendNewAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onUpdatePassword?: (user: UserRecord, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  userToEdit,
  onSendNewAdmin,
  onUpdatePassword,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setUsername(userToEdit.username);
        setPassword(userToEdit.password && userToEdit.password !== '••••••••' ? userToEdit.password : '');
        setNewPassword('');
      } else {
        setUsername('');
        setPassword('');
        setNewPassword('');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // MODE 1: Edit User Password
    if (isEditMode && userToEdit) {
      const trimmedNewPass = newPassword.trim();
      if (!trimmedNewPass) {
        setErrorMsg('يرجى إدخال كلمة المرور الجديدة');
        return;
      }

      setIsSubmitting(true);
      try {
        if (onUpdatePassword) {
          const res = await onUpdatePassword(userToEdit, trimmedNewPass);
          if (res.success) {
            setSuccessMsg(`تم تعديل كلمة المرور وتحديث السطر P(${trimmedNewPass}) في رسالة الجروب بنجاح!`);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setErrorMsg(res.error || 'فشل تحديث كلمة المرور في رسالة الجروب.');
          }
        }
      } catch {
        setErrorMsg('حدث خطأ أثناء تعديل رسالة الجروب.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // MODE 2: Add Admin Request (#newadmin)
    const cleanUsername = username.trim().replace(/^@/, '');
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('يرجى ملء جميع الحقول (اسم المستخدم وكلمة المرور)');
      return;
    }

    // 1. Check if user credentials exist in the group/registered users list with EXACT MATCH
    const foundUser = existingUsers.find(
      (u) =>
        u.username.trim().toLowerCase() === cleanUsername.toLowerCase() &&
        u.password.trim() === cleanPassword
    );

    if (!foundUser) {
      setErrorMsg('في حاجة غلط! اسم المستخدم أو كلمة المرور غير مطابقة لما هو مسجل في رسالة الجروب.');
      return;
    }

    // 2. Credentials verified - send #newadmin to Telegram Group
    setIsSubmitting(true);
    try {
      const res = await onSendNewAdmin(cleanUsername, cleanPassword);
      if (res.success) {
        setSuccessMsg(`تم إرسال طلب الأدمن (#newadmin) إلى جروب التليجرام بنجاح للموافقة!`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'فشل إرسال الطلب إلى التليجرام. يرجى التحقق من الاتصال.');
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع أثناء إرسال البيانات للتليجرام.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              isEditMode 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
            }`}>
              {isEditMode ? <KeyRound className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isEditMode ? `تعديل كلمة المرور للمستخدم @${userToEdit?.username}` : 'إضافة وتعيين أدمن جديد'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isEditMode ? 'تعديل سطر P(...) في رسالة الجروب' : '#newadmin Registry Dispatcher'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {isEditMode ? (
            <>
              {/* User info display */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المستخدم:</span>
                  <span className="text-indigo-400 font-bold">@{userToEdit?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الاسم الحقيقي:</span>
                  <span className="text-slate-300">{userToEdit?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">كلمة المرور الحالية:</span>
                  <span className="text-slate-300">{userToEdit?.password}</span>
                </div>
              </div>

              {/* New Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  كلمة المرور الجديدة (New Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="user-new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة لتعديلها في الجروب"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 transition shadow-inner"
                    dir="ltr"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                  سيتم تعديل سطر <code>P({newPassword || '...'})</code> فوراً عبر editMessageText
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Field 1: الاسم / اسم المستخدم */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  الاسم / اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ziad_omni"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    dir="ltr"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Field 2: كلمة المرور */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  كلمة المرور (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور المسجلة في الجروب"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    dir="ltr"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Format Preview Hint */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="text-slate-500 text-[10px]">الرسالة المرسلة للجروب بعد التحقق:</div>
                <div className="text-indigo-300">#newadmin</div>
                <div>Username: <span className="text-slate-200">{username || '...'}</span></div>
                <div>Password: <span className="text-slate-200">{password ? '••••••••' : '...'}</span></div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              id="submit-user-modal-btn"
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري المعالجة والإرسال...</span>
                </>
              ) : isEditMode ? (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>حفظ وتعديل سطر P(...) في الجروب</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال طلب التعيين (#newadmin)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
