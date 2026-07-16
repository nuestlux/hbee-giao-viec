/** App preferences (mock / browser localStorage). */

export const APP_SETTINGS_KEY = 'hbee-app-settings';

export type ReminderDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun–Sat

export interface AppSettings {
  /** Prefer launch at Windows logon (demo flag only in browser). */
  startWithWindows: boolean;
  /** Use browser Notification API (Windows toast when permitted). */
  systemNotifications: boolean;
  /** Work reminder schedule */
  reminderEnabled: boolean;
  /** HH:mm local times to fire reminders */
  reminderTimes: string[];
  /** Days of week (0=CN … 6=T7) */
  reminderDays: ReminderDay[];
  /** Remind N days before due date */
  remindDaysBefore: number;
  /**
   * Đường dẫn thư mục lưu file báo cáo khi xuất.
   * Web: trình duyệt vẫn tải về Downloads; path lưu để hiển thị / bản desktop.
   */
  reportExportFolder: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  startWithWindows: false,
  systemNotifications: true,
  reminderEnabled: true,
  reminderTimes: ['08:00', '14:00'],
  reminderDays: [1, 2, 3, 4, 5], // Mon–Fri
  remindDaysBefore: 3,
  reportExportFolder: 'C:\\Users\\Public\\Documents\\HBee\\BaoCao',
};

function safeParse(raw: string | null): Partial<AppSettings> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    return null;
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const parsed = safeParse(localStorage.getItem(APP_SETTINGS_KEY));
    if (!parsed) return { ...DEFAULT_APP_SETTINGS };
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      reminderTimes:
        Array.isArray(parsed.reminderTimes) && parsed.reminderTimes.length
          ? parsed.reminderTimes
          : DEFAULT_APP_SETTINGS.reminderTimes,
      reminderDays:
        Array.isArray(parsed.reminderDays) && parsed.reminderDays.length
          ? (parsed.reminderDays as ReminderDay[])
          : DEFAULT_APP_SETTINGS.reminderDays,
      reportExportFolder:
        typeof parsed.reportExportFolder === 'string' && parsed.reportExportFolder.trim()
          ? parsed.reportExportFolder.trim()
          : DEFAULT_APP_SETTINGS.reportExportFolder,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/** Request OS/browser notification permission when enabling system toasts. */
export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showSystemNotification(title: string, body: string, tag?: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {
      body,
      tag: tag || `hbee-${Date.now()}`,
      icon: '/favicon.svg',
    });
    return true;
  } catch {
    return false;
  }
}
