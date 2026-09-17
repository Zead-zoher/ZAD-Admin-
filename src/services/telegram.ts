import { TelegramSettings, UserRecord, UserStatus } from '../types';

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: '8898070233:AAGfNpiCKYL3mutE4pftybfz0JrZHygfQ58',
  adminChatId: '8668845284',
  databaseGroupId: '-1004362776828',
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
 * Edits an existing message in a Telegram chat/group using editMessageText
 */
export async function editTelegramMessage(
  token: string,
  chatId: string,
  messageId: number,
  newText: string,
  parseMode?: 'HTML' | 'Markdown'
): Promise<{ success: boolean; error?: string }> {
  if (!token || !chatId || !messageId) {
    return { success: false, error: 'معطيات تعديل الرسالة غير مكتملة' };
  }

  try {
    const payload: any = {
      chat_id: chatId.trim(),
      message_id: messageId,
      text: newText,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'فشل تعديل الرسالة' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في تعديل الرسالة في التيليجرام' };
  }
}

/**
 * Deletes a single message from a Telegram chat/group
 */
export async function deleteTelegramMessage(
  token: string,
  chatId: string,
  messageId: number
): Promise<{ success: boolean; error?: string }> {
  if (!token || !chatId || !messageId) {
    return { success: false, error: 'معطيات حذف الرسالة غير مكتملة' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_id: messageId,
      }),
    });

    const data = await res.json();
    return { success: !!data.ok, error: data.description };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في حذف الرسالة من التيليجرام' };
  }
}

/**
 * Generates the standardized user message string for Telegram Database Group (-1004362776828)
 * Format:
 * #@(username)/(الاسم الحقيقي)/(البريد الإلكتروني)
 * P(كلمة المرور)
 * S(الحالة)
 * D(IP: [ip] | Fingerprint: [fingerprint])
 * H(المدينة - الدولة)
 * L(تاريخ ووقت آخر فتح للموقع)
 * LD(نظام التشغيل | المتصفح)
 */
export function formatUserTelegramMessage(user: UserRecord, statusOverride?: UserStatus): string {
  const status = statusOverride || user.status || 'pending';
  const cleanUsername = user.username.replace(/^@/, '').trim();
  const cleanDisplayName = (user.displayName || cleanUsername).trim();
  const email = (user.email || `${cleanUsername}@gmail.com`).trim();
  const password = user.password || '••••••••';
  const ip = user.ip || '197.38.112.44';
  const deviceId = user.deviceId || `FP-${cleanUsername.toUpperCase()}`;
  const location = user.location || 'القاهرة - مصر';
  const lastActive = user.lastActive || user.registeredAt || new Date().toISOString().replace('T', ' ').substring(0, 19);
  const os = user.os || 'Web Browser';
  const browser = user.browser || 'Web';

  return `#@(${cleanUsername})/(${cleanDisplayName})/(${email})
P(${password})
S(${status})
D(IP: [${ip}] | Fingerprint: [${deviceId}])
H(${location})
L(${lastActive})
LD(${os} | ${browser})`;
}

/**
 * Searches the group for the user's registered message ID and original text
 */
