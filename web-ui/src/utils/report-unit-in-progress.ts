import type {
  Department,
  ExtensionRequest,
  IncomingDocument,
  ProgressUpdate,
  Task,
} from '../types';
import {
  getDocumentSourceKindLabel,
  getTaskStatusReportLabel,
} from './ui-labels';
import {
  computeProgressLevel,
  formatReportDate,
  getProgressLevelLabel,
  IN_PROGRESS_REPORT_STATUSES,
} from './report-progress-level';

/** Ordered headers matching customer report (25 cols) */
export const UNIT_REPORT_HEADERS: string[] = [
  'STT',
  'Tên nhiệm vụ',
  'LĐVP chủ trì',
  'Đơn vị chủ trì thực hiện',
  'Đơn vị phối hợp',
  'Đầu mối thực hiện',
  'Ngày thực hiện',
  'Ngày hoàn thành',
  'Loại nhiệm vụ',
  'Nguồn gốc',
  'Trạng thái nhiệm vụ',
  'Kết quả thực hiện',
  'Mức độ hoàn thành',
  'Khó khăn',
  'Đề xuất',
  'ID nhiệm vụ',
  'Người giao nhiệm vụ',
  'Lộ trình thực hiện',
  'Ngày cập nhật',
  'Ngày hoàn thành thực tế',
  'Gia hạn - Số lần',
  'Gia hạn - Mốc cũ',
  'Người phê duyệt - Họ tên',
  'Người phê duyệt - Email',
  'Người phê duyệt - Điện thoại',
];

export type UnitReportInput = {
  tasks: Task[];
  departments: Department[];
  documents: IncomingDocument[];
  progressUpdates: ProgressUpdate[];
  extensions: ExtensionRequest[];
  /** YYYY-MM-DD or ISO */
  asOf: string;
  /** null | '' | 'all' = mọi phòng */
  departmentId?: string | null;
};

export type UnitReportRow = {
  stt: number;
  cells: string[];
  taskId: string;
};

function resolveSourceText(
  task: Task,
  documents: IncomingDocument[],
): string {
  const kind = getDocumentSourceKindLabel(task.sourceKind);
  const citation = (task.sourceCitation || '').trim();
  if (kind || citation) {
    return [kind, citation].filter(Boolean).join(' — ');
  }
  if (task.sourceDocumentId) {
    const doc = documents.find((d) => d.id === task.sourceDocumentId);
    if (doc) {
      const dKind = getDocumentSourceKindLabel(doc.sourceKind);
      const dCit = (doc.sourceCitation || doc.subject || '').trim();
      const num = doc.documentNumber || task.sourceDocumentNumber || '';
      return [dKind || doc.documentTypeName, num, dCit].filter(Boolean).join(' — ');
    }
  }
  if (task.sourceDocumentNumber) return task.sourceDocumentNumber;
  return '';
}

function latestProgress(
  taskId: string,
  updates: ProgressUpdate[],
  asOf: string,
): ProgressUpdate | null {
  const asOfTs = new Date(asOf.includes('T') ? asOf : `${asOf}T23:59:59`).getTime();
  const list = updates
    .filter((u) => u.taskId === taskId && new Date(u.createdAt).getTime() <= asOfTs)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list[0] || null;
}

function extensionStats(
  taskId: string,
  extensions: ExtensionRequest[],
): { count: number; previousDue: string } {
  const approved = extensions
    .filter((e) => e.taskId === taskId && e.status === 'APPROVED')
    .sort(
      (a, b) =>
        new Date(b.decidedAt || b.createdAt).getTime() -
        new Date(a.decidedAt || a.createdAt).getTime(),
    );
  const count = approved.length;
  const previousDue = count > 0 ? formatReportDate(approved[0].currentDueDate) : '';
  return { count, previousDue };
}

function coordinatingNames(
  ids: string[],
  departments: Department[],
): string {
  if (!ids?.length) return '';
  return ids
    .map((id) => departments.find((d) => d.id === id)?.name || id)
    .filter(Boolean)
    .join('; ');
}

/**
 * Build unit “đang thực hiện” report rows at asOf (no STT yet → filled here).
 */
export function buildUnitInProgressReport(input: UnitReportInput): UnitReportRow[] {
  const {
    tasks,
    departments,
    documents,
    progressUpdates,
    extensions,
    asOf,
    departmentId,
  } = input;

  const deptFilter =
    departmentId && departmentId !== 'all' ? departmentId : null;

  const filtered = tasks.filter((t) => {
    if (!IN_PROGRESS_REPORT_STATUSES.includes(t.status)) return false;
    if (deptFilter && t.assignedDepartmentId !== deptFilter) return false;
    return true;
  });

  // Stable order: dueDate then title
  filtered.sort((a, b) => {
    const da = a.dueDate || '';
    const db = b.dueDate || '';
    if (da !== db) return da.localeCompare(db);
    return (a.title || '').localeCompare(b.title || '', 'vi');
  });

  return filtered.map((task, idx) => {
    const prog = latestProgress(task.id, progressUpdates, asOf);
    const ext = extensionStats(task.id, extensions);
    const level = computeProgressLevel(
      task.dueDate,
      task.completedDate,
      task.status,
      asOf,
    );

    const cells: string[] = [
      String(idx + 1), // STT
      task.title || '',
      task.chairLeaderName || '',
      task.assignedDepartmentName || '',
      coordinatingNames(task.coordinatingDepartments || [], departments),
      task.focalPointText || '',
      formatReportDate(task.startDate),
      formatReportDate(task.dueDate),
      task.categoryName || '',
      resolveSourceText(task, documents),
      getTaskStatusReportLabel(task.status),
      task.executionResult || '',
      getProgressLevelLabel(level),
      prog?.difficulties || '',
      prog?.suggestions || '',
      task.externalTaskId || task.id,
      task.assignerName || '',
      task.roadmap || '',
      formatReportDate(task.updatedAt),
      formatReportDate(task.completedDate),
      String(ext.count),
      ext.previousDue,
      task.approverName || '',
      task.approverEmail || '',
      task.approverPhone || '',
    ];

    return { stt: idx + 1, cells, taskId: task.id };
  });
}
