import { AccessLog, BannedEntity, TelegramSettings, UserRecord } from '../types';
import { DEFAULT_TELEGRAM_SETTINGS } from './telegram';

const USERS_STORAGE_KEY = 'omni_zad_admin_users_v3';
const LOGS_STORAGE_KEY = 'omni_zad_admin_logs_v3';
const BANNED_STORAGE_KEY = 'omni_zad_admin_banned_v3';
const TELEGRAM_STORAGE_KEY = 'omni_zad_admin_telegram_v3';
const AUTH_SESSION_KEY = 'omni_zad_admin_session_auth';

export const INITIAL_USERS: UserRecord[] = [];

export const INITIAL_LOGS: AccessLog[] = [];

export const INITIAL_BANNED: BannedEntity[] = [];

export function getStoredUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredUsers(users: UserRecord[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getStoredLogs(): AccessLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredLogs(logs: AccessLog[]): void {
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}

export function addAccessLog(log: Omit<AccessLog, 'id' | 'timestamp'>): AccessLog {
  const currentLogs = getStoredLogs();
  const newLog: AccessLog = {
    ...log,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  const updated = [newLog, ...currentLogs].slice(0, 200); // keep last 200 logs
  saveStoredLogs(updated);
  return newLog;
}

export function getStoredBanned(): BannedEntity[] {
  try {
    const raw = localStorage.getItem(BANNED_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredBanned(banned: BannedEntity[]): void {
  localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify(banned));
}

export function getStoredTelegramSettings(): TelegramSettings {
  try {
    const raw = localStorage.getItem(TELEGRAM_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(DEFAULT_TELEGRAM_SETTINGS));
      return DEFAULT_TELEGRAM_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TELEGRAM_SETTINGS;
  }
}

export function saveStoredTelegramSettings(settings: TelegramSettings): void {
  localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(settings));
}

export function getAdminAuthSession(): boolean {
  try {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'authenticated_0909';
  } catch {
    return false;
  }
}

export function setAdminAuthSession(auth: boolean): void {
  if (auth) {
    localStorage.setItem(AUTH_SESSION_KEY, 'authenticated_0909');
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function resetToDemoData(): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(DEFAULT_TELEGRAM_SETTINGS));
}
