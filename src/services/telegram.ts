import { TelegramSettings, UserRecord } from '../types';

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: '8898070233:AAGfNpiCKYL3mutE4pftybfz0JrZHygfQ58',
  adminChatId: '8668845284',
  enabled: true,
  notifyOnApprove: true,
  notifyOnBan: true,
  notifyOnLogin: true,
  notifyOnNewUser: true,
};

export async function testTelegramBot(token: string): Promise<{ success: boolean; botName?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        botName: data.result.first_name + (data.result.username ? ` (@${data.result.username})` : ''),
      };
    } else {
      return { success: false, error: data.description || 'فشل الاتصال بالبوت' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الشبكة' };
  }
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<{ success: boolean; error?: string }> {
  if (!token || !chatId) {
    return { success: false, error: 'بيانات التيليجرام غير مكتملة' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'فشل إرسال الرسالة' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في إرسال الرسالة إلى تيليجرام' };
  }
}

export async function sendUserApprovedAlert(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<void> {
  if (!settings.enabled || !settings.notifyOnApprove) return;

  const text = `
<b>🟢 تفعيل حساب مستخدم جديد | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> <code>${user.displayName}</code>
🔖 <b>اسم المستخدم:</b> <code>@${user.username}</code>
📧 <b>البريد:</b> <code>${user.email}</code>
🌐 <b>الـ IP:</b> <code>${user.ip}</code> (${user.location})
📱 <b>الجهاز:</b> <code>${user.os}</code>
🔑 <b>بصمة الجهاز:</b> <code>${user.deviceId}</code>
⏰ <b>وقت التفعيل:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
👮‍♂️ <b>تم التفعيل بواسطة:</b> <code>${adminName}</code>
━━━━━━━━━━━━━━━━━
✅ <i>الحالة: الحساب نشط الآن وجاهز للاستخدام.</i>
  `.trim();

  await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}

export async function sendUserBannedAlert(
  settings: TelegramSettings,
  user: UserRecord,
  reason: string = 'مخالفة الشروط وحظر الجهاز',
  adminName: string = 'Admin_0909'
): Promise<void> {
  if (!settings.enabled || !settings.notifyOnBan) return;

  const text = `
<b>🚫 حظر شامل لمستخدم وجهاز | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> <code>${user.displayName}</code>
🔖 <b>اليوزر:</b> <code>@${user.username}</code>
📧 <b>البريد:</b> <code>${user.email}</code>
⛔ <b>سبب الحظر:</b> <code>${reason}</code>
🌐 <b>الـ IP المحظور:</b> <code>${user.ip}</code>
📱 <b>بصمة الجهاز المحظور:</b> <code>${user.deviceId}</code>
🖥️ <b>النظام:</b> <code>${user.os}</code>
⏰ <b>توقيت الحظر:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
👮‍♂️ <b>الأدمن المنفذ:</b> <code>${adminName}</code>
━━━━━━━━━━━━━━━━━
⚠️ <i>تم حظر الـ IP وبصمة الجهاز والحساب من الدخول نهائياً.</i>
  `.trim();

  await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}

export async function sendAdminLoginAlert(
  settings: TelegramSettings,
  ip: string,
  location: string,
  deviceInfo: string
): Promise<void> {
  if (!settings.enabled || !settings.notifyOnLogin) return;

  const text = `
<b>🔐 تنبيه أمني: تسجيل دخول الأدمن الرئيسي</b>
━━━━━━━━━━━━━━━━━
🛡️ <b>المسؤول:</b> <code>Admin_0909</code>
🌐 <b>الـ IP:</b> <code>${ip}</code> (${location})
💻 <b>الجهاز:</b> <code>${deviceInfo}</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
🚪 <b>المنصة:</b> <code>Omni Zad Admin Portal</code>
━━━━━━━━━━━━━━━━━
⚠️ <i>تم فتح لوحة التحكم بعد اجتياز التحقق والتمويه السري.</i>
  `.trim();

  await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}
