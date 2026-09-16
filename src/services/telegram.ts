import { TelegramSettings, UserRecord } from '../types';

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
  };

  const text = `#BAN ${payload.username}
<code>${JSON.stringify(banJson)}</code>
━━━━━━━━━━━━━━━━━━━━
⛔ <b>أمر حظر فوري ومزامنة سحابية | Ban Sync</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b> <code>${payload.username}</code>
🔑 <b>معرف الجهاز (Device Fingerprint):</b> <code>${payload.deviceFingerprint}</code>
🌐 <b>عنوان الـ IP:</b> <code>${payload.ip}</code>
⏰ <b>توقيت الحظر:</b> <code>${nowIso}</code>
${payload.reason ? `📝 <b>السبب:</b> <code>${payload.reason}</code>\n` : ''}`;

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

export async function sendUserApprovalToCloud(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  const payload = {
    action: 'approve',
    username: user.username,
    status: 'active',
  };

  const text = `#APPROVE ${user.username}
<code>${JSON.stringify(payload)}</code>
━━━━━━━━━━━━━━━━━━━━
✅ <b>تمت الموافقة وتفعيل الحساب | Account Approved</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b> <code>${user.username}</code>
🔑 <b>كلمة المرور (Password):</b> <code>${user.password}</code>
🌐 <b>عنوان الـ IP:</b> <code>${user.ip}</code>
📱 <b>بصمة الجهاز (Fingerprint):</b> <code>${user.deviceId}</code>
⏰ <b>التوقيت:</b> <code>${new Date().toISOString()}</code>
👮‍♂️ <b>الأدمن المنفذ:</b> <code>${adminName}</code>`;

  const res = await sendTelegramMessage(token, groupId, text, 'HTML');

  // Also send notification to Admin private chat
  if (settings.enabled && settings.notifyOnApprove) {
    await sendUserApprovedAlert(settings, user, adminName);
  }

  return res;
}

