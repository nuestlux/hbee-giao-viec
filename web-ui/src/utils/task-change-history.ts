import type {
  AuditLog,
  ExtensionRequest,
  ProgressUpdate,
  TaskComment,
} from '../types';
import { getProgressLevelLabel } from './progress-levels';
import { EXTENSION_STATUS_LABELS, TASK_STATUS_LABELS } from './ui-labels';
import type { TaskStatus } from '../types';

/** One row in task change-history table */
export type TaskChangeHistoryRow = {
  id: string;
  createdAt: string;
  userName: string;
  /** Short category for badge */
  kind: string;
  kindTone: 'neutral' | 'blue' | 'amber' | 'emerald' | 'slate' | 'violet';
  /** What changed — plain text */
  detail: string;
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  STATUS_CHANGE: 'Trạng thái',
  PROGRESS: 'Tiến độ',
  EXTENSION: 'Gia hạn',
  EXTENSION_REQUEST: 'Xin gia hạn',
  EXTENSION_APPROVE: 'Duyệt gia hạn',
  EXTENSION_REJECT: 'Từ chối gia hạn',
  COMMENT: 'Bình luận',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function actionTone(
  action: string,
): TaskChangeHistoryRow['kindTone'] {
  if (action === 'PROGRESS') return 'blue';
  if (action === 'STATUS_CHANGE') return 'violet';
  if (action.startsWith('EXTENSION')) return 'amber';
  if (action === 'CREATE') return 'emerald';
  if (action === 'COMMENT') return 'slate';
  if (action === 'DELETE') return 'amber';
  return 'neutral';
}

/** Build unified, newest-first change history for one task. */
export function buildTaskChangeHistory(input: {
  taskId: string;
  auditLogs: AuditLog[];
  progressUpdates: ProgressUpdate[];
  extensions: ExtensionRequest[];
  comments: TaskComment[];
}): TaskChangeHistoryRow[] {
  const { taskId, auditLogs, progressUpdates, extensions, comments } = input;
  const rows: TaskChangeHistoryRow[] = [];

  for (const log of auditLogs) {
    if (log.entityType !== 'Task' || log.entityId !== taskId) continue;
    // Progress/status already covered with richer detail from domain events when present
    if (log.action === 'PROGRESS') continue;
    rows.push({
      id: log.id,
      createdAt: log.createdAt,
      userName: log.userName,
      kind: actionLabel(log.action),
      kindTone: actionTone(log.action),
      detail: formatAuditDetail(log.action, log.changes),
    });
  }

  for (const p of progressUpdates) {
    if (p.taskId !== taskId) continue;
    const parts = [
      `Tiến độ: ${getProgressLevelLabel(p.previousProgress)} → ${getProgressLevelLabel(p.progress)}`,
    ];
    if (p.content) parts.push(p.content);
    if (p.difficulties) parts.push(`Khó khăn: ${p.difficulties}`);
    if (p.suggestions) parts.push(`Đề xuất: ${p.suggestions}`);
    rows.push({
      id: p.id,
      createdAt: p.createdAt,
      userName: p.userName,
      kind: 'Tiến độ',
      kindTone: 'blue',
      detail: parts.join(' · '),
    });
  }

  for (const e of extensions) {
    if (e.taskId !== taskId) continue;
    // Request
    rows.push({
      id: `${e.id}-req`,
      createdAt: e.createdAt,
      userName: e.requesterName,
      kind: 'Xin gia hạn',
      kindTone: 'amber',
      detail: `Hạn ${fmtDate(e.currentDueDate)} → ${fmtDate(e.requestedDueDate)}${
        e.reason ? ` · ${e.reason}` : ''
      }`,
    });
    if (e.status !== 'PENDING' && e.decidedAt) {
      rows.push({
        id: `${e.id}-dec`,
        createdAt: e.decidedAt,
        userName: e.decidedByName || '—',
        kind: e.status === 'APPROVED' ? 'Duyệt gia hạn' : 'Từ chối gia hạn',
        kindTone: e.status === 'APPROVED' ? 'emerald' : 'amber',
        detail: `${EXTENSION_STATUS_LABELS[e.status]}${
          e.decisionNote ? ` · ${e.decisionNote}` : ''
        }`,
      });
    }
  }

  for (const c of comments) {
    if (c.taskId !== taskId) continue;
    rows.push({
      id: c.id,
      createdAt: c.createdAt,
      userName: c.userName,
      kind: 'Bình luận',
      kindTone: 'slate',
      detail: c.content,
    });
  }

  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return rows;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}

function formatAuditDetail(action: string, changes: string): string {
  if (action === 'STATUS_CHANGE' && changes.includes('→')) {
    const [from, to] = changes.split('→').map((s) => s.trim());
    const fl =
      TASK_STATUS_LABELS[from as TaskStatus] || from;
    const tl = TASK_STATUS_LABELS[to as TaskStatus] || to;
    return `${fl} → ${tl}`;
  }
  return changes || '—';
}

/** Human-readable diff summary for updateTask audit. */
export function summarizeTaskUpdate(
  before: Record<string, unknown>,
  patch: Record<string, unknown>,
): string {
  const labels: Record<string, string> = {
    title: 'Tên việc',
    description: 'Mô tả',
    urgency: 'Mức độ khẩn',
    dueDate: 'Hạn',
    startDate: 'Ngày bắt đầu',
    assignedDepartmentName: 'Phòng',
    assigneeName: 'Người làm',
    categoryName: 'Loại việc',
    fieldName: 'Lĩnh vực',
    progress: 'Tiến độ',
    status: 'Trạng thái',
    chairLeaderName: 'LĐ chủ trì',
    focalPointText: 'Đầu mối',
    executionResult: 'Kết quả',
    roadmap: 'Lộ trình',
    externalTaskId: 'Mã ngoài',
    approverName: 'Người duyệt',
    coordinatingDepartments: 'Phối hợp',
    sourceCitation: 'Nguồn',
  };

  const bits: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (patch[key] === undefined) continue;
    if (key === 'updatedAt' || key === 'isOverdue') continue;
    const oldV = before[key];
    const newV = patch[key];
    if (JSON.stringify(oldV) === JSON.stringify(newV)) continue;
    if (key === 'progress') {
      bits.push(
        `${label}: ${getProgressLevelLabel(Number(oldV) || 0)} → ${getProgressLevelLabel(Number(newV) || 0)}`,
      );
      continue;
    }
    if (key === 'coordinatingDepartments') {
      bits.push(`${label}: cập nhật danh sách`);
      continue;
    }
    const o = oldV == null || oldV === '' ? '—' : String(oldV);
    const n = newV == null || newV === '' ? '—' : String(newV);
    if (o === n) continue;
    bits.push(`${label}: ${o} → ${n}`);
  }
  return bits.length ? bits.join('; ') : 'Cập nhật nhiệm vụ';
}
