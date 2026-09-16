export type UserStatus = 'active' | 'pending' | 'banned';

export interface UserRecord {
  id: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  ip: string;
  location: string;
  countryCode: string;
  deviceId: string;
  os: string;
  browser: string;
  registeredAt: string;
  lastActive: string;
  status: UserStatus;
  notes?: string;
  banReason?: string;
  isOnline?: boolean;
}

export type LogEventType =
  | 'page_open'
  | 'login_attempt'
  | 'admin_action'
  | 'ban_trigger'
  | 'status_change'
  | 'user_register'
  | 'telegram_alert';

export interface AccessLog {
  id: string;
  timestamp: string;
  ip: string;
  location: string;
  device: string;
  os: string;
  deviceId?: string;
  eventType: LogEventType;
  details: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  userRef?: string;
}

export interface BannedEntity {
  id: string;
  type: 'ip' | 'device' | 'username';
  value: string;
  reason: string;
  bannedAt: string;
  userRef?: string;
}

export interface TelegramSettings {
  botToken: string;
  adminChatId: string;
  databaseGroupId: string;
  enabled: boolean;
  notifyOnApprove: boolean;
  notifyOnBan: boolean;
  notifyOnLogin: boolean;
  notifyOnNewUser: boolean;
}

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalLogsToday: number;
  bannedIPsCount: number;
}
