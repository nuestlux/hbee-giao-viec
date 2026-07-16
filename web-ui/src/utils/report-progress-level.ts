import type { ProgressLevelCode, TaskStatus } from '../types';

export const PROGRESS_LEVEL_LABELS: Record<ProgressLevelCode, string> = {
  ON_TRACK: 'Đúng tiến độ',
  NEAR_DEADLINE: 'Sắp đến hạn',
  OVERDUE: 'Quá hạn',
};

/** Status included in “NV đang thực hiện” unit report */
export const IN_PROGRESS_REPORT_STATUSES: TaskStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'WAITING_APPROVAL',
  'NEEDS_CHANGES',
  'PAUSED',
];

const DEFAULT_NEAR_DAYS = 3;

function toDateOnly(isoOrDate: string): Date | null {
  if (!isoOrDate) return null;
  // Prefer date part for ISO timestamps
  const day = isoOrDate.includes('T') ? isoOrDate.slice(0, 10) : isoOrDate.slice(0, 10);
  const d = new Date(`${day}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

/**
 * Mức độ hoàn thành @ ngày chốt — không cho user sửa tay.
 * - Quá hạn: asOf > dueDate và chưa hoàn thành (hoặc hoàn thành sau hạn)
 * - Sắp đến hạn: 0 ≤ due - asOf ≤ nearDays
 * - Đúng tiến độ: còn lại
 */
export function computeProgressLevel(
  dueDate: string,
  completedDate: string | null | undefined,
  status: TaskStatus,
  asOf: string | Date,
  nearDays = DEFAULT_NEAR_DAYS,
): ProgressLevelCode {
  const asOfD = typeof asOf === 'string' ? toDateOnly(asOf) : asOf;
  const dueD = toDateOnly(dueDate);
  if (!asOfD || !dueD) return 'ON_TRACK';

  const done =
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    Boolean(completedDate);

  if (done) {
    const completedD = completedDate ? toDateOnly(completedDate) : null;
    if (completedD && completedD.getTime() > dueD.getTime()) return 'OVERDUE';
    return 'ON_TRACK';
  }

  if (asOfD.getTime() > dueD.getTime()) return 'OVERDUE';

  const remaining = daysBetween(dueD, asOfD);
  if (remaining >= 0 && remaining <= nearDays) return 'NEAR_DEADLINE';

  return 'ON_TRACK';
}

export function getProgressLevelLabel(
  code: ProgressLevelCode,
): string {
  return PROGRESS_LEVEL_LABELS[code];
}

export function formatReportDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return '';
  const d = toDateOnly(isoOrDate);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
