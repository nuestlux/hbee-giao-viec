/**
 * Bộ lọc thời gian dashboard — pattern phổ biến (GA / Jira / Monday / Notion):
 * preset nhanh + tùy chọn khoảng ngày.
 */

export type TimePreset =
  | 'today'
  | '7d'
  | '30d'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all'
  | 'custom';

export type TimeRange = {
  preset: TimePreset;
  /** Inclusive start (local day 00:00:00) */
  start: Date | null;
  /** Inclusive end (local day 23:59:59.999) */
  end: Date | null;
};

export const TIME_PRESET_OPTIONS: { id: TimePreset; label: string; short?: string }[] = [
  { id: 'today', label: 'Hôm nay', short: 'Hôm nay' },
  { id: '7d', label: '7 ngày qua', short: '7 ngày' },
  { id: '30d', label: '30 ngày qua', short: '30 ngày' },
  { id: 'month', label: 'Tháng này', short: 'Tháng này' },
  { id: 'quarter', label: 'Quý này', short: 'Quý này' },
  { id: 'year', label: 'Năm nay', short: 'Năm nay' },
  { id: 'all', label: 'Tất cả', short: 'Tất cả' },
  { id: 'custom', label: 'Tùy chọn', short: 'Tùy chọn' },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function resolveTimeRange(
  preset: TimePreset,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): TimeRange {
  if (preset === 'all') {
    return { preset, start: null, end: null };
  }

  if (preset === 'custom') {
    if (!customFrom || !customTo) {
      return { preset, start: null, end: null };
    }
    const a = startOfDay(new Date(customFrom));
    const b = endOfDay(new Date(customTo));
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return { preset, start: null, end: null };
    }
    return a <= b
      ? { preset, start: a, end: b }
      : { preset, start: b, end: endOfDay(new Date(customFrom)) };
  }

  const end = endOfDay(now);

  if (preset === 'today') {
    return { preset, start: startOfDay(now), end };
  }
  if (preset === '7d') {
    const s = startOfDay(now);
    s.setDate(s.getDate() - 6);
    return { preset, start: s, end };
  }
  if (preset === '30d') {
    const s = startOfDay(now);
    s.setDate(s.getDate() - 29);
    return { preset, start: s, end };
  }
  if (preset === 'month') {
    return {
      preset,
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end,
    };
  }
  if (preset === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    return {
      preset,
      start: new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0),
      end,
    };
  }
  // year
  return {
    preset,
    start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
    end,
  };
}

export function formatTimeRangeLabel(range: TimeRange): string {
  if (range.preset === 'all' || !range.start || !range.end) {
    return 'Toàn bộ thời gian';
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (range.preset === 'today') return `Ngày ${fmt(range.start)}`;
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

/** true if iso/date string falls within range (null range = all). */
export function isInTimeRange(
  isoOrDate: string | null | undefined,
  range: TimeRange,
): boolean {
  if (!range.start || !range.end) return true;
  if (!isoOrDate) return false;
  const t = new Date(isoOrDate).getTime();
  if (Number.isNaN(t)) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

/**
 * Task thuộc kỳ nếu:
 * - tạo trong kỳ, hoặc
 * - hoàn thành trong kỳ, hoặc
 * - còn mở và hạn xử lý giao với kỳ (để KPI quá hạn/sắp hạn vẫn có nghĩa).
 */
export function taskInTimeRange(
  task: {
    createdAt?: string;
    completedDate?: string | null;
    dueDate?: string;
    status?: string;
  },
  range: TimeRange,
): boolean {
  if (!range.start || !range.end) return true;
  if (isInTimeRange(task.createdAt, range)) return true;
  if (task.completedDate && isInTimeRange(task.completedDate, range)) return true;
  if (
    task.dueDate &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    isInTimeRange(task.dueDate, range)
  ) {
    return true;
  }
  return false;
}

export function defaultCustomFromTo(now = new Date()): { from: string; to: string } {
  const to = toIsoDate(now);
  const fromD = startOfDay(now);
  fromD.setDate(fromD.getDate() - 29);
  return { from: toIsoDate(fromD), to };
}
