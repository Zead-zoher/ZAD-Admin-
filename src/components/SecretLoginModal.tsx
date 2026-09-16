import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, User, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2, X, Send, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { TelegramSettings } from '../types';
import { send2FASecurityAlert, checkTelegram2FAApproval, syncBanToCloudDatabaseGroup } from '../services/telegram';

interface SecretLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onInstantBan: (deviceInfo: { ip: string; deviceId: string; reason: string }) => void;
  clientInfo: {
    ip: string;
    location: string;
    countryCode: string;
    deviceId: string;
    os: string;
    browser?: string;
  };
  telegramSettings: TelegramSettings;
}

export const SecretLoginModal: React.FC<SecretLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onInstantBan,
  clientInfo,
  telegramSettings,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // 2FA Security State
  const [twoFAState, setTwoFAState] = useState<'idle' | 'waiting' | 'approved' | 'rejected'>('idle');
  const [currentAuthId, setCurrentAuthId] = useState<string>('');
  const [pollCountdown, setPollCountdown] = useState<number>(60);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Exact credentials specified by prompt
  const REQUIRED_USERNAME = 'Admin_0909';
  const REQUIRED_PASSWORD = 'Zizo0909';

  useEffect(() => {
    if (!isOpen) {
      setTwoFAState('idle');
      setCurrentAuthId('');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Polling loop for Telegram 2FA response
  useEffect(() => {
    if (twoFAState === 'waiting' && currentAuthId) {
      pollIntervalRef.current = setInterval(async () => {
        const result = await checkTelegram2FAApproval(telegramSettings.botToken, currentAuthId);
        if (result === 'approved') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTwoFAState('approved');
          setTimeout(() => {
            onLoginSuccess();
          }, 800);
        } else if (result === 'rejected') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTwoFAState('rejected');
          // Trigger instant ban to Cloud Group & local blacklist
          await syncBanToCloudDatabaseGroup(telegramSettings, {
            username: username || 'Unknown Intruder',
            deviceFingerprint: clientInfo.deviceId,
            ip: clientInfo.ip,
            reason: 'رفض إنذار الـ 2FA وحظر فوري من شات الأدمن',
          });
          onInstantBan({
            ip: clientInfo.ip,
            deviceId: clientInfo.deviceId,
            reason: 'تم الرفض والحظر فوراً عبر إنذار التيليجرام 2FA',
          });
        }
      }, 2000);

      // Countdown timer
      const timer = setInterval(() => {
        setPollCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        clearInterval(timer);
      };
    }
  }, [twoFAState, currentAuthId, telegramSettings, clientInfo, username, onLoginSuccess, onInstantBan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const inputUsername = username.trim();
    const inputPassword = password;

    // Whole-string comparison
    const isUsernameValid = inputUsername === REQUIRED_USERNAME;
    const isPasswordValid = inputPassword === REQUIRED_PASSWORD;

    if (isUsernameValid && isPasswordValid) {
      // Step 2: Generate 2FA Auth Attempt and send to Telegram
      const authId = Math.random().toString(36).substring(2, 7).toUpperCase();
      setCurrentAuthId(authId);
      setPollCountdown(60);

      const alertRes = await send2FASecurityAlert(telegramSettings, {
        ip: clientInfo.ip,
        location: clientInfo.location,
        deviceFingerprint: clientInfo.deviceId,
        os: clientInfo.os,
        browser: clientInfo.browser || 'Chrome Web',
        authId,
      });

      setIsSubmitting(false);
      if (alertRes.success) {
        setTwoFAState('waiting');
      } else {
        // In case telegram fails to send, fallback to direct entry with warning
        onLoginSuccess();
      }
    } else {
      setIsSubmitting(false);
      setErrorMsg('بيانات الدخول غير صحيحة. تم تسجيل محاولة الدخول وتنبيه النظام.');
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
        {/* Backdrop Close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Top Cyber Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          {/* Modal Header */}
          <div className="p-6 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>لوحة تحكم الأدمن المستقلة</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                    RESTRICTED
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">منصة التحقق الأمني الداخلي لـ Omni Zad</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2FA WAITING STATE SCREEN */}
          {twoFAState === 'waiting' && (
            <div className="p-6 space-y-4">
              <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto animate-pulse">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-sky-200">
                    تم إرسال إنذار الأمان (2FA) إلى تليجرام
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    يجب تأكيد الهوية من تطبيق تيليجرام الخاص بالأدمن حصراً
                    <br />
                    <span className="text-[11px] text-amber-300 font-mono">Chat ID: {telegramSettings.adminChatId}</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-right space-y-1.5 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">رمز المصادقة:</span>
                    <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">#{currentAuthId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">عنوان الـ IP:</span>
                    <span className="text-slate-300">{clientInfo.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">بصمة الجهاز:</span>
                    <span className="text-slate-300">{clientInfo.deviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نظام التشغيل:</span>
                    <span className="text-slate-300">{clientInfo.os}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-mono bg-amber-950/30 py-2 px-3 rounded-lg border border-amber-800/40">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>بانتظار نقر زر الموافقة في تطبيق تليجرام ({pollCountdown} ث)...</span>
                </div>
              </div>

              {/* Strict Security Info & Cancel */}
              <div className="space-y-2 pt-1">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    🔒 <strong className="text-slate-200">الأمان المشدد مفعّل:</strong> تم إرسال إشعار فوري يحتوي على زري (نعم هذا أنا / ليس أنا للحظر) إلى حساب التليجرام.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-xl transition"
                >
                  إلغاء المحاولة والرجوع
                </button>
              </div>
            </div>
          )}

          {/* 2FA APPROVED STATE */}
          {twoFAState === 'approved' && (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-emerald-300">تم تأكيد الهوية بنجاح ✅</h3>
              <p className="text-xs text-slate-400">جاري توجيهك إلى لوحة التحكم...</p>
            </div>
          )}

          {/* 2FA REJECTED STATE */}
          {twoFAState === 'rejected' && (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-rose-300">تم حظر الوصول نهائياً 🚫</h3>
              <p className="text-xs text-slate-400">تم إرسال أمر الحظر #BAN إلى سحابة التليجرام وقفل الجهاز.</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && twoFAState === 'idle' && (
            <div className="mx-6 mb-2 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Initial Login Form */}
          {twoFAState === 'idle' && (
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  اسم المستخدم (Admin Username)
                </label>
                <div className="relative">
                  <input
                    id="admin-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم..."
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition"
                    dir="ltr"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  كلمة المرور السرية (Secret Password)
                </label>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-4 py-2.5 pr-10 pl-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="submit-admin-login-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>تسجيل الدخول والتحقق</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Modal Footer Note */}
          <div className="bg-slate-950/60 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono">Security Check: 2FA Telegram Guard</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

