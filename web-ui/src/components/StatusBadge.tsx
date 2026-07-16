import type { TaskStatus } from '../types';
import { TASK_STATUS_LABELS } from '../utils/ui-labels';

const statusConfig: Record<TaskStatus, { className: string }> = {
  DRAFT: { className: 'bg-gray-100 text-gray-700 border-gray-200' },
  ASSIGNED: { className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED: { className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  IN_PROGRESS: { className: 'bg-amber-50 text-amber-700 border-amber-200' },
  WAITING_APPROVAL: { className: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { className: 'bg-red-100 text-red-700 border-red-200' },
  NEEDS_CHANGES: { className: 'bg-orange-100 text-orange-700 border-orange-200' },
  PAUSED: { className: 'bg-slate-100 text-slate-700 border-slate-200' },
  CANCELLED: { className: 'bg-gray-100 text-gray-500 border-gray-200 line-through' },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  const label = TASK_STATUS_LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full whitespace-nowrap leading-snug
      ${size === 'sm' ? 'px-2 py-0.5 text-[0.75rem]' : 'px-2.5 py-1 text-[0.8125rem]'}
      ${config.className}`}
    >
      {label}
    </span>
  );
}
