import React, { useState, useEffect } from 'react';
import { FakeErrorScreen } from './components/FakeErrorScreen';
import { SecretLoginModal } from './components/SecretLoginModal';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { UsersTable } from './components/UsersTable';
import { LiveLogsTable } from './components/LiveLogsTable';
import { BannedManager } from './components/BannedManager';
import { TelegramPanel } from './components/TelegramPanel';
import { UserModal } from './components/UserModal';
import { BanModal } from './components/BanModal';
import { BannedScreen } from './components/BannedScreen';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredLogs,
  saveStoredLogs,
  addAccessLog,
  getStoredBanned,
  saveStoredBanned,
  getStoredTelegramSettings,
  saveStoredTelegramSettings,
  getAdminAuthSession,
  setAdminAuthSession,
  resetToDemoData,
} from './services/storage';
import {
  testTelegramBot,
  sendUserApprovedAlert,
  sendUserBannedAlert,
  sendAdminLoginAlert,
  sendUserApprovalToCloud,
  sendUserRejectionToCloud,
  sendUserBanToCloud,
  syncBanToCloudDatabaseGroup,
  sendNewAdminRequestToGroup,
  fetchCloudUsersFromTelegram,
  deleteUserMessagesFromTelegramGroup,
} from './services/telegram';
import { getClientDeviceInfo, getClientPublicIP } from './services/deviceInfo';
import { AccessLog, AdminStats, BannedEntity, TelegramSettings, UserRecord } from './types';
import { Users, Activity, ShieldBan, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  // Authentication & View States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDisguised, setIsDisguised] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isBannedVisitor, setIsBannedVisitor] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [bannedInfo, setBannedInfo] = useState<{ ip: string; deviceId: string; reason?: string }>({
    ip: '',
    deviceId: '',
  });

  // Data States
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [bannedList, setBannedList] = useState<BannedEntity[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(getStoredTelegramSettings());
  const [telegramOnline, setTelegramOnline] = useState<boolean>(false);

  // Tab & Filters
  const [currentTab, setCurrentTab] = useState<'users' | 'logs' | 'banned'>('users');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'banned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserRecord | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState<boolean>(false);
  const [userToBan, setUserToBan] = useState<UserRecord | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);

  // Client Info
  const [clientInfo, setClientInfo] = useState<{ ip: string; location: string; countryCode: string; deviceId: string; os: string }>({
    ip: '197.38.112.44',
    location: 'القاهرة، مصر',
    countryCode: 'EG',
    deviceId: 'FP-DEV-001',
    os: 'Windows 11',
  });

  // Initial Load & Verification
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedLogs = getStoredLogs();
    const loadedBanned = getStoredBanned();
    const loadedTelegram = getStoredTelegramSettings();
    const hasAuth = getAdminAuthSession();

    setUsers(loadedUsers);
    setLogs(loadedLogs);
    setBannedList(loadedBanned);
    setTelegramSettings(loadedTelegram);
    setIsAuthenticated(hasAuth);
    
    // If authenticated previously, default to dashboard
    if (hasAuth) {
      setIsDisguised(false);
    }

    // Get Device & IP Details
    const device = getClientDeviceInfo();
    getClientPublicIP().then((ipData) => {
      const fullInfo = {
        ...ipData,
        deviceId: device.deviceId,
        os: device.os,
      };
      setClientInfo(fullInfo);

      // Check if current IP or Device is on the blacklist (unless already an authenticated admin)
      if (!hasAuth) {
        const isIpBanned = loadedBanned.some((b) => b.type === 'ip' && b.value === ipData.ip);
        const isDevBanned = loadedBanned.some((b) => b.type === 'device' && b.value === device.deviceId);
        if (isIpBanned || isDevBanned) {
          const match = loadedBanned.find(
            (b) => (b.type === 'ip' && b.value === ipData.ip) || (b.type === 'device' && b.value === device.deviceId)
          );
          setIsBannedVisitor(true);
          setBannedInfo({
            ip: ipData.ip,
            deviceId: device.deviceId,
            reason: match?.reason,
          });
        }
      }

      // Log initial page visit
      addAccessLog({
        ip: ipData.ip,
        location: ipData.location,
        device: device.browser,
        os: device.os,
        deviceId: device.deviceId,
        eventType: 'page_open',
        details: 'زيارة الصفحة الرئيسية لمنصة Omni Zad',
        status: 'info',
      });
      setLogs(getStoredLogs());
    });

    // Test Telegram Bot Connection
    testTelegramBot(loadedTelegram.botToken).then((res) => {
      setTelegramOnline(res.success);
    });

    // Auto-fetch users and banned records from Cloud Telegram Group on load
    const doInitialSync = async () => {
      setIsSyncingCloud(true);
      try {
        const cloudResult = await fetchCloudUsersFromTelegram(loadedTelegram);
        if (cloudResult.users.length > 0) {
          setUsers((prevUsers) => {
            const merged = [...prevUsers];
            cloudResult.users.forEach((cu) => {
              const idx = merged.findIndex((mu) => mu.username === cu.username || mu.id === cu.id);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...cu };
              } else {
                merged.unshift(cu);
              }
            });
            saveStoredUsers(merged);
            return merged;
          });
        }

        if (cloudResult.bannedList.length > 0) {
          setBannedList((prevBanned) => {
            const mergedBanned = [...prevBanned];
            cloudResult.bannedList.forEach((cb) => {
              if (!mergedBanned.some((b) => b.value === cb.ip || b.value === cb.deviceId)) {
                if (cb.ip) {
                  mergedBanned.push({
                    id: `ban-cloud-${Date.now()}-ip`,
                    type: 'ip',
                    value: cb.ip,
                    reason: cb.reason || 'Cloud Sync Ban',
                    bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    userRef: cb.username,
                  });
                }
                if (cb.deviceId) {
                  mergedBanned.push({
                    id: `ban-cloud-${Date.now()}-dev`,
                    type: 'device',
                    value: cb.deviceId,
                    reason: cb.reason || 'Cloud Sync Ban',
                    bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    userRef: cb.username,
                  });
                }
              }
            });
            saveStoredBanned(mergedBanned);
            return mergedBanned;
          });
        }
      } catch (e) {
        console.error('Initial cloud sync error:', e);
      } finally {
        setIsSyncingCloud(false);
      }
    };

    doInitialSync();
  }, []);

  // Periodic Auto-Sync with Telegram Cloud Group every 12 seconds when viewing admin panel
  useEffect(() => {
    if (!isAuthenticated || isDisguised) return;

    const interval = setInterval(async () => {
      try {
        const cloudResult = await fetchCloudUsersFromTelegram(telegramSettings);
        if (cloudResult.users.length > 0) {
          setUsers((prevUsers) => {
            const merged = [...prevUsers];
            let hasChanges = false;
            cloudResult.users.forEach((cu) => {
              const idx = merged.findIndex((mu) => mu.username === cu.username || mu.id === cu.id);
              if (idx >= 0) {
                if (merged[idx].status !== cu.status || merged[idx].lastActive !== cu.lastActive) {
                  merged[idx] = { ...merged[idx], ...cu };
                  hasChanges = true;
                }
              } else {
                merged.unshift(cu);
                hasChanges = true;
              }
            });
            if (hasChanges) {
              saveStoredUsers(merged);
              return [...merged];
            }
            return prevUsers;
          });
        }
      } catch {
        // Background polling silent fail
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isDisguised, telegramSettings]);

  // Update HTML document title based on view mode
  useEffect(() => {
    if (isDisguised || !isAuthenticated) {
      document.title = '404 Not Found';
    } else {
      document.title = 'Omni Zad Admin Panel';
    }
  }, [isDisguised, isAuthenticated]);

  // Handle Secret 5-Clicks on 404
  const handleSecretTriggered = () => {
    setIsLoginModalOpen(true);
  };

  // Handle Admin Login Success
  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    setIsDisguised(false);
    setIsLoginModalOpen(false);
    setAdminAuthSession(true);

    // Add log
    const newLog = addAccessLog({
      ip: clientInfo.ip,
      location: clientInfo.location,
      device: 'Admin Console',
      os: clientInfo.os,
      deviceId: clientInfo.deviceId,
      eventType: 'login_attempt',
      details: 'تسجيل دخول ناجح للأدمن الرئيسي (Admin_0909)',
      status: 'success',
      userRef: 'Admin_0909',
    });
    setLogs(getStoredLogs());

    // Send Telegram Alert
    await sendAdminLoginAlert(
      telegramSettings,
      clientInfo.ip,
      clientInfo.location,
      `${clientInfo.os} (FP: ${clientInfo.deviceId})`
    );
  };

  // Handle Admin Logout
  const handleLogout = () => {
    setAdminAuthSession(false);
    setIsAuthenticated(false);
    setIsDisguised(true);
  };

  // Handle Quick Disguise
  const handleDisguise = () => {
    setIsDisguised(true);
  };

  // User Actions: ☁️ Manual Cloud Sync
  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const cloudResult = await fetchCloudUsersFromTelegram(telegramSettings);
      if (cloudResult.users.length > 0) {
        setUsers((prevUsers) => {
          const merged = [...prevUsers];
          cloudResult.users.forEach((cu) => {
            const idx = merged.findIndex((mu) => mu.username === cu.username || mu.id === cu.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...cu };
            } else {
              merged.unshift(cu);
            }
          });
          saveStoredUsers(merged);
          return merged;
        });
      }

      if (cloudResult.bannedList.length > 0) {
        setBannedList((prevBanned) => {
          const mergedBanned = [...prevBanned];
          cloudResult.bannedList.forEach((cb) => {
            if (!mergedBanned.some((b) => b.value === cb.ip || b.value === cb.deviceId)) {
              if (cb.ip) {
                mergedBanned.push({
                  id: `ban-cloud-${Date.now()}-ip`,
                  type: 'ip',
                  value: cb.ip,
                  reason: cb.reason || 'Cloud Sync Ban',
                  bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  userRef: cb.username,
                });
              }
              if (cb.deviceId) {
                mergedBanned.push({
                  id: `ban-cloud-${Date.now()}-dev`,
                  type: 'device',
                  value: cb.deviceId,
                  reason: cb.reason || 'Cloud Sync Ban',
                  bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  userRef: cb.username,
                });
              }
            }
          });
          saveStoredBanned(mergedBanned);
          return mergedBanned;
        });
      }
      
      addAccessLog({
        ip: clientInfo.ip,
        location: clientInfo.location,
        device: 'Admin Console',
        os: clientInfo.os,
        deviceId: clientInfo.deviceId,
        eventType: 'admin_action',
        details: `تمت مزامنة السحابة بنجاح وجلب ${cloudResult.users.length} سجل مستخدمين و ${cloudResult.bannedList.length} حظر من تليجرام`,
        status: 'success',
      });
      setLogs(getStoredLogs());
    } catch (e) {
      console.error('Failed to sync cloud users:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // User Actions: 🟢 Approve
  const handleApproveUser = async (user: UserRecord) => {
    const updated = users.map((u) => (u.id === user.id ? { ...u, status: 'active' as const } : u));
    setUsers(updated);
    saveStoredUsers(updated);

    // Add Log
    addAccessLog({
      ip: user.ip,
      location: user.location,
      device: user.browser,
      os: user.os,
      deviceId: user.deviceId,
      eventType: 'status_change',
      details: `تم تفعيل وقبول حساب المستخدم ${user.displayName} (@${user.username})`,
      status: 'success',
      userRef: user.username,
    });
    setLogs(getStoredLogs());

    // Telegram Cloud Sync & Notification
    await sendUserApprovalToCloud(telegramSettings, { ...user, status: 'active' });
    await sendUserApprovedAlert(telegramSettings, { ...user, status: 'active' });
  };

  // User Actions: 🟠 Reject
  const handleRejectUser = async (user: UserRecord) => {
    const updated = users.map((u) => (u.id === user.id ? { ...u, status: 'rejected' as const } : u));
    setUsers(updated);
    saveStoredUsers(updated);

    // Add Log
    addAccessLog({
      ip: user.ip,
      location: user.location,
      device: user.browser,
      os: user.os,
      deviceId: user.deviceId,
      eventType: 'status_change',
      details: `تم رفض طلب حساب المستخدم ${user.displayName} (@${user.username})`,
      status: 'warning',
      userRef: user.username,
    });
    setLogs(getStoredLogs());

    // Telegram Cloud Sync
    await sendUserRejectionToCloud(telegramSettings, { ...user, status: 'rejected' });
  };

  // User Actions: 🔴 Ban IP & Device
  const handleTriggerBanModal = (user: UserRecord) => {
    setUserToBan(user);
    setIsBanModalOpen(true);
  };

  const handleConfirmBan = async (user: UserRecord, reason: string, banIpAndDevice: boolean) => {
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, status: 'banned' as const, banReason: reason } : u
    );
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Add to Banned List
    const newBannedEntries: BannedEntity[] = [...bannedList];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (banIpAndDevice) {
      // Ban IP
      if (!newBannedEntries.some((b) => b.type === 'ip' && b.value === user.ip)) {
        newBannedEntries.push({
          id: `ban-${Date.now()}-ip`,
          type: 'ip',
          value: user.ip,
          reason: `${reason} - مستخدم @${user.username}`,
          bannedAt: now,
          userRef: user.username,
        });
      }
      // Ban Device
      if (!newBannedEntries.some((b) => b.type === 'device' && b.value === user.deviceId)) {
        newBannedEntries.push({
          id: `ban-${Date.now()}-dev`,
          type: 'device',
          value: user.deviceId,
          reason: `${reason} - مستخدم @${user.username}`,
          bannedAt: now,
          userRef: user.username,
        });
      }
    }

    setBannedList(newBannedEntries);
    saveStoredBanned(newBannedEntries);

    // Add Log
    addAccessLog({
      ip: user.ip,
      location: user.location,
      device: user.browser,
      os: user.os,
      deviceId: user.deviceId,
      eventType: 'ban_trigger',
      details: `تم تنفيذ حظر شامل للحساب والـ IP وبصمة الجهاز: ${user.displayName} (@${user.username})`,
      status: 'danger',
      userRef: user.username,
    });
    setLogs(getStoredLogs());

    // Telegram Notification & Cloud Edit to S(banned)
    await sendUserBanToCloud(telegramSettings, { ...user, status: 'banned', banReason: reason }, reason);
  };

  // User Actions: ⚪ Unban
  const handleUnbanUser = async (user: UserRecord) => {
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, status: 'active' as const, banReason: undefined } : u
    );
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Remove from banned list
    const updatedBanned = bannedList.filter(
      (b) => !(b.value === user.ip || b.value === user.deviceId || b.value === user.username)
    );
    setBannedList(updatedBanned);
    saveStoredBanned(updatedBanned);

    addAccessLog({
      ip: user.ip,
      location: user.location,
      device: user.browser,
      os: user.os,
      deviceId: user.deviceId,
      eventType: 'status_change',
      details: `تم إلغاء الحظر وإعادة تنشيط حساب ${user.displayName} (@${user.username})`,
      status: 'info',
      userRef: user.username,
    });
    setLogs(getStoredLogs());

    // Update Telegram message to S(active)
    await sendUserApprovalToCloud(telegramSettings, { ...user, status: 'active', banReason: undefined });
  };

  // User Actions: 🗑️ Delete (wipes all user messages from Telegram cloud group & local state)
  const handleDeleteUser = async (user: UserRecord) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب "${user.displayName}" (@${user.username}) ومسح كافة رسائله من جروب التليجرام؟`)) {
      return;
    }

    // 1. Remove from local list immediately
    const updated = users.filter((u) => u.id !== user.id && u.username !== user.username);
    setUsers(updated);
    saveStoredUsers(updated);

    // 2. Scan and delete all messages containing this user from the Telegram Group
    try {
      const delResult = await deleteUserMessagesFromTelegramGroup(telegramSettings, user.username);
      
      addAccessLog({
        ip: user.ip,
        location: user.location,
        device: user.browser,
        os: user.os,
        deviceId: user.deviceId,
        eventType: 'admin_action',
        details: `تم حذف حساب المستخدم @${user.username} ومسح ${delResult.deletedCount || 0} رسالة متعلقة به من جروب التليجرام السحابي`,
        status: 'warning',
        userRef: user.username,
      });
      setLogs(getStoredLogs());
    } catch (e) {
      console.error('Failed to wipe messages from Telegram group:', e);
      addAccessLog({
        ip: user.ip,
        location: user.location,
        device: user.browser,
        os: user.os,
        deviceId: user.deviceId,
        eventType: 'admin_action',
        details: `تم حذف حساب @${user.username} محلياً وجاري مزامنة مسح رسائله من التليجرام`,
        status: 'warning',
        userRef: user.username,
      });
      setLogs(getStoredLogs());
    }
  };

  // User Actions: ✏️ Edit & ➕ Add
  const handleOpenEdit = (user: UserRecord) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };

  // Action: 👑 Add/Promote New Admin (#newadmin) to Telegram Group
  const handleSendNewAdmin = async (adminUsername: string, adminPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await sendNewAdminRequestToGroup(telegramSettings, adminUsername, adminPassword, 'Admin_0909');
      if (res.success) {
        addAccessLog({
          ip: clientInfo.ip,
          location: clientInfo.location,
          device: 'Admin Console',
          os: clientInfo.os,
          deviceId: clientInfo.deviceId,
          eventType: 'admin_action',
          details: `تم إرسال طلب تعيين أدمن جديد (#newadmin) إلى جروب التليجرام: @${adminUsername}`,
          status: 'info',
          userRef: adminUsername,
        });
        setLogs(getStoredLogs());
      }
      return res;
    } catch (e) {
      console.error('Failed to send #newadmin request to telegram:', e);
      return { success: false, error: 'تعذر الاتصال بخادم التليجرام' };
    }
  };

  const handleOpenAddUser = () => {
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (userData: Partial<UserRecord>) => {
    if (userToEdit) {
      const updated = users.map((u) =>
        u.id === userToEdit.id ? ({ ...u, ...userData } as UserRecord) : u
      );
      setUsers(updated);
      saveStoredUsers(updated);
    } else {
      const newUser: UserRecord = {
        id: `usr-${Date.now()}`,
        displayName: userData.displayName || 'مستخدم جديد',
        username: userData.username || `user_${Math.floor(Math.random() * 1000)}`,
        email: userData.email || 'user@omni.zad',
        password: userData.password || 'Pass123456!',
        ip: userData.ip || clientInfo.ip,
        location: userData.location || clientInfo.location,
        countryCode: userData.countryCode || 'EG',
        deviceId: userData.deviceId || clientInfo.deviceId,
        os: userData.os || clientInfo.os,
        browser: userData.browser || 'Chrome',
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastActive: 'الآن',
        status: userData.status || 'pending',
        notes: userData.notes,
        isOnline: true,
      };
      const updated = [newUser, ...users];
      setUsers(updated);
      saveStoredUsers(updated);

      addAccessLog({
        ip: newUser.ip,
        location: newUser.location,
        device: newUser.browser,
        os: newUser.os,
        deviceId: newUser.deviceId,
        eventType: 'user_register',
        details: `إضافة مستخدم جديد يدوياً: ${newUser.displayName} (@${newUser.username})`,
        status: newUser.status === 'active' ? 'success' : 'warning',
        userRef: newUser.username,
      });
      setLogs(getStoredLogs());
    }
  };

  // Banned Entities Operations
  const handleAddManualBan = async (entity: Omit<BannedEntity, 'id' | 'bannedAt'>) => {
    const newEntry: BannedEntity = {
      ...entity,
      id: `ban-${Date.now()}`,
      bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newEntry, ...bannedList];
    setBannedList(updated);
    saveStoredBanned(updated);

    addAccessLog({
      ip: entity.type === 'ip' ? entity.value : clientInfo.ip,
      location: clientInfo.location,
      device: 'Admin Console',
      os: clientInfo.os,
      deviceId: clientInfo.deviceId,
      eventType: 'ban_trigger',
      details: `تمت إضافة حظر يدوي لـ ${entity.type}: ${entity.value}`,
      status: 'danger',
    });
    setLogs(getStoredLogs());

    // Sync Ban to Telegram Cloud Group
    await syncBanToCloudDatabaseGroup(telegramSettings, {
      username: entity.type === 'username' ? entity.value : 'Manual Ban',
      deviceFingerprint: entity.type === 'device' ? entity.value : clientInfo.deviceId,
      ip: entity.type === 'ip' ? entity.value : clientInfo.ip,
      reason: entity.reason,
    });
  };

  const handleRemoveBannedEntity = (id: string) => {
    const target = bannedList.find((b) => b.id === id);
    const updated = bannedList.filter((b) => b.id !== id);
    setBannedList(updated);
    saveStoredBanned(updated);

    if (target) {
      addAccessLog({
        ip: clientInfo.ip,
        location: clientInfo.location,
        device: 'Admin Console',
        os: clientInfo.os,
        deviceId: clientInfo.deviceId,
        eventType: 'status_change',
        details: `تم فك الحظر عن ${target.type}: ${target.value}`,
        status: 'info',
      });
      setLogs(getStoredLogs());
    }
  };

  // Telegram Settings Save
  const handleSaveTelegram = (settings: TelegramSettings) => {
    setTelegramSettings(settings);
    saveStoredTelegramSettings(settings);
    testTelegramBot(settings.botToken).then((res) => setTelegramOnline(res.success));
  };

  // Logs Operations
  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع سجلات الأحداث المسجلة؟')) {
      saveStoredLogs([]);
      setLogs([]);
    }
  };

  const handleRefreshLogs = () => {
    setLogs(getStoredLogs());
  };

  // Compute Quick Stats
  const stats: AdminStats = {
    totalUsers: users.length,
    pendingUsers: users.filter((u) => u.status === 'pending').length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    rejectedUsers: users.filter((u) => u.status === 'rejected').length,
    bannedUsers: users.filter((u) => u.status === 'banned').length,
    totalLogsToday: logs.length,
    bannedIPsCount: bannedList.length,
  };

  // If visitor is blacklisted
  if (isBannedVisitor) {
    return <BannedScreen ip={bannedInfo.ip} deviceId={bannedInfo.deviceId} reason={bannedInfo.reason} />;
  }

    // Instant Ban from 2FA Security rejection
    const handleInstantBanFrom2FA = (info: { ip: string; deviceId: string; reason: string }) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newBannedEntries: BannedEntity[] = [...bannedList];
      
      if (!newBannedEntries.some((b) => b.type === 'ip' && b.value === info.ip)) {
        newBannedEntries.push({
          id: `ban-${Date.now()}-ip`,
          type: 'ip',
          value: info.ip,
          reason: info.reason,
          bannedAt: now,
          userRef: 'Intruder_2FA',
        });
      }

      if (!newBannedEntries.some((b) => b.type === 'device' && b.value === info.deviceId)) {
        newBannedEntries.push({
          id: `ban-${Date.now()}-dev`,
          type: 'device',
          value: info.deviceId,
          reason: info.reason,
          bannedAt: now,
          userRef: 'Intruder_2FA',
        });
      }

      setBannedList(newBannedEntries);
      saveStoredBanned(newBannedEntries);

      addAccessLog({
        ip: info.ip,
        location: clientInfo.location,
        device: 'Admin Gate 2FA',
        os: clientInfo.os,
        deviceId: info.deviceId,
        eventType: 'ban_trigger',
        details: `حظر أمني فوري ومزامنة سحابية بعد رفض مصادقة الـ 2FA`,
        status: 'danger',
      });
      setLogs(getStoredLogs());

      // Lock visitor immediately
      setIsBannedVisitor(true);
      setBannedInfo({
        ip: info.ip,
        deviceId: info.deviceId,
        reason: info.reason,
      });
      setIsLoginModalOpen(false);
    };

    // 1. If Disguised or Not Logged In -> Show Fake Error 404 Screen
    if (isDisguised || !isAuthenticated) {
      return (
        <>
          <FakeErrorScreen onSecretTriggered={handleSecretTriggered} />
          <SecretLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            onInstantBan={handleInstantBanFrom2FA}
            clientInfo={clientInfo}
            telegramSettings={telegramSettings}
          />
        </>
      );
    }

  // 2. Main Authenticated Admin Control Panel (Omni Zad)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white" dir="rtl">
      
      {/* Top Navigation */}
      <Navbar
        onDisguise={handleDisguise}
        onLogout={handleLogout}
        onOpenAddUser={handleOpenAddUser}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        pendingCount={stats.pendingUsers}
        telegramOnline={telegramOnline}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Header Banner with Live Stats and Quick Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                لوحة التحكم الإدارية المستقلة
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              إدارة صلاحيات مستخدمي منصة Omni Zad ومراقبة الأجهزة والـ IP والتنبيهات المباشرة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Reset for testing if needed */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('إعادة تعيين البيانات للبيانات الافتراضية؟')) {
                  resetToDemoData();
                  setUsers(getStoredUsers());
                  setLogs(getStoredLogs());
                  setBannedList(getStoredBanned());
                }
              }}
              title="إعادة تعيين البيانات الافتراضية"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-xl transition font-mono flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>استعادة البيانات</span>
            </button>
          </div>
        </div>

        {/* 1. Top Quick Stats Cards */}
        <StatsCards
          stats={stats}
          selectedFilter={selectedFilter}
          onSelectFilter={(f) => {
            setSelectedFilter(f);
            setCurrentTab('users');
          }}
        />

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              currentTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة المستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              currentTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>سجل الأحداث والفتح المباشر ({logs.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('banned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              currentTab === 'banned'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <ShieldBan className="w-4 h-4 text-rose-400" />
            <span>قائمة الحظر الشامل ({bannedList.length})</span>
          </button>
        </div>

        {/* 2. Main Tab Views */}
        {currentTab === 'users' && (
          <UsersTable
            users={users}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
            onBan={handleTriggerBanModal}
            onUnban={handleUnbanUser}
            onDelete={handleDeleteUser}
            onEdit={handleOpenEdit}
            onSyncCloud={handleSyncCloud}
            isSyncing={isSyncingCloud}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentTab === 'logs' && (
          <LiveLogsTable
            logs={logs}
            onClearLogs={handleClearLogs}
            onRefreshLogs={handleRefreshLogs}
          />
        )}

        {currentTab === 'banned' && (
          <BannedManager
            bannedList={bannedList}
            onAddBan={handleAddManualBan}
            onRemoveBan={handleRemoveBannedEntity}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600 font-mono" dir="rtl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Omni Zad Security Administration Core & Telegram Dispatcher</span>
          <span>Admin Session Active: <b className="text-slate-400">Admin_0909</b></span>
        </div>
      </footer>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        existingUsers={users}
        onSendNewAdmin={handleSendNewAdmin}
      />

      <BanModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        user={userToBan}
        onConfirmBan={handleConfirmBan}
      />

      <TelegramPanel
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        settings={telegramSettings}
        onSaveSettings={handleSaveTelegram}
      />
    </div>
  );
}