async function searchUserMessageInGroup(
  token: string,
  groupId: string,
  username: string
): Promise<{ messageId: number; text: string } | null> {
  try {
    const cleanUname = username.trim().toLowerCase().replace(/^@/, '');
    const allowed = encodeURIComponent(JSON.stringify(["message", "channel_post", "edited_message", "edited_channel_post"]));
    
    // Fetch last updates from group
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getUpdates?offset=-50&limit=50&allowed_updates=${allowed}`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return null;

    for (let i = data.result.length - 1; i >= 0; i--) {
      const update = data.result[i];
      const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
      if (!msg || !msg.message_id) continue;

      const text = msg.text || msg.caption || '';
      const textLower = text.toLowerCase();

      if (
        textLower.includes(`#@(${cleanUname})`) ||
        textLower.includes(`#@${cleanUname}`) ||
        textLower.includes(`@${cleanUname}`) ||
        textLower.includes(`"username":"${cleanUname}"`) ||
        textLower.includes(`"username": "${cleanUname}"`)
      ) {
        return { messageId: msg.message_id, text };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Updates a user's status in the Telegram Database Group by editing their message (editMessageText)
 * Changes S(pending) -> S(active) / S(rejected) / S(banned)
 */
export async function updateUserStatusInTelegramGroup(
  settings: TelegramSettings,
  user: UserRecord,
  newStatus: UserStatus
): Promise<{ success: boolean; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  if (!token || !groupId) {
    return { success: false, error: 'بيانات التيليجرام غير مكتملة' };
  }

  // 1. Prepare updated text
  let newText = '';
  if (user.rawTelegramText && /S\([^)]*\)/i.test(user.rawTelegramText)) {
    newText = user.rawTelegramText.replace(/S\([^)]*\)/i, `S(${newStatus})`);
  } else {
    newText = formatUserTelegramMessage(user, newStatus);
  }

  // 2. Try direct edit if we have the messageId stored
  if (user.telegramMessageId) {
    const editRes = await editTelegramMessage(token, groupId, user.telegramMessageId, newText);
    if (editRes.success) {
      return { success: true };
    }
  }

  // 3. Search group for this user's message ID to edit it
  const found = await searchUserMessageInGroup(token, groupId, user.username);
  if (found) {
    const updatedFoundText = /S\([^)]*\)/i.test(found.text)
      ? found.text.replace(/S\([^)]*\)/i, `S(${newStatus})`)
      : formatUserTelegramMessage(user, newStatus);

    const editRes = await editTelegramMessage(token, groupId, found.messageId, updatedFoundText);
    if (editRes.success) {
      return { success: true };
    }
  }

  // 4. Fallback: If no message was found or edit was not possible, send a formatted message
  const sendRes = await sendTelegramMessage(token, groupId, newText);
  return { success: sendRes.success, error: sendRes.error };
}

/**
 * Approves a user by editing their message in the database group to S(active)
 */
export async function sendUserApprovalToCloud(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const res = await updateUserStatusInTelegramGroup(settings, user, 'active');

  // Also send notification to Admin private chat if configured
  if (settings.enabled && settings.notifyOnApprove) {
    await sendUserApprovedAlert(settings, user, adminName);
  }

  return res;
}

/**
 * Rejects a user by editing their message in the database group to S(rejected)
 */
export async function sendUserRejectionToCloud(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const res = await updateUserStatusInTelegramGroup(settings, user, 'rejected');

  // Also alert admin chat
  if (settings.enabled) {
    const adminAlertText = `
<b>❌ تم رفض طلب المستخدم | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> <code>${user.displayName}</code>
🔖 <b>اسم المستخدم:</b> <code>@${user.username}</code>
🌐 <b>الـ IP:</b> <code>${user.ip}</code>
📱 <b>الجهاز:</b> <code>${user.os}</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━
⚠️ <i>تم تعديل الحالة إلى S(rejected) في جروب قاعدة البيانات.</i>
    `.trim();
    await sendTelegramMessage(settings.botToken, settings.adminChatId, adminAlertText);
  }

  return res;
}

/**
 * Bans a user by editing their message in the database group to S(banned)
 */
export async function sendUserBanToCloud(
  settings: TelegramSettings,
  user: UserRecord,
  reason: string = 'حظر إداري',
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const res = await updateUserStatusInTelegramGroup(settings, user, 'banned');

  // Send Admin Alert
  if (settings.enabled && settings.notifyOnBan) {
    await sendUserBannedAlert(settings, user, reason);
  }

  return res;
}

/**
 * Manual IP/Device Ban Sync to Cloud Database Group
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

  const mockUser: UserRecord = {
    id: `usr-${payload.username}`,
    displayName: payload.username,
    username: payload.username,
    email: `${payload.username}@gmail.com`,
    password: '••••••••',
    ip: payload.ip,
    location: 'مصر',
    countryCode: 'EG',
    deviceId: payload.deviceFingerprint,
    os: 'Web Browser',
    browser: 'Web',
    registeredAt: payload.bannedAt || new Date().toISOString(),
    lastActive: 'منذ قليل',
    status: 'banned',
  };

  return await updateUserStatusInTelegramGroup(settings, mockUser, 'banned');
}

/**
 * Scans all messages in the Telegram Cloud Group, finds any message containing the user's username
 * and deletes them completely from the group. Once deleted, the main site detects removal.
 */
