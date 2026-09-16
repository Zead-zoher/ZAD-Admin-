import { TelegramSettings, UserRecord } from '../types';

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: '8898070233:AAGfNpiCKYL3mutE4pftybfz0JrZHygfQ58',
  adminChatId: '8668845284',
  databaseGroupId: '-1004351152580',
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
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  replyMarkup?: any
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!token || !chatId) {
    return { success: false, error: 'بيانات التيليجرام غير مكتملة' };
  }

  try {
    const payload: any = {
      chat_id: chatId.trim(),
      text: message,
      parse_mode: parseMode,
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, messageId: data.result?.message_id };
    } else {
      return { success: false, error: data.description || 'فشل إرسال الرسالة' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في إرسال الرسالة إلى تيليجرام' };
  }
}

/**
 * 2. Ban Sync to Cloud Database Group (-1004351152580)
 * Sends #BAN with pure JSON payload and clear readable parameters for the main website.
 */
export async function syncBanToCloudDatabaseGroup(
  settings: TelegramSettings,
  payload: {
    username: string;
    deviceFingerprint: string;
    ip: string;
    bannedAt?: string;
    reason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  const nowIso = payload.bannedAt || new Date().toISOString();
  
  const banJson = {
    action: 'ban',
    username: payload.username,
    deviceFingerprint: payload.deviceFingerprint,
    ip: payload.ip,
    bannedAt: nowIso,
  };

  const text = `#BAN
━━━━━━━━━━━━━━━━━━━━
⛔ <b>أمر حظر فوري ومزامنة سحابية | Ban Sync</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b> <code>${payload.username}</code>
🔑 <b>معرف الجهاز (Device Fingerprint):</b> <code>${payload.deviceFingerprint}</code>
🌐 <b>عنوان الـ IP:</b> <code>${payload.ip}</code>
⏰ <b>توقيت الحظر:</b> <code>${nowIso}</code>
${payload.reason ? `📝 <b>السبب:</b> <code>${payload.reason}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━
<b>Data Payload JSON:</b>
<code>${JSON.stringify(banJson, null, 2)}</code>`;

  return await sendTelegramMessage(token, groupId, text, 'HTML');
}

/**
 * 3. 2FA Security Alert to Admin Chat ID (8668845284)
 * Sends security alert with inline buttons & interactive command options
 */
export async function send2FASecurityAlert(
  settings: TelegramSettings,
  attempt: {
    ip: string;
    location: string;
    deviceFingerprint: string;
    os: string;
    browser: string;
    authId: string;
  }
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const adminChatId = settings.adminChatId || DEFAULT_TELEGRAM_SETTINGS.adminChatId;

  const text = `🚨 <b>إنذار أمني: محاولة تسجيل دخول إلى لوحة الأدمن (2FA Alert)</b>
━━━━━━━━━━━━━━━━━━━━
⚠️ تم رصد محاولة دخول ومطابقة البيانات السرية من هذا الجهاز:

🌐 <b>عنوان الـ IP:</b> <code>${attempt.ip}</code> (${attempt.location})
🔑 <b>بصمة الجهاز:</b> <code>${attempt.deviceFingerprint}</code>
💻 <b>نظام التشغيل:</b> <code>${attempt.os}</code>
🌐 <b>المتصفح:</b> <code>${attempt.browser}</code>
⏰ <b>التوقيت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
🔖 <b>رمز المحاولة (Auth ID):</b> <code>${attempt.authId}</code>
━━━━━━━━━━━━━━━━━━━━
<b>اختر الإجراء الأمني المطلوب:</b>

1) للقبول والسماح بالدخول:
ارسل: <code>/allow_${attempt.authId}</code> أو انقر على الزر بالأسفل.

2) للرفض والحظر الفوري إلى جروب السحابة:
ارسل: <code>/ban_${attempt.authId}</code>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '✅ نعم، هذا أنا (فتح لوحة التحكم)',
          callback_data: `allow_${attempt.authId}`,
        },
      ],
      [
        {
          text: '🚫 ليس أنا (حظر فوري)',
          callback_data: `ban_${attempt.authId}`,
        },
      ],
    ],
  };

  return await sendTelegramMessage(token, adminChatId, text, 'HTML', inlineKeyboard);
}

/**
 * Check updates for 2FA responses (polling Telegram callback_query or text commands)
 */
export async function checkTelegram2FAApproval(
  token: string,
  authId: string
): Promise<'pending' | 'approved' | 'rejected'> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getUpdates?offset=-20&limit=20`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return 'pending';

    const updates = data.result;

    for (const update of updates) {
      // Check callback query
      if (update.callback_query?.data) {
        const callbackData = update.callback_query.data;
        if (callbackData === `allow_${authId}`) {
          return 'approved';
        }
        if (callbackData === `ban_${authId}`) {
          return 'rejected';
        }
      }

      // Check text message command
      if (update.message?.text) {
        const msgText = update.message.text.trim();
        if (msgText.includes(`/allow_${authId}`) || msgText === `/allow` || msgText.toLowerCase() === 'نعم' || msgText.toLowerCase() === 'yes') {
          return 'approved';
        }
        if (msgText.includes(`/ban_${authId}`) || msgText === `/ban` || msgText.toLowerCase() === 'لا' || msgText.toLowerCase() === 'no') {
          return 'rejected';
        }
      }
    }

    return 'pending';
  } catch {
    return 'pending';
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

  // 1. Sync to Cloud Group
  await syncBanToCloudDatabaseGroup(settings, {
    username: user.username,
    deviceFingerprint: user.deviceId,
    ip: user.ip,
    reason: reason,
  });

  // 2. Alert to Admin Chat
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
⚠️ <i>تم إرسال أمر #BAN إلى جروب السحابة وحظر الـ IP وبصمة الجهاز والحساب نهائياً.</i>
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
⚠️ <i>تم فتح لوحة التحكم بعد اجتياز التحقق والتمويه السري وموافقة الـ 2FA.</i>
  `.trim();

  await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}

