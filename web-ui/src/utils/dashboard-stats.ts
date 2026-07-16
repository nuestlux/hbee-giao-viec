import type {
  IncomingDocument,
  Task,
  ExtensionRequest,
  Notification,
  TaskStatus,
  User,
  Department,
  UserRole,
  AuditLog,
} from '../types';
import { ROLE_LABELS } from './role-labels';

const CLOSED: TaskStatus[] = ['COMPLETED', 'CANCELLED', 'DRAFT'];
const MS_DAY = 24 * 60 * 60 * 1000;

export type DashboardFeatureStats = {
  docsTotal: number;
  docsUnassigned: number;
  tasksOpen: number;
  tasksInProgress: number;
  tasksWaitingApproval: number;
  tasksCompleted: number;
  tasksOverdue: number;
  tasksNearDeadline: number;
  pendingActions: number;
  pendingExtensions: number;
  unreadNotifications: number;
  usersTotal: number;
  usersActive: number;
  departmentsTotal: number;
  departmentsActive: number;
  pie: { name: string; value: number; color: string }[];
};

export type UserChartSlice = { name: string; value: number; color: string };
export type DeptWorkBar = {
  name: string;
  open: number;
  completed: number;
  overdue: number;
};
export type TaskTrendPoint = {
  month: string;
  created: number;
  completed: number;
  overdue: number;
};

const USER_ROLE_COLORS: Record<string, string> = {
  CHAIRMAN: '#1d4ed8',
  VICE_CHAIRMAN: '#2563eb',
  DEPT_HEAD: '#7c3aed',
  DEPT_DEPUTY: '#8b5cf6',
  SPECIALIST: '#6366f1',
  CLERK: '#0ea5e9',
  ADMIN: '#db2777',
  inactive: '#94a3b8',
};

function isOpenTask(t: Task) {
  return !CLOSED.includes(t.status);
}

function daysUntilDue(dueDate: string) {
  const end = new Date(dueDate);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / MS_DAY);
}