export async function deleteUserMessagesFromTelegramGroup(
  settings: TelegramSettings,
  username: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  if (!username || !token || !groupId) {
    return { success: false, deletedCount: 0, error: 'بيانات غير مكتملة' };
  }

  const cleanTargetUname = username.trim().toLowerCase().replace(/^@/, '');

  try {
    // 1. Fetch updates with pagination to locate all message IDs in the group
    let allUpdates: any[] = [];
    let currentOffset: number | undefined = undefined;
    let pageCount = 0;
    const maxPages = 6;

    while (pageCount < maxPages) {
      pageCount++;
      const offsetParam = currentOffset ? `&offset=${currentOffset}` : '';
      const url = `https://api.telegram.org/bot${token.trim()}/getUpdates?limit=100&allowed_updates=["message","channel_post","edited_message","edited_channel_post"]${offsetParam}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
        break;
      }

      allUpdates = allUpdates.concat(data.result);
      const lastUpdate = data.result[data.result.length - 1];
      if (lastUpdate && lastUpdate.update_id) {
        currentOffset = lastUpdate.update_id + 1;
      }

      if (data.result.length < 100) {
        break;
      }
    }

    // 2. Identify all messages belonging to or mentioning this user
    const messagesToDelete = new Set<number>();

    for (const update of allUpdates) {
      const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
      if (!msg || !msg.message_id) continue;

      const text = (msg.text || msg.caption || '').toLowerCase();
      
      if (
        text.includes(`#@(${cleanTargetUname})`) ||
        text.includes(`#@${cleanTargetUname}`) ||
        text.includes(cleanTargetUname) ||
        text.includes(`@${cleanTargetUname}`) ||
        text.includes(`"username":"${cleanTargetUname}"`) ||
        text.includes(`"username": "${cleanTargetUname}"`) ||
        text.includes(`usr-${cleanTargetUname}`)
      ) {
        messagesToDelete.add(msg.message_id);
      }
    }

    // 3. Delete matching messages from the Telegram Group
    let deletedCount = 0;
    for (const msgId of messagesToDelete) {
      try {
        const delRes = await deleteTelegramMessage(token, groupId, msgId);
        if (delRes.success) {
          deletedCount++;
        }
      } catch (e) {
        console.warn(`Failed to delete message ID ${msgId}:`, e);
      }
    }

    return { success: true, deletedCount };
  } catch (err: any) {
    console.error('Error wiping user messages from Telegram:', err);
    return { success: false, deletedCount: 0, error: err.message };
  }
}

/**
 * 2FA Security Alert to Admin Chat ID
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

2) للرفض والحظر الفوري:
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
 * Check updates for 2FA responses
 */
export async function checkTelegram2FAApproval(
  token: string,
  authId: string
): Promise<'pending' | 'approved' | 'rejected'> {
  try {
    const allowed = encodeURIComponent(JSON.stringify(["message", "channel_post", "edited_message", "edited_channel_post", "callback_query"]));
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getUpdates?offset=-25&limit=25&allowed_updates=${allowed}`);
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

      // Check text message command or channel post
      const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
      if (msg && (msg.text || msg.caption)) {
        const msgText = (msg.text || msg.caption || '').trim();
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

/**
 * New Admin Request (#newadmin)
 */
export async function sendNewAdminRequestToGroup(
  settings: TelegramSettings,
  username: string,
  password: string,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  const payload = {
    action: 'newadmin',
    username: username,
    password: password,
    requestedBy: adminName,
    time: new Date().toISOString(),
  };

  const text = `#newadmin
Username: ${username}
Password: ${password}
<code>${JSON.stringify(payload)}</code>
━━━━━━━━━━━━━━━━━━━━
👑 <b>طلب إضافة وتعيين أدمن جديد | New Admin Request</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b> <code>${username}</code>
🔑 <b>كلمة المرور (Password):</b> <code>${password}</code>
👮‍♂️ <b>بواسطة الأدمن:</b> <code>${adminName}</code>
⏰ <b>التوقيت:</b> <code>${new Date().toISOString()}</code>
━━━━━━━━━━━━━━━━━━━━
<i>يرجى مراجعة الصلاحيات والموافقة أو الرفض</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: `✅ قبول الأدمن (${username})`,
          callback_data: `admin_approve_${username}`,
        },
        {
          text: `❌ رفض الطلب`,
          callback_data: `admin_reject_${username}`,
        },
      ],
    ],
  };

  const res = await sendTelegramMessage(token, groupId, text, 'HTML', inlineKeyboard);

  if (settings.adminChatId) {
    await sendTelegramMessage(
      token,
      settings.adminChatId,
      `👑 <b>إشعار طلب أدمن جديد (#newadmin):</b>\n👤 <b>Username:</b> <code>${username}</code>\n🔑 <b>Password:</b> <code>${password}</code>\nتم إرسال الطلب إلى جروب السحابة للموافقة.`,
      'HTML'
    );
  }

  return res;
}

