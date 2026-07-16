import { getProgressLevelShort, snapProgressToLevel } from '../utils/progress-levels';

interface ProgressBarProps {
  className?: string;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** percent = hiện %, level = cấp độ (mặc định) */
  labelMode?: 'level' | 'percent';
  color?: string;
}

export default function ProgressBar({
  value,
  size = 'md',
  showLabel = true,
  labelMode = 'level',
  color,
  className = '',
}: ProgressBarProps) {
  const level = snapProgressToLevel(value);
  const clampedValue = level;

  const barColor =
    color ||
    (clampedValue >= 100
      ? 'bg-emerald-500'
      : clampedValue >= 50
        ? 'bg-blue-500'
        : 'bg-slate-300');

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';
  const label =
    labelMode === 'percent' ? `${clampedValue}%` : getProgressLevelShort(clampedValue);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
          title={getProgressLevelShort(clampedValue)}
        />
      </div>
      {showLabel && (
        <span
          className={`font-semibold whitespace-nowrap ${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-600`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
