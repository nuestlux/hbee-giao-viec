import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  Check,
  FolderOpen,
  FolderSearch,
  Monitor,
  Power,
  RotateCcw,
  TestTube2,
} from 'lucide-react';
import {
  DEFAULT_APP_SETTINGS,
  ensureNotificationPermission,
  loadAppSettings,
  saveAppSettings,
  showSystemNotification,
  type AppSettings,
  type ReminderDay,
} from '../../settings/app-settings';
import {
  canPickDirectory,
  pickReportExportFolder,
} from '../../settings/report-export-folder';

const DAY_OPTIONS: { value: ReminderDay; label: string; full: string }[] = [
  { value: 1, label: 'T2', full: 'Thứ Hai' },
  { value: 2, label: 'T3', full: 'Thứ Ba' },
  { value: 3, label: 'T4', full: 'Thứ Tư' },
  { value: 4, label: 'T5', full: 'Thứ Năm' },
  { value: 5, label: 'T6', full: 'Thứ Sáu' },
  { value: 6, label: 'T7', full: 'Thứ Bảy' },
  { value: 0, label: 'CN', full: 'Chủ nhật' },
];

function permissionStatusLabel(): string {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'Không hỗ trợ';
  }
  if (Notification.permission === 'granted') return 'Đã bật';
  if (Notification.permission === 'denied') return 'Đã chặn';
  return 'Chưa cấp quyền';
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [toast, setToast] = useState<string | null>(null);
  const [timeDraft, setTimeDraft] = useState('09:00');
  const [permLabel, setPermLabel] = useState(permissionStatusLabel);
  const [pickingFolder, setPickingFolder] = useState(false);
  const folderPickerSupported = canPickDirectory();

  useEffect(() => {
    setPermLabel(permissionStatusLabel());
  }, [settings.systemNotifications]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const persist = (next: AppSettings, silent = false) => {
    setSettings(next);
    saveAppSettings(next);
    if (!silent) flash('Đã lưu cài đặt');
  };

  const toggle = async (key: keyof AppSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    if (key === 'systemNotifications' && value) {
      const perm = await ensureNotificationPermission();
      if (perm === 'denied') {
        flash('Thông báo đang bị chặn. Hãy bật trong Cài đặt trình duyệt / Windows.');
        return;
      }
      if (perm === 'unsupported') {
        flash('Trình duyệt không hỗ trợ thông báo');
        return;
      }
      setPermLabel(permissionStatusLabel());
    }
    if (key === 'startWithWindows' && value) {
      flash('Đã bật. Tính năng này áp dụng khi chạy bản cài đặt trên máy.');
    }
    persist(next);
  };

  const toggleDay = (day: ReminderDay) => {
    const has = settings.reminderDays.includes(day);
    const reminderDays = has
      ? settings.reminderDays.filter((d) => d !== day)
      : [...settings.reminderDays, day].sort((a, b) => a - b);
    if (reminderDays.length === 0) {
      flash('Chọn ít nhất một ngày trong tuần');
      return;
    }
    persist({ ...settings, reminderDays: reminderDays as ReminderDay[] });
  };

  const addTime = () => {
    if (!/^\d{2}:\d{2}$/.test(timeDraft)) {
      flash('Giờ không hợp lệ');
      return;
    }
    if (settings.reminderTimes.includes(timeDraft)) {
      flash('Khung giờ này đã có');
      return;
    }
    persist({
      ...settings,
      reminderTimes: [...settings.reminderTimes, timeDraft].sort(),
    });
  };

  const removeTime = (t: string) => {
    if (settings.reminderTimes.length <= 1) {
      flash('Cần giữ ít nhất một khung giờ');
      return;
    }
    persist({
      ...settings,
      reminderTimes: settings.reminderTimes.filter((x) => x !== t),
    });
  };

  const testNotif = async () => {
    if (!settings.systemNotifications) {
      flash('Hãy bật thông báo trước');
      return;
    }
    const perm = await ensureNotificationPermission();
    setPermLabel(permissionStatusLabel());
    if (perm !== 'granted') {
      flash('Chưa được cấp quyền thông báo');
      return;
    }
    const ok = showSystemNotification(
      'H-Bee — Kiểm tra thông báo',
      'Thông báo đang hoạt động bình thường.',
      'hbee-test',
    );
    flash(ok ? 'Đã gửi thông báo thử' : 'Không gửi được thông báo');
  };

  const resetDefaults = () => {
    persist({ ...DEFAULT_APP_SETTINGS });
    flash('Đã khôi phục mặc định');
  };

  const browseFolder = async () => {
    setPickingFolder(true);
    const result = await pickReportExportFolder();
    setPickingFolder(false);
    if (!result.ok) {
      if (result.reason !== 'aborted') flash(result.message);
      return;
    }
    persist({
      ...settings,
      reportExportFolder: result.displayPath,
    });
    flash(`Đã chọn: ${result.folderName}`);
  };

  const saveFolderPath = () => {
    persist({
      ...settings,
      reportExportFolder:
        settings.reportExportFolder.trim() || DEFAULT_APP_SETTINGS.reportExportFolder,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-4">
      {toast && (
        <div className="fixed top-4 right-4 z-[210] flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-lg">
          <Check size={16} />
          {toast}
        </div>
      )}

      {/* Page header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cài đặt chung</h1>
        <p className="text-sm text-slate-500">
          Tùy chỉnh khởi động, thông báo, nhắc việc và nơi lưu file báo cáo
        </p>
      </header>

      {/* Group: Ứng dụng */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-0.5">
          Ứng dụng
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100">
          {/* Startup */}
          <SettingRow
            icon={<Power size={18} />}
            iconClass="bg-blue-50 text-blue-600"
            title="Khởi động cùng Windows"
            description="Tự mở ứng dụng khi đăng nhập máy tính"
            trailing={
              <Toggle
                checked={settings.startWithWindows}
                onChange={(v) => void toggle('startWithWindows', v)}
                label="Khởi động cùng Windows"
              />
            }
          />
          {settings.startWithWindows && (
            <div className="flex gap-2 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-800 sm:px-5">
              <Monitor size={14} className="mt-0.5 shrink-0" />
              <span>
                Áp dụng khi cài bản desktop. Trên trình duyệt web, tùy chọn này chỉ được ghi nhận.
              </span>
            </div>
          )}

          {/* Notifications */}
          <SettingRow
            icon={<Bell size={18} />}
            iconClass="bg-violet-50 text-violet-600"
            title="Thông báo hệ thống"
            description={
              <span>
                Hiển thị thông báo trên máy ·{' '}
                <span
                  className={
                    permLabel === 'Đã bật'
                      ? 'font-medium text-emerald-600'
                      : permLabel === 'Đã chặn'
                        ? 'font-medium text-red-600'
                        : 'font-medium text-slate-600'
                  }
                >
                  {permLabel}
                </span>
              </span>
            }
            trailing={
              <Toggle
                checked={settings.systemNotifications}
                onChange={(v) => void toggle('systemNotifications', v)}
                label="Thông báo hệ thống"
              />
            }
          />
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => void testNotif()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <TestTube2 size={15} />
              Gửi thông báo thử
            </button>
          </div>
        </div>
      </section>

      {/* Group: Nhắc việc */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-0.5">
          Nhắc việc
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <SettingRow
            icon={<CalendarClock size={18} />}
            iconClass="bg-amber-50 text-amber-600"
            title="Nhắc nhiệm vụ sắp đến hạn"
            description="Gửi thông báo theo lịch đã cấu hình"
            trailing={
              <Toggle
                checked={settings.reminderEnabled}
                onChange={(v) => persist({ ...settings, reminderEnabled: v })}
                label="Nhắc nhiệm vụ sắp đến hạn"
              />
            }
          />

          <div
            className={`space-y-5 border-t border-slate-100 px-4 py-5 sm:px-5 ${
              settings.reminderEnabled ? '' : 'pointer-events-none opacity-45'
            }`}
          >
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nhắc trước hạn
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.remindDaysBefore}
                    onChange={(e) =>
                      persist({
                        ...settings,
                        remindDaysBefore: Math.min(
                          30,
                          Math.max(1, Number(e.target.value) || 1),
                        ),
                      })
                    }
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-slate-500">ngày</span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Ngày trong tuần</p>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((d) => {
                  const on = settings.reminderDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      title={d.full}
                      onClick={() => toggleDay(d.value)}
                      className={`min-w-[2.5rem] rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                        on
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:bg-primary-50/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Giờ nhắc trong ngày</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {settings.reminderTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 py-1 pl-3 pr-1 text-sm font-medium text-primary-800"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTime(t)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-primary-600 hover:bg-primary-100"
                      aria-label={`Xóa ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={timeDraft}
                  onChange={(e) => setTimeDraft(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={addTime}
                  className="rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group: Báo cáo */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-0.5">
          Báo cáo
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <SettingRow
            icon={<FolderOpen size={18} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Thư mục lưu file xuất"
            description="Nơi lưu file Excel khi xuất báo cáo"
          />
          <div className="space-y-2 border-t border-slate-100 px-4 py-4 sm:px-5">
            <label className="block text-sm font-medium text-slate-700">Đường dẫn</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={settings.reportExportFolder}
                onChange={(e) =>
                  setSettings({ ...settings, reportExportFolder: e.target.value })
                }
                onBlur={saveFolderPath}
                placeholder="C:\Users\Public\Documents\HBee\BaoCao"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                type="button"
                onClick={() => void browseFolder()}
                disabled={pickingFolder || !folderPickerSupported}
                title={
                  folderPickerSupported
                    ? 'Chọn thư mục trên máy tính'
                    : 'Cần Chrome hoặc Edge để chọn thư mục'
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FolderSearch size={17} />
                {pickingFolder ? 'Đang mở…' : 'Duyệt…'}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {folderPickerSupported
                ? 'Bấm «Duyệt…» để chọn thư mục trên máy. File xuất sẽ lưu vào thư mục này (Chrome/Edge).'
                : 'Trình duyệt hiện tại không hỗ trợ chọn thư mục — hãy nhập đường dẫn hoặc dùng Chrome/Edge.'}
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Khôi phục mặc định
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  iconClass,
  title,
  description,
  trailing,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:items-center sm:gap-4 sm:px-5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold text-slate-900 leading-snug">{title}</p>
        {description != null && (
          <p className="mt-0.5 text-sm leading-snug text-slate-500">{description}</p>
        )}
      </div>
      {trailing != null && <div className="shrink-0 pt-0.5 sm:pt-0">{trailing}</div>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