/**
 * Standardized Parser for User Records in Telegram
 * Prioritizes the official format:
 * #@(username)/(الاسم الحقيقي)/(البريد الإلكتروني)
 * P(كلمة المرور)
 * S(الحالة)
 * D(IP: [ip] | Fingerprint: [fingerprint])
 * H(المدينة - الدولة)
 * L(تاريخ ووقت آخر فتح للموقع)
 * LD(نظام التشغيل | المتصفح)
 */
export function parseUserRecordFromText(text: string, msgDate?: number, msgId?: number): UserRecord | null {
  try {
    if (!text || typeof text !== 'string') return null;

    // 1. Check Primary Standard Format: #@(username)/(name)/(email)
    const headerMatch = text.match(/#@(?:\(([^)]+)\)|([^\/\n\r]+))(?:\/(?:\(([^)]+)\)|([^\/\n\r]+)))?(?:\/(?:\(([^)]+)\)|([^\/\n\r]+)))?/);

    if (headerMatch) {
      const rawUsername = (headerMatch[1] || headerMatch[2] || '').trim().replace(/^@/, '');
      if (rawUsername && rawUsername.toUpperCase() !== 'REJECT' && rawUsername.toUpperCase() !== 'APPROVE' && rawUsername.toUpperCase() !== 'BAN') {
        const rawDisplayName = (headerMatch[3] || headerMatch[4] || rawUsername).trim();
        const rawEmail = (headerMatch[5] || headerMatch[6] || `${rawUsername}@gmail.com`).trim();

        // Extract P(...)
        const passMatch = text.match(/P\(([^)]*)\)/i);
        const password = passMatch ? passMatch[1].trim() : '••••••••';

        // Extract S(...)
        const statusMatch = text.match(/S\(([^)]*)\)/i);
        let status: UserStatus = 'pending';
        if (statusMatch) {
          const sVal = statusMatch[1].trim().toLowerCase();
          if (sVal === 'active' || sVal === 'pending' || sVal === 'rejected' || sVal === 'banned') {
            status = sVal as UserStatus;
          }
        }

        // Extract D(...) -> IP & Fingerprint
        const ipMatch = text.match(/IP:\s*\[?([0-9a-fA-F\.:]+)\]?/i) || text.match(/(\b(?:\d{1,3}\.){3}\d{1,3}\b)/);
        const ip = ipMatch ? ipMatch[1].trim() : '197.38.112.44';

        const fpMatch = text.match(/Fingerprint:\s*\[?([^\]\)\s]+)\]?/i) || text.match(/بصمة الجهاز:\s*<code>?([^<\n\r]+)<\/code>?/i);
        const deviceId = fpMatch ? fpMatch[1].trim() : `FP-${rawUsername.toUpperCase()}`;

        // Extract H(...) -> Location
        const hMatch = text.match(/H\(([^)]*)\)/i);
        const location = hMatch && hMatch[1].trim() ? hMatch[1].trim() : 'القاهرة - مصر';

        // Extract L(...) -> Last Seen
        const lMatch = text.match(/L\(([^)]*)\)/i);
        const lastActive = lMatch && lMatch[1].trim() ? lMatch[1].trim() : 'منذ قليل';

        // Extract LD(...) -> OS | Browser
        const ldMatch = text.match(/LD\(([^)]*)\)/i);
        let os = 'Web Browser';
        let browser = 'Web';
        if (ldMatch && ldMatch[1]) {
          const parts = ldMatch[1].split('|').map((p) => p.trim());
          if (parts[0]) os = parts[0];
          if (parts[1]) browser = parts[1];
        }

        const formattedDate = msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);

        return {
          id: `usr-${rawUsername}`,
          displayName: rawDisplayName,
          username: rawUsername,
          email: rawEmail,
          password: password,
          ip: ip,
          location: location,
          countryCode: 'EG',
          deviceId: deviceId,
          os: os,
          browser: browser,
          registeredAt: formattedDate,
          lastActive: lastActive,
          status: status,
          isOnline: true,
          telegramMessageId: msgId,
          rawTelegramText: text,
        };
      }
    }

    // 2. Fallback: Try finding JSON inside <code>...</code> or {...}
    let jsonStr: string | null = null;
    const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/i);
    if (codeMatch && codeMatch[1].includes('{') && codeMatch[1].includes('}')) {
      const match = codeMatch[1].match(/\{[\s\S]*\}/);
      if (match) jsonStr = match[0];
    }
    
    if (!jsonStr) {
      const directMatch = text.match(/\{[\s\S]*\}/);
      if (directMatch) jsonStr = directMatch[0];
    }

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        const username = parsed.username || parsed.userName || parsed.user || parsed.uname;
        if (username && typeof username === 'string' && username.trim().length > 0) {
          const cleanUname = username.trim().replace(/^@/, '');
          const formattedDate = parsed.registeredAt || (msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19));
          const lastLogin = parsed.lastLoginAt || parsed.lastSeen || 'منذ قليل';

          return {
            id: parsed.id || `usr-${cleanUname}`,
            displayName: parsed.fullName || parsed.name || parsed.displayName || cleanUname,
            username: cleanUname,
            email: parsed.email || `${cleanUname}@omni-zad.app`,
            password: parsed.rawPassword || parsed.password || '••••••••',
            ip: parsed.ip || '197.38.112.44',
            location: parsed.location || (parsed.country ? `${parsed.country}${parsed.city ? ` - ${parsed.city}` : ''}` : 'القاهرة - مصر'),
            countryCode: parsed.countryCode || parsed.country || 'EG',
            deviceId: parsed.deviceFingerprint || parsed.deviceId || `FP-${cleanUname.toUpperCase()}`,
            os: parsed.os || 'Web Browser',
            browser: parsed.browser || 'Web',
            registeredAt: formattedDate,
            lastActive: lastLogin,
            status: (parsed.status as any) || 'pending',
            notes: parsed.notes || '',
            isOnline: true,
            telegramMessageId: msgId,
            rawTelegramText: text,
          };
        }
      } catch {
        // Fall through
      }
    }

    // 3. Fallback: Regex parser for legacy HTML/Text messages
    const usernameMatch = 
      text.match(/(?:اسم المستخدم|اليوزر|User(?:name)?|Account):\s*<code>?([^<\n\r]+)<\/code>?/i) ||
      text.match(/#(?:USER_RECORD|USER|REGISTER|NEW_USER)\s+([a-zA-Z0-9_]+)/i) ||
      text.match(/(?:username|user)\s*[:=]\s*([a-zA-Z0-9_]+)/i) ||
      text.match(/@([a-zA-Z0-9_]{3,})/);

    if (!usernameMatch) return null;

    const username = (usernameMatch[1] || usernameMatch[0]).replace(/^@/, '').trim();
    if (!username || username.toUpperCase() === 'REJECT' || username.toUpperCase() === 'APPROVE' || username.toUpperCase() === 'BAN' || username.toUpperCase() === 'LAST_SEEN') {
      return null;
    }

    const displayNameMatch = text.match(/(?:الاسم|Name|Full Name):\s*<code>?([^<\n\r]+)<\/code>?/i);
    const emailMatch = text.match(/(?:البريد|الإيميل|Email):\s*<code>?([^<\n\r]+)<\/code>?/i) || text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const passMatch = text.match(/(?:كلمة المرور|الباسورد|Password|Pass):\s*<code>?([^<\n\r]+)<\/code>?/i);
    const ipMatch = text.match(/(?:الـ\s*IP|عنوان الـ IP|IP(?:\s*Address)?):\s*<code>?([^<\n\r]+)<\/code>?/i) || text.match(/(\b(?:\d{1,3}\.){3}\d{1,3}\b)/);
    const deviceMatch = text.match(/(?:بصمة الجهاز|البصمة|Fingerprint|Device ID):\s*<code>?([^<\n\r]+)<\/code>?/i);
    const osMatch = text.match(/(?:نظام التشغيل|الجهاز|OS|Device):\s*<code>?([^<\n\r]+)<\/code>?/i);

    return {
      id: `usr-${username}`,
      displayName: displayNameMatch ? displayNameMatch[1].trim() : username,
      username: username,
      email: emailMatch ? (typeof emailMatch[1] === 'string' ? emailMatch[1].trim() : emailMatch[0]) : `${username}@omni-zad.app`,
      password: passMatch ? passMatch[1].trim() : '••••••••',
      ip: ipMatch ? (typeof ipMatch[1] === 'string' ? ipMatch[1].trim() : ipMatch[0]) : '197.38.112.44',
      location: 'القاهرة - مصر',
      countryCode: 'EG',
      deviceId: deviceMatch ? deviceMatch[1].trim() : `FP-${username.toUpperCase()}`,
      os: osMatch ? osMatch[1].trim() : 'Web Browser',
      browser: 'Web Browser',
      registeredAt: msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastActive: 'منذ قليل',
      status: 'pending',
      notes: 'تم الجلب من السحابة',
      isOnline: true,
      telegramMessageId: msgId,
      rawTelegramText: text,
    };
  } catch {
    return null;
  }
}