export async function sendUserRejectionToCloud(
  settings: TelegramSettings,
  user: UserRecord,
  adminName: string = 'Admin_0909'
): Promise<{ success: boolean; error?: string }> {
  const token = settings.botToken || DEFAULT_TELEGRAM_SETTINGS.botToken;
  const groupId = settings.databaseGroupId || DEFAULT_TELEGRAM_SETTINGS.databaseGroupId;

  const payload = {
    action: 'reject',
    username: user.username,
    status: 'rejected',
  };

  const text = `#REJECT ${user.username}
<code>${JSON.stringify(payload)}</code>
━━━━━━━━━━━━━━━━━━━━
❌ <b>تم رفض طلب التسجيل | Registration Rejected</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b> <code>${user.username}</code>
🌐 <b>عنوان الـ IP:</b> <code>${user.ip}</code>
📱 <b>بصمة الجهاز (Fingerprint):</b> <code>${user.deviceId}</code>
⏰ <b>التوقيت:</b> <code>${new Date().toISOString()}</code>
👮‍♂️ <b>الأدمن المنفذ:</b> <code>${adminName}</code>`;

  const res = await sendTelegramMessage(token, groupId, text, 'HTML');

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
⚠️ <i>تم تحويل المستخدم إلى شاشة "أنت غير مقبول" في الموقع الرئيسي.</i>
    `.trim();
    await sendTelegramMessage(settings.botToken, settings.adminChatId, adminAlertText);
  }

  return res;
}

/**
 * Parses user JSON or text from Telegram message content
 */
function parseUserRecordFromText(text: string, msgDate?: number): UserRecord | null {
  try {
    // 1. Try finding JSON inside <code>...</code> or {...}
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
        const username = parsed.username || parsed.userName;
        if (username) {
          const formattedDate = parsed.registeredAt || (msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19));
          const lastLogin = parsed.lastLoginAt || parsed.lastSeen || 'منذ قليل';

          return {
            id: parsed.id || `usr-${username}`,
            displayName: parsed.fullName || parsed.name || parsed.displayName || username,
            username: username,
            email: parsed.email || `${username}@omni-zad.app`,
            password: parsed.rawPassword || parsed.password || '••••••••',
            ip: parsed.ip || '197.38.112.44',
            location: parsed.location || (parsed.country ? `${parsed.country}${parsed.city ? ` - ${parsed.city}` : ''}` : 'مصر'),
            countryCode: parsed.countryCode || parsed.country || 'EG',
            deviceId: parsed.deviceFingerprint || parsed.deviceId || `FP-${username.toUpperCase()}`,
            os: parsed.os || 'Web Browser',
            browser: parsed.browser || 'Web',
            registeredAt: formattedDate,
            lastActive: lastLogin,
            status: (parsed.status as any) || 'pending',
            notes: parsed.notes || '',
            isOnline: true,
          };
        }
      } catch {
        // Continue to regex fallback
      }
    }

    // 2. Regex fallback parser for HTML/Text formatted #USER_RECORD messages
    const usernameMatch = text.match(/اسم المستخدم(?:\s*\(Username\))?:\s*<code>?([^<\n\r]+)<\/code>?/i) || text.match(/@([a-zA-Z0-9_]+)/);
    if (!usernameMatch) return null;

    const username = usernameMatch[1].trim();
    const displayNameMatch = text.match(/الاسم(?:\s*\(Name\))?:\s*<code>?([^<\n\r]+)<\/code>?/i);
    const emailMatch = text.match(/البريد(?:\s*\(Email\))?:\s*<code>?([^<\n\r]+)<\/code>?/i) || text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const passMatch = text.match(/كلمة المرور(?:\s*\(Password\))?:\s*<code>?([^<\n\r]+)<\/code>?/i);
    const ipMatch = text.match(/الـ\s*IP:\s*<code>?([^<\n\r]+)<\/code>?/i) || text.match(/(\b(?:\d{1,3}\.){3}\d{1,3}\b)/);
    const deviceMatch = text.match(/بصمة الجهاز(?:\s*\(Fingerprint\))?:\s*<code>?([^<\n\r]+)<\/code>?/i);
    const osMatch = text.match(/(?:نظام التشغيل|الجهاز):\s*<code>?([^<\n\r]+)<\/code>?/i);

    return {
      id: `usr-${username}`,
      displayName: displayNameMatch ? displayNameMatch[1].trim() : username,
      username: username,
      email: emailMatch ? (typeof emailMatch[1] === 'string' ? emailMatch[1].trim() : emailMatch[0]) : `${username}@gmail.com`,
      password: passMatch ? passMatch[1].trim() : 'ZadPass2026',
      ip: ipMatch ? (typeof ipMatch[1] === 'string' ? ipMatch[1].trim() : ipMatch[0]) : '197.38.112.44',
      location: 'مصر',
      countryCode: 'EG',
      deviceId: deviceMatch ? deviceMatch[1].trim() : `FP-${username.toUpperCase()}`,
      os: osMatch ? osMatch[1].trim() : 'Unknown OS',
      browser: 'Web Browser',
      registeredAt: msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastActive: 'منذ قليل',
      status: 'pending',
      notes: 'تم الجلب من السحابة',
      isOnline: true,
    };
  } catch {
    return null;
  }
}

/**
 * 2. Cloud Fetching: Read all messages from the Database Group (-1004362776828)
 * and extract all #USER_RECORD, #APPROVE, #REJECT, and #BAN updates.
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
    
    // Fetch all available updates (up to multiple pages if available)
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

    // Fallback if pagination didn't yield
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

      // 1. Check for USER_RECORD (Registration)
      if (text.includes('#USER_RECORD') || text.includes('user_register') || text.includes('"action": "register"') || text.includes('"action":"register"')) {
        const parsedUser = parseUserRecordFromText(text, msgDate);
        if (parsedUser && parsedUser.username) {
          const existing = usersMap.get(parsedUser.username);
          if (!existing) {
            usersMap.set(parsedUser.username, parsedUser);
          } else {
            usersMap.set(parsedUser.username, {
              ...existing,
              ...parsedUser,
              // Maintain updated state unless newly specified
              status: existing.status !== 'pending' ? existing.status : parsedUser.status,
            });
          }
        }
      }

      // 2. Check for #APPROVE / /approve
      if (text.includes('#APPROVE') || text.includes('/approve') || text.includes('"action": "approve"') || text.includes('"action":"approve"')) {
        const approveMatch = text.match(/#APPROVE\s+([a-zA-Z0-9_]+)/i) || 
                             text.match(/\/approve[_\s]+([a-zA-Z0-9_]+)/i) || 
                             text.match(/"username":\s*"([^"]+)"/);
        if (approveMatch) {
          const uname = approveMatch[1].trim();
          const target = usersMap.get(uname);
          if (target) {
            target.status = 'active';
            usersMap.set(uname, target);
          } else {
            usersMap.set(uname, {
              id: `usr-${uname}`,
              displayName: uname,
              username: uname,
              email: `${uname}@omni-zad.app`,
              password: '••••••••',
              ip: '197.38.112.44',
              location: 'مصر',
              countryCode: 'EG',
              deviceId: `FP-${uname.toUpperCase()}`,
              os: 'Web Browser',
              browser: 'Web',
              registeredAt: msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19),
              lastActive: 'منذ قليل',
              status: 'active',
              notes: 'موافقة وتفعيل سحابي',
              isOnline: true,
            });
          }
        }
      }

      // 3. Check for #REJECT / #UNAPPROVED / /reject
      if (text.includes('#REJECT') || text.includes('#UNAPPROVED') || text.includes('/reject') || text.includes('"action": "reject"') || text.includes('"action":"reject"')) {
        const rejectMatch = text.match(/#REJECT\s+([a-zA-Z0-9_]+)/i) || 
                            text.match(/#UNAPPROVED\s+([a-zA-Z0-9_]+)/i) || 
                            text.match(/\/reject[_\s]+([a-zA-Z0-9_]+)/i) || 
                            text.match(/"username":\s*"([^"]+)"/);
        if (rejectMatch) {
          const uname = rejectMatch[1].trim();
          const target = usersMap.get(uname);
          if (target) {
            target.status = 'rejected';
            usersMap.set(uname, target);
          } else {
            usersMap.set(uname, {
              id: `usr-${uname}`,
              displayName: uname,
              username: uname,
              email: `${uname}@omni-zad.app`,
              password: '••••••••',
              ip: '197.38.112.44',
              location: 'مصر',
              countryCode: 'EG',
              deviceId: `FP-${uname.toUpperCase()}`,
              os: 'Web Browser',
              browser: 'Web',
              registeredAt: msgDate ? new Date(msgDate * 1000).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19),
              lastActive: 'منذ قليل',
              status: 'rejected',
              notes: 'تم الرفض سحابياً',
              isOnline: false,
            });
          }
        }
      }

      // 4. Check for #BAN / /ban
      if (text.includes('#BAN') || text.includes('/ban') || text.includes('"action": "ban"') || text.includes('"action":"ban"')) {
        try {
          const banMatch = text.match(/#BAN\s+([a-zA-Z0-9_]+)/i) || text.match(/\/ban[_\s]+([a-zA-Z0-9_]+)/i);
          let banUname = banMatch ? banMatch[1].trim() : '';

          let banIp = '';
          let banDeviceId = '';
          let banReason = 'حظر سحابي عبر تيليجرام';

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.username) banUname = parsed.username;
            if (parsed.ip) banIp = parsed.ip;
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
          // Ignore parse errors
        }
      }

      // 5. Check for #LAST_SEEN / #USER_LOGIN
      if (text.includes('#LAST_SEEN') || text.includes('#USER_LOGIN') || text.includes('"action": "login"') || text.includes('"action":"login"')) {
        try {
          const loginMatch = text.match(/#(?:LAST_SEEN|USER_LOGIN)\s+([a-zA-Z0-9_]+)/i) || text.match(/"username":\s*"([^"]+)"/);
          if (loginMatch) {
            const uname = loginMatch[1].trim();
            const target = usersMap.get(uname);
            if (target) {
              const dateStr = msgDate ? new Date(msgDate * 1000).toLocaleString('ar-EG') : 'منذ لحظات';
              target.lastActive = dateStr;
              target.isOnline = true;

              // Check if login event has updated IP or device
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.ip) target.ip = parsed.ip;
                if (parsed.deviceFingerprint || parsed.deviceId) target.deviceId = parsed.deviceFingerprint || parsed.deviceId;
                if (parsed.os) target.os = parsed.os;
              }
              usersMap.set(uname, target);
            }
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
  } catch {
    return { users: [], bannedList: [], rawCount: 0 };
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

