import { useEffect, useRef } from 'react';
import { loadAppSettings, showSystemNotification } from '../settings/app-settings';
import { useStore } from '../store/useStore';

const FIRED_KEY = 'hbee-reminder-fired';

function firedKey(slot: string) {
  return `${FIRED_KEY}:${slot}`;
}

function alreadyFired(slot: string) {
  try {
    return sessionStorage.getItem(firedKey(slot)) === '1';
  } catch {
    return false;
  }
}

function markFired(slot: string) {
  try {
    sessionStorage.setItem(firedKey(slot), '1');
  } catch {
    // ignore
  }
}

/**
 * When app is open: check reminder schedule every minute and toast near-due tasks.
 */
export function useWorkReminders(enabled: boolean) {
  const tasks = useStore((s) => s.tasks);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const settings = loadAppSettings();
      if (!settings.reminderEnabled || !settings.systemNotifications) return;

      const now = new Date();
      const day = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      if (!settings.reminderDays.includes(day)) return;

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hm = `${hh}:${mm}`;

      if (!settings.reminderTimes.includes(hm)) return;

      const slot = `${now.toDateString()}-${hm}`;
      if (alreadyFired(slot)) return;

      const beforeMs = settings.remindDaysBefore * 86400000;
      const open = tasksRef.current.filter((t) => {
        if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
        const due = new Date(t.dueDate).getTime();
        if (Number.isNaN(due)) return false;
        const diff = due - Date.now();
        return diff >= 0 && diff <= beforeMs;
      });

      if (open.length === 0) {
        markFired(slot);
        return;
      }

      const ok = showSystemNotification(
        'Nhắc nhở công việc',
        `Bạn có ${open.length} nhiệm vụ sắp đến hạn trong ${settings.remindDaysBefore} ngày tới.`,
        `hbee-reminder-${slot}`,
      );
      if (ok) markFired(slot);
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [enabled]);
}