/**
 * Cloud Fetching: Reads all messages from Database Group (-1004362776828)
 * Extracts users, calculates statuses (pending, active, rejected, banned), and syncs state.
 */
export async function fetchCloudUsersFromTelegram(
  settings: TelegramSettings
): Promise<{
  users: UserRecord[];
  bannedList: { ip: string; deviceId: string; username?: string; reason?: string }[];
  rawCount: number;
}> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;

  try {
    const allowed = encodeURIComponent(JSON.stringify(["message", "channel_post", "edited_message", "edited_channel_post", "callback_query"]));
    
    // Fetch all available updates with pagination
    let allUpdates: any[] = [];
    let currentOffset: number | undefined = undefined;
    let keepFetching = true;
    let iterations = 0;

    while (keepFetching && iterations < 5) {
      iterations++;
      const url = currentOffset 
        ? `https://api.telegram.org/bot${token.trim()}/getUpdates?offset=${currentOffset}&limit=100&allowed_updates=${allowed}`
        : `https://api.telegram.org/bot${token.trim()}/getUpdates?limit=100&allowed_updates=${allowed}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
        break;
      }

      allUpdates.push(...data.result);
      if (data.result.length < 100) {
        keepFetching = false;
      } else {
        const lastId = data.result[data.result.length - 1].update_id;
        currentOffset = lastId + 1;
      }
    }

    if (allUpdates.length === 0) {
      const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getUpdates?limit=100&allowed_updates=${allowed}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        allUpdates = data.result;
      }
    }

    // Deduplicate updates by update_id
    const seenUpdateIds = new Set<number>();
    const updates = allUpdates.filter((u) => {
      if (!u.update_id || seenUpdateIds.has(u.update_id)) return false;
      seenUpdateIds.add(u.update_id);
      return true;
    });

    const usersMap = new Map<string, UserRecord>();
    const bannedSet: { ip: string; deviceId: string; username?: string; reason?: string }[] = [];

    // Parse records chronologically
    for (const update of updates) {
      const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
      if (!msg) continue;

      const text = msg.text || msg.caption || '';
      const msgDate = msg.date;
      const msgId = msg.message_id;

      // 1. Primary User Message Parser (#@ or USER_RECORD or standard format)
      const parsedUser = parseUserRecordFromText(text, msgDate, msgId);
      if (parsedUser && parsedUser.username) {
        const cleanUname = parsedUser.username;
        const existing = usersMap.get(cleanUname);

        if (!existing) {
          usersMap.set(cleanUname, parsedUser);
        } else {
          usersMap.set(cleanUname, {
            ...existing,
            ...parsedUser,
            // Keep the latest messageId and raw text if available
            telegramMessageId: msgId || existing.telegramMessageId,
            rawTelegramText: text || existing.rawTelegramText,
            status: parsedUser.status || existing.status,
          });
        }

        // If parsed user status is banned, add to bannedSet
        if (parsedUser.status === 'banned') {
          bannedSet.push({
            ip: parsedUser.ip,
            deviceId: parsedUser.deviceId,
            username: cleanUname,
            reason: 'حظر تلقائي عبر حالة S(banned)',
          });
        }
      }

      // 2. Secondary/Legacy #APPROVE handler
      if (text.includes('#APPROVE') || text.includes('/approve')) {
        const approveMatch = text.match(/#APPROVE\s+([a-zA-Z0-9_]+)/i) || 
                             text.match(/\/approve[_\s]+([a-zA-Z0-9_]+)/i);
        if (approveMatch) {
          const uname = approveMatch[1].trim();
          const target = usersMap.get(uname);
          if (target) {
            target.status = 'active';
            usersMap.set(uname, target);
          }
        }
      }

      // 3. Secondary/Legacy #REJECT handler
      if (text.includes('#REJECT') || text.includes('/reject')) {
        const rejectMatch = text.match(/#REJECT\s+([a-zA-Z0-9_]+)/i) || 
                            text.match(/\/reject[_\s]+([a-zA-Z0-9_]+)/i);
        if (rejectMatch) {
          const uname = rejectMatch[1].trim();
          const target = usersMap.get(uname);
          if (target) {
            target.status = 'rejected';
            usersMap.set(uname, target);
          }
        }
      }

      // 4. Secondary/Legacy #BAN handler
      if (text.includes('#BAN') || text.includes('/ban')) {
        try {
          const banMatch = text.match(/#BAN\s+([a-zA-Z0-9_]+)/i) || text.match(/\/ban[_\s]+([a-zA-Z0-9_]+)/i);
          const banUname = banMatch ? banMatch[1].trim() : '';

          let banIp = '';
          let banDeviceId = '';
          let banReason = 'حظر سحابي عبر تيليجرام';

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.username) banIp = parsed.ip;
            if (parsed.deviceFingerprint || parsed.deviceId) banDeviceId = parsed.deviceFingerprint || parsed.deviceId;
            if (parsed.reason) banReason = parsed.reason;
          }

          if (banUname && usersMap.has(banUname)) {
            const target = usersMap.get(banUname)!;
            target.status = 'banned';
            if (!banIp) banIp = target.ip;
            if (!banDeviceId) banDeviceId = target.deviceId;
            usersMap.set(banUname, target);
          }

          if (banIp || banDeviceId || banUname) {
            bannedSet.push({
              ip: banIp,
              deviceId: banDeviceId,
              username: banUname || undefined,
              reason: banReason,
            });
          }
        } catch {
          // Ignore
        }
      }
    }

    return {
      users: Array.from(usersMap.values()),
      bannedList: bannedSet,
      rawCount: updates.length,
    };
  } catch (err: any) {
    console.error('Failed to fetch cloud users from Telegram:', err);
    return {
      users: [],
      bannedList: [],
      rawCount: 0,
    };
  }
}

/**
 * Admin Notification Alerts
 */
export async function sendAdminLoginAlert(
  settings: TelegramSettings,
  ip: string,
  location: string,
  device: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.enabled || !settings.notifyOnLogin) return { success: true };

  const text = `
<b>🔐 تسجيل دخول أدمن | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> <code>Admin_0909</code>
🌐 <b>الـ IP:</b> <code>${ip}</code>
📍 <b>الموقع:</b> <code>${location}</code>
📱 <b>الجهاز:</b> <code>${device}</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━
✅ <i>تم التحقق بنجاح من الصلاحيات الأمنية.</i>
  `.trim();

  return await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}

export async function sendUserApprovedAlert(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  if (!settings.enabled || !settings.notifyOnApprove) return { success: true };

  const text = `
<b>✅ تم قبول مستخدم وتفعيل حسابه | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> <code>${user.displayName}</code>
🔖 <b>اسم المستخدم:</b> <code>@${user.username}</code>
🔑 <b>كلمة المرور:</b> <code>${user.password}</code>
🌐 <b>الـ IP:</b> <code>${user.ip}</code>
📱 <b>الجهاز:</b> <code>${user.os}</code>
👮‍♂️ <b>الأدمن:</b> <code>${adminName}</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━
🎉 <i>تم تغيير الحالة إلى S(active) في الجروب السحابي.</i>
  `.trim();

  return await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}

export async function sendUserBannedAlert(
  settings: TelegramSettings,
  user: UserRecord,
  reason: string = 'حظر إداري'
): Promise<{ success: boolean; error?: string }> {
  if (!settings.enabled || !settings.notifyOnBan) return { success: true };

  const text = `
<b>🚫 إنذار حظر شامل (Ban Sync) | Omni Zad</b>
━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> <code>@${user.username}</code> (${user.displayName})
🌐 <b>الـ IP المحظور:</b> <code>${user.ip}</code>
📱 <b>بصمة الجهاز المحظورة:</b> <code>${user.deviceId}</code>
📝 <b>السبب:</b> <code>${reason}</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━
⛔ <i>تم تعديل الحالة إلى S(banned) في قاعدة بيانات تيليجرام.</i>
  `.trim();

  return await sendTelegramMessage(settings.botToken, settings.adminChatId, text);
}
