import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Key, Shield, MessageSquare, X, ExternalLink } from 'lucide-react';
import { TelegramSettings } from '../types';
import { testTelegramBot, sendTelegramMessage } from '../services/telegram';

interface TelegramPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TelegramSettings;
  onSaveSettings: (settings: TelegramSettings) => void;
}

export const TelegramPanel: React.FC<TelegramPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [currentSettings, setCurrentSettings] = useState<TelegramSettings>(settings);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testTelegramBot(currentSettings.botToken);
    setTesting(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `تم الاتصال بنجاح بالبوت: ${res.botName}`,
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || 'فشل الاتصال بالبوت',
      });
    }
  };

  const handleSendCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    setSendingMsg(true);
    setSendResult(null);

    const formatted = `
<b>🔔 إشعار إداري يدوي | Omni Zad Admin</b>
━━━━━━━━━━━━━━━━━
📝 <b>نص الرسالة:</b>
${customMsg.trim()}
━━━━━━━━━━━━━━━━━
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
👮‍♂️ <b>المرسل:</b> <code>Admin_0909</code>
    `.trim();

    const res = await sendTelegramMessage(
      currentSettings.botToken,
      currentSettings.adminChatId,
      formatted
    );

    setSendingMsg(false);
    if (res.success) {
      setSendResult({ success: true, message: 'تم إرسال الرسالة إلى تليجرام بنجاح!' });
      setCustomMsg('');
      setTimeout(() => setSendResult(null), 3500);
    } else {
      setSendResult({ success: false, message: res.error || 'فشل في إرسال الرسالة' });
    }
  };

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>إعدادات ربط تيليجرام (Telegram Bot Integration)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">استقبال وتخزين التنبيهات وسجلات المستخدمين</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Bot Token Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              رمز توكن البوت (Bot Token)
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentSettings.botToken}
                onChange={(e) => setCurrentSettings({ ...currentSettings, botToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Database Group ID Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>معرف جروب السحابة (Database Group ID)</span>
              <span className="text-[10px] text-amber-400 font-mono">#BAN Cloud Sync</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentSettings.databaseGroupId}
                onChange={(e) => setCurrentSettings({ ...currentSettings, databaseGroupId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              الجروب الذي يستقبل أوامر الحظر الفورية بصيغة #BAN مع JSON لمزامنة الحظر مع الموقع الرئيسي.
            </p>
          </div>

          {/* Admin Chat ID Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              معرّف محادثة الأدمن (Admin Chat ID)
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentSettings.adminChatId}
                onChange={(e) => setCurrentSettings({ ...currentSettings, adminChatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Connection Test Button & Feedback */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2.5 rounded-xl transition"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>فحص واختبار اتصال البوت الآن</span>
            </button>

            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Notification Triggers Checkboxes */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">خيارات التنبيهات الفورية:</span>
            
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={currentSettings.notifyOnApprove}
                onChange={(e) => setCurrentSettings({ ...currentSettings, notifyOnApprove: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>إرسال تنبيه عند تفعيل حساب مستخدم (Approve Alert)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={currentSettings.notifyOnBan}
                onChange={(e) => setCurrentSettings({ ...currentSettings, notifyOnBan: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>إرسال تنبيه فوري عند حظر IP أو بصمة جهاز (Ban Alert)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={currentSettings.notifyOnLogin}
                onChange={(e) => setCurrentSettings({ ...currentSettings, notifyOnLogin: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>إرسال تنبيه أمني عند تسجيل دخول الأدمن للوحة التحكم</span>
            </label>
          </div>

          {/* Direct Send Custom Message Form */}
          <form onSubmit={handleSendCustomMessage} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="font-semibold text-slate-300 block text-xs">إرسال رسالة تجريبية مباشرة لحساب الأدمن:</span>
            <textarea
              rows={2}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="اكتب نصاً لإرساله فوراً إلى التيليجرام..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !customMsg.trim()}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-50"
            >
              {sendingMsg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>إرسال إلى تليجرام الآن</span>
            </button>

            {sendResult && (
              <div
                className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                  sendResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {sendResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>{sendResult.message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
