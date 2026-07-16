import type { UrgencyLevel } from '../types';
import { URGENCY_LABELS } from '../utils/ui-labels';

const urgencyConfig: Record<UrgencyLevel, { className: string }> = {
  THUONG: { className: 'bg-gray-100 text-gray-600' },
  KHAN: { className: 'bg-orange-100 text-orange-700' },
  THUONG_KHAN: { className: 'bg-red-100 text-red-700' },
};

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
}

export default function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency] || urgencyConfig.THUONG;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${config.className}`}
    >
      {URGENCY_LABELS[urgency] || urgency}
    </span>
  );
}
