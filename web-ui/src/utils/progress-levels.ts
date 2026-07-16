/**
 * Tiến độ theo cấp độ — chỉ các mốc chính.
 * Lưu store vẫn là number 0–100 (map từ cấp).
 */

export type ProgressLevelValue = 0 | 50 | 100;

export const PROGRESS_LEVELS: ReadonlyArray<{
  value: ProgressLevelValue;
  label: string;
  short: string;
}> = [
  { value: 0, label: 'Chưa thực hiện', short: 'Chưa TH' },
  { value: 50, label: 'Đang thực hiện', short: 'Đang TH' },
  { value: 100, label: 'Hoàn thành', short: 'Hoàn thành' },
];

const LEVEL_VALUES = PROGRESS_LEVELS.map((l) => l.value);

/** Snap arbitrary % → nearest of the 3 main levels */
export function snapProgressToLevel(progress: number): ProgressLevelValue {
  const p = Math.min(100, Math.max(0, Number(progress) || 0));
  if (p <= 0) return 0;
  if (p >= 100) return 100;
  // 1–99 → đang thực hiện
  return 50;
}

export function getProgressLevelLabel(progress: number): string {
  const level = snapProgressToLevel(progress);
  return PROGRESS_LEVELS.find((l) => l.value === level)?.label || `${level}%`;
}

export function getProgressLevelShort(progress: number): string {
  const level = snapProgressToLevel(progress);
  return PROGRESS_LEVELS.find((l) => l.value === level)?.short || `${level}%`;
}

/** Used by ProgressBar colors if needed */
export function progressLevelValues(): ProgressLevelValue[] {
  return [...LEVEL_VALUES] as ProgressLevelValue[];
}