export function deriveDashboardStats(input: {
  documents: IncomingDocument[];
  tasks: Task[];
  extensions: ExtensionRequest[];
  notifications: Notification[];
  users?: User[];
  departments?: Department[];
}): DashboardFeatureStats {
  const { documents, tasks, extensions, notifications, users = [], departments = [] } = input;

  const docsTotal = documents.length;
  const docsUnassigned = documents.filter((d) => !d.taskIds?.length).length;

  const open = tasks.filter(isOpenTask);
  const tasksOpen = open.length;
  const tasksInProgress = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED' || t.status === 'ASSIGNED'
  ).length;
  const tasksWaitingApproval = tasks.filter((t) => t.status === 'WAITING_APPROVAL').length;
  const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;

  const tasksOverdue = open.filter((t) => t.isOverdue || daysUntilDue(t.dueDate) < 0).length;
  const tasksNearDeadline = open.filter((t) => {
    if (t.isOverdue || daysUntilDue(t.dueDate) < 0) return false;
    const d = daysUntilDue(t.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  const pendingExtensions = extensions.filter((e) => e.status === 'PENDING').length;
  const pendingActions = tasksWaitingApproval + pendingExtensions;
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const usersTotal = users.length;
  const usersActive = users.filter((u) => u.isActive).length;
  const departmentsTotal = departments.length;
  const departmentsActive = departments.filter((d) => d.isActive).length;

  const pie = [
    { name: 'Đang mở', value: Math.max(0, tasksOpen - tasksWaitingApproval), color: '#4f46e5' },
    { name: 'Chờ duyệt', value: tasksWaitingApproval, color: '#d97706' },
    { name: 'Hoàn thành', value: tasksCompleted, color: '#10b981' },
    { name: 'Quá hạn', value: tasksOverdue, color: '#e11d48' },
  ].filter((s) => s.value > 0);

  return {
    docsTotal,
    docsUnassigned,
    tasksOpen,
    tasksInProgress,
    tasksWaitingApproval,
    tasksCompleted,
    tasksOverdue,
    tasksNearDeadline,
    pendingActions,
    pendingExtensions,
    unreadNotifications,
    usersTotal,
    usersActive,
    departmentsTotal,
    departmentsActive,
    pie: pie.length ? pie : [{ name: 'Không có dữ liệu', value: 1, color: '#e5e7eb' }],
  };
}

/** Pie chính: Hoạt động vs Đã khóa — bám `isActive`. */
export function deriveUserActiveStatusChart(users: User[]): UserChartSlice[] {
  const active = users.filter((u) => u.isActive).length;
  const locked = users.length - active;
  const slices: UserChartSlice[] = [];
  if (active > 0) slices.push({ name: 'Đang hoạt động', value: active, color: '#10b981' });
  if (locked > 0) slices.push({ name: 'Đã khóa', value: locked, color: '#94a3b8' });
  return slices.length ? slices : [{ name: 'Không có dữ liệu', value: 1, color: '#e5e7eb' }];
}

/** Phân bổ user theo vai trò — chỉ user đang active (isActive=true). */
export function deriveUserRoleChart(users: User[]): UserChartSlice[] {
  const byRole = new Map<string, number>();
  users.forEach((u) => {
    if (!u.isActive) return;
    byRole.set(u.role, (byRole.get(u.role) || 0) + 1);
  });

  const slices: UserChartSlice[] = Array.from(byRole.entries()).map(([role, value]) => ({
    name: ROLE_LABELS[role as UserRole] || role,
    value,
    color: USER_ROLE_COLORS[role] || '#64748b',
  }));

  return slices.length ? slices : [{ name: 'Không có user active', value: 1, color: '#e5e7eb' }];
}

/**
 * Công việc theo phòng: open / completed / overdue.
 * @param scopeDeptId — nếu set, chỉ 1 phòng (trưởng phòng / chuyên viên).
 */
export function deriveDeptWorkChart(
  tasks: Task[],
  departments: Department[],
  scopeDeptId?: string | null,
  limit = 8,
): DeptWorkBar[] {
  const depts = scopeDeptId
    ? departments.filter((d) => d.id === scopeDeptId)
    : departments.filter((d) => d.isActive);

  const rows = depts.map((d) => {
    const list = tasks.filter((t) => t.assignedDepartmentId === d.id);
    const open = list.filter(isOpenTask).length;
    const completed = list.filter((t) => t.status === 'COMPLETED').length;
    const overdue = list.filter(
      (t) => isOpenTask(t) && (t.isOverdue || daysUntilDue(t.dueDate) < 0)
    ).length;
    const shortName = d.name
      .replace(/^Phòng\s+/i, '')
      .replace(/^Ban\s+/i, '')
      .replace(/^UBND\s+/i, '');
    return {
      name: shortName.length > 14 ? `${shortName.slice(0, 12)}…` : shortName,
      open,
      completed,
      overdue,
      total: list.length,
    };
  });

  return rows
    .filter((r) => r.total > 0 || scopeDeptId)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map(({ name, open, completed, overdue }) => ({ name, open, completed, overdue }));
}

/** Xu hướng NV 6 tháng gần nhất theo createdAt / completedDate. */
export function deriveTaskTrend(tasks: Task[], months = 6): TaskTrendPoint[] {
  const now = new Date();
  const buckets: TaskTrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
    buckets.push({ month: label, created: 0, completed: 0, overdue: 0, _key: key } as TaskTrendPoint & {
      _key: string;
    });
  }

  const keyed = buckets as (TaskTrendPoint & { _key: string })[];

  tasks.forEach((t) => {
    const created = t.createdAt ? new Date(t.createdAt) : null;
    if (created && !Number.isNaN(created.getTime())) {
      const ck = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      const b = keyed.find((x) => x._key === ck);
      if (b) b.created += 1;
    }

    if (t.status === 'COMPLETED' && t.completedDate) {
      const done = new Date(t.completedDate);
      if (!Number.isNaN(done.getTime())) {
        const dk = `${done.getFullYear()}-${String(done.getMonth() + 1).padStart(2, '0')}`;
        const b = keyed.find((x) => x._key === dk);
        if (b) b.completed += 1;
      }
    }

    // Overdue “hit” counted in due month if still open & overdue
    if (isOpenTask(t) && (t.isOverdue || daysUntilDue(t.dueDate) < 0) && t.dueDate) {
      const due = new Date(t.dueDate);
      if (!Number.isNaN(due.getTime())) {
        const ok = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`;
        const b = keyed.find((x) => x._key === ok);
        if (b) b.overdue += 1;
      }
    }
  });

  return keyed.map(({ month, created, completed, overdue }) => ({
    month,
    created,
    completed,
    overdue,
  }));
}

export function pickNearDeadlineTasks(tasks: Task[], limit = 5): Task[] {
  return tasks
    .filter(isOpenTask)
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit);
}

/** Phạm vi hoạt động gần đây — khớp phân quyền dashboard. */
export type ActivityScope = 'all' | 'department' | 'self';

export type RecentActivityOptions = {
  currentUserId: string | null;
  departmentId: string | null;
  scope: ActivityScope;
  /** Cho phép xem thao tác quản trị user (user.manage / lãnh đạo). */
  includeUserAdmin: boolean;
  /** Cho phép xem IP + thao tác hệ thống (audit.view / lãnh đạo). */
  includeSensitive: boolean;
};

const SYSTEM_ENTITIES = new Set([
  'Department',
  'Role',
  'DocumentType',
  'TaskCategory',
  'Field',
  'Report',
]);

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  STATUS_CHANGE: 'Đổi trạng thái',
  PROGRESS: 'Cập nhật tiến độ',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  VIEW: 'Xem',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Task: 'Nhiệm vụ',
  Document: 'Văn bản đến',
  IncomingDocument: 'Văn bản đến',
  ExtensionRequest: 'Gia hạn',
  User: 'Người dùng',
  Department: 'Phòng ban',
  Role: 'Vai trò',
  DocumentType: 'Loại văn bản',
  TaskCategory: 'Nhóm nhiệm vụ',
  Field: 'Lĩnh vực',
  Report: 'Báo cáo',
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function auditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] || entityType;
}

/**
 * 5 (mặc định) hoạt động gần nhất, lọc theo scope dashboard:
 * - all: lãnh đạo / audit.view / task.view_all
 * - department: trưởng-phó phòng — actor cùng phòng
 * - self: chuyên viên — chỉ hoạt động của mình
 * User-admin / system catalog ẩn theo quyền card tương ứng.
 */
export function pickRecentActivities(
  logs: AuditLog[],
  users: User[],
  opts: RecentActivityOptions,
  limit = 5,
): AuditLog[] {
  const userById = new Map(users.map((u) => [u.id, u]));

  const sorted = logs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = sorted.filter((log) => {
    const entity = log.entityType;
    const isUserAdminOp =
      entity === 'User' && !['LOGIN', 'LOGOUT'].includes(log.action);
    if (isUserAdminOp && !opts.includeUserAdmin && !opts.includeSensitive) {
      return false;
    }
    if (SYSTEM_ENTITIES.has(entity) && !opts.includeSensitive && opts.scope !== 'all') {
      return false;
    }

    if (opts.scope === 'all') return true;

    const actor = userById.get(log.userId);
    if (opts.scope === 'department') {
      if (!opts.departmentId) return log.userId === opts.currentUserId;
      return actor?.departmentId === opts.departmentId;
    }

    // self
    return log.userId === opts.currentUserId;
  });

  return filtered.slice(0, limit);
}
