import { create } from 'zustand';
import type {
  Task, TaskStatus, IncomingDocument, User, Department, Role, Permission,
  DocumentType, TaskCategory, Field, ProgressUpdate, TaskComment,
  ExtensionRequest, Notification, AuditLog, ReportKPI, UrgencyLevel, SecurityLevel,
} from '../types';
import {
  tasks as initTasks,
  incomingDocuments as initDocs,
  users as initUsers,
  departments as initDepts,
  roles as initRoles,
  permissions as initPermissions,
  documentTypes as initDocTypes,
  taskCategories as initCategories,
  fields as initFields,
  progressUpdates as initProgress,
  taskComments as initComments,
  extensionRequests as initExtensions,
  notifications as initNotifications,
  auditLogs as initAuditLogs,
  reportKPI as initKPI,
} from '../data/mockData';
import {
  clearRememberedEmail,
  clearSessionUserId,
  DEMO_PASSWORD,
  loadSessionUserId,
  saveRememberedEmail,
  saveSessionUserId,
  setUserPassword,
  validateNewPassword,
  verifyUserPassword,
  type ChangePasswordError,
} from '../auth/session';
import { canApproveTaskResult, hasPermission } from '../utils/permissions';

// ─── Helpers ───────────────────────────────────────────────
let counter = Date.now();
const uid = (prefix: string) => `${prefix}-${++counter}`;
const now = () => new Date().toISOString();

function resolveSessionUser(users: User[]): User | null {
  const id = loadSessionUserId();
  if (!id) return null;
  const user = users.find((u) => u.id === id && u.isActive);
  if (!user) {
    clearSessionUserId();
    return null;
  }
  return user;
}

export type LoginResult = { ok: true } | { ok: false; error: string };
export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; code: ChangePasswordError; error: string };

// ─── Store Types ───────────────────────────────────────────
interface AppState {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string, remember?: boolean) => LoginResult;
  logout: () => void;
  changePassword: (current: string, next: string, confirm: string) => ChangePasswordResult;
  /** Admin reset password for any user (no current-password check). */
  adminResetPassword: (
    userId: string,
    options?: { newPassword?: string }
  ) => { ok: true; temporaryPassword: string } | { ok: false; error: string };

  // Data
  tasks: Task[];
  incomingDocuments: IncomingDocument[];
  users: User[];
  departments: Department[];
  roles: Role[];
  permissions: Permission[];
  documentTypes: DocumentType[];
  taskCategories: TaskCategory[];
  fields: Field[];
  progressUpdates: ProgressUpdate[];
  taskComments: TaskComment[];
  extensionRequests: ExtensionRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  reportKPI: ReportKPI;

  // ── Task CRUD ──
  addTask: (data: Partial<Task>) => Task | null;
  updateTask: (id: string, data: Partial<Task>) => boolean;
  deleteTask: (id: string) => { ok: boolean; error?: string };
  changeTaskStatus: (id: string, status: TaskStatus) => boolean;

  // ── Document CRUD ──
  addDocument: (data: Partial<IncomingDocument>) => IncomingDocument | null;
  updateDocument: (id: string, data: Partial<IncomingDocument>) => boolean;
  deleteDocument: (id: string) => { ok: boolean; error?: string };

  // ── User CRUD ──
  addUser: (data: Partial<User>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;

  // ── Department CRUD ──
  addDepartment: (data: Partial<Department>) => Department;
  updateDepartment: (id: string, data: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // ── Role CRUD ──
  addRole: (data: Partial<Role>) => Role;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  // ── Catalog CRUD ──
  addDocumentType: (data: Partial<DocumentType>) => void;
  updateDocumentType: (id: string, data: Partial<DocumentType>) => void;
  deleteDocumentType: (id: string) => void;
  addTaskCategory: (data: Partial<TaskCategory>) => void;
  updateTaskCategory: (id: string, data: Partial<TaskCategory>) => void;
  deleteTaskCategory: (id: string) => void;
  addField: (data: Partial<Field>) => void;
  updateField: (id: string, data: Partial<Field>) => void;
  deleteField: (id: string) => void;

  // ── Progress / Comments / Extensions ──
  addProgressUpdate: (data: {
    taskId: string;
    progress: number;
    content: string;
    difficulties?: string;
    suggestions?: string;
  }) => void;
  addComment: (data: { taskId: string; content: string }) => void;
  addExtensionRequest: (data: { taskId: string; requestedDueDate: string; reason: string }) => void;
  approveExtension: (id: string, note: string) => void;
  rejectExtension: (id: string, note: string) => void;

  // ── Notifications ──
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;

  // ── Helpers ──
  getTaskById: (id: string) => Task | undefined;
  getUserById: (id: string) => User | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getDocumentById: (id: string) => IncomingDocument | undefined;
  getProgressByTaskId: (taskId: string) => ProgressUpdate[];
  getCommentsByTaskId: (taskId: string) => TaskComment[];
  getExtensionsByTaskId: (taskId: string) => ExtensionRequest[];
  getUnreadNotifications: () => Notification[];
  recalcKPI: () => void;
}

// ─── Audit helper ──────────────────────────────────────────
/** Bound after store creation so audit rows use the logged-in user. */
let getActor: () => User | null = () => null;

function createAuditEntry(
  action: string,
  entityType: string,
  entityId: string,
  changes: string,
  actor?: User | null,
): AuditLog {
  const who = actor ?? getActor();
  return {
    id: uid('audit'),
    action,
    entityType,
    entityId,
    userId: who?.id ?? 'system',
    userName: who?.fullName ?? 'Hệ thống',
    changes,
    createdAt: now(),
    ipAddress: '192.168.1.100',
  };
}

function createNotification(type: Notification['type'], title: string, message: string, linkTo: string): Notification {
  return {
    id: uid('notif'),
    type,
    title,
    message,
    linkTo,
    isRead: false,
    createdAt: now(),
  };
}

// ─── Store ─────────────────────────────────────────────────
export const useStore = create<AppState>((set, get) => {
  getActor = () => get().currentUser;

  return {
  // ── Auth ──
  currentUser: resolveSessionUser(initUsers),

  login: (email, password, remember = false) => {
    const normalized = email.trim().toLowerCase();
    const pwd = password.trim();
    if (!normalized || !pwd) {
      return { ok: false, error: 'Vui lòng nhập email và mật khẩu' };
    }
    const user = get().users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || !verifyUserPassword(user.id, pwd)) {
      return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
    }
    if (!user.isActive) {
      return { ok: false, error: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' };
    }
    const loggedIn: User = { ...user, lastLogin: now() };
    saveSessionUserId(user.id, remember);
    if (remember) {
      saveRememberedEmail(normalized);
    } else {
      clearRememberedEmail();
    }
    set((s) => ({
      currentUser: loggedIn,
      users: s.users.map((u) => (u.id === user.id ? loggedIn : u)),
      auditLogs: [
        createAuditEntry('LOGIN', 'User', user.id, `Đăng nhập: ${user.fullName}`, loggedIn),
        ...s.auditLogs,
      ],
    }));
    return { ok: true };
  },

  logout: () => {
    const user = get().currentUser;
    clearSessionUserId();
    // Keep remembered email for next visit if user had opted in.
    set((s) => ({
      currentUser: null,
      auditLogs: user
        ? [createAuditEntry('LOGOUT', 'User', user.id, `Đăng xuất: ${user.fullName}`, user), ...s.auditLogs]
        : s.auditLogs,
    }));
  },

  changePassword: (current, next, confirm) => {
    const user = get().currentUser;
    if (!user) {
      return { ok: false, code: 'NOT_AUTH', error: 'Bạn cần đăng nhập để đổi mật khẩu' };
    }
    const code = validateNewPassword(current, next, confirm, user.id);
    if (code === 'CURRENT_WRONG') {
      return { ok: false, code, error: 'Mật khẩu hiện tại không đúng' };
    }
    if (code === 'EMPTY') {
      return { ok: false, code, error: 'Vui lòng nhập mật khẩu mới' };
    }
    if (code === 'MISMATCH') {
      return { ok: false, code, error: 'Xác nhận mật khẩu không khớp' };
    }
    setUserPassword(user.id, next);
    set((s) => ({
      auditLogs: [
        createAuditEntry('PASSWORD_CHANGE', 'User', user.id, `Đổi mật khẩu: ${user.fullName}`, user),
        ...s.auditLogs,
      ],
    }));
    return { ok: true };
  },

  adminResetPassword: (userId, options) => {
    const { currentUser, roles, users } = get();
    if (
      !hasPermission(currentUser, roles, 'user.manage') &&
      currentUser?.role !== 'ADMIN' &&
      currentUser?.role !== 'CHAIRMAN' &&
      currentUser?.role !== 'VICE_CHAIRMAN'
    ) {
      return { ok: false, error: 'Bạn không có quyền reset mật khẩu' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, error: 'Không tìm thấy người dùng' };

    const temporaryPassword =
      options?.newPassword?.trim() ||
      // Generate short temp: keep readable for admin to share (mock)
      `HB${Math.random().toString(36).slice(2, 6).toUpperCase()}${DEMO_PASSWORD.slice(0, 2)}`;

    if (temporaryPassword.length < 4) {
      return { ok: false, error: 'Mật khẩu tạm quá ngắn' };
    }

    setUserPassword(userId, temporaryPassword);
    set((s) => ({
      auditLogs: [
        createAuditEntry(
          'PASSWORD_RESET',
          'User',
          userId,
          `Admin reset mật khẩu: ${target.fullName}`,
          currentUser || undefined
        ),
        ...s.auditLogs,
      ],
    }));
    return { ok: true, temporaryPassword };
  },

  // ── Initial data ──
  tasks: initTasks,
  incomingDocuments: initDocs,
  users: initUsers,
  departments: initDepts,
  roles: initRoles,
  permissions: initPermissions,
  documentTypes: initDocTypes,
  taskCategories: initCategories,
  fields: initFields,
  progressUpdates: initProgress,
  taskComments: initComments,
  extensionRequests: initExtensions,
  notifications: initNotifications,
  auditLogs: initAuditLogs,
  reportKPI: initKPI,

  // ════════════════════════════════════════════════════════
  // TASK CRUD
  // ════════════════════════════════════════════════════════
  addTask: (data) => {
    const { currentUser, roles } = get();
    if (
      !hasPermission(currentUser, roles, 'task.create') &&
      !hasPermission(currentUser, roles, 'task.assign')
    ) {
      return null;
    }
    const actor = currentUser;
    const id = uid('task');
    const dept = get().departments.find(d => d.id === data.assignedDepartmentId);
    const assignee = get().users.find(u => u.id === data.assigneeId);
    const due = data.dueDate || '';
    const isOverdue = due ? new Date(due).getTime() < Date.now() : false;
    const status: TaskStatus = data.status || 'ASSIGNED';
    const newTask: Task = {
      id,
      title: data.title || '',
      description: data.description || '',
      status,
      scope: data.scope || 'ORGANIZATION',
      assignedDepartmentId: data.assignedDepartmentId || '',
      assignedDepartmentName: dept?.name || data.assignedDepartmentName || '',
      assigneeId: data.assigneeId || '',
      assigneeName: assignee?.fullName || data.assigneeName || '',
      assignerId: actor?.id || '',
      assignerName: actor?.fullName || '',
      coordinatingDepartments: data.coordinatingDepartments || [],
      sourceDocumentId: data.sourceDocumentId || null,
      sourceDocumentNumber: data.sourceDocumentNumber || null,
      urgency: data.urgency || 'THUONG',
      priority: data.priority || 'MEDIUM',
      progress: 0,
      dueDate: due,
      startDate: data.startDate || now().split('T')[0],
      completedDate: null,
      categoryId: data.categoryId || '',
      categoryName: get().taskCategories.find(c => c.id === data.categoryId)?.name || data.categoryName || '',
      fieldId: data.fieldId || '',
      fieldName: get().fields.find(f => f.id === data.fieldId)?.name || data.fieldName || '',
      isOverdue,
      createdAt: now(),
      updatedAt: now(),
      chairLeaderUserId: data.chairLeaderUserId ?? null,
      chairLeaderName: data.chairLeaderName ?? '',
      focalPointText: data.focalPointText ?? '',
      sourceKind: data.sourceKind ?? null,
      sourceCitation: data.sourceCitation ?? null,
      executionResult: data.executionResult ?? null,
      roadmap: data.roadmap ?? null,
      externalTaskId: data.externalTaskId ?? null,
      approverUserId: data.approverUserId ?? null,
      approverName: data.approverName ?? null,
      approverEmail: data.approverEmail ?? null,
      approverPhone: data.approverPhone ?? null,
    };
    set(s => ({
      tasks: [newTask, ...s.tasks],
      auditLogs: [createAuditEntry('CREATE', 'Task', id, `Tạo nhiệm vụ: ${newTask.title}`), ...s.auditLogs],
      notifications: newTask.assigneeId
        ? [
            createNotification(
              'TASK_ASSIGNED',
              `Nhiệm vụ mới: ${newTask.title}`,
              `${newTask.assignerName} đã giao việc cho bạn`,
              `/tasks/${id}`,
            ),
            ...s.notifications,
          ]
        : s.notifications,
    }));
    get().recalcKPI();
    return newTask;
  },

  updateTask: (id, data) => {
    const { currentUser, roles } = get();
    if (
      !hasPermission(currentUser, roles, 'task.assign') &&
      !hasPermission(currentUser, roles, 'task.update') &&
      !hasPermission(currentUser, roles, 'task.create')
    ) {
      return false;
    }
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return false;

    const patch: Partial<Task> = { updatedAt: now() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.urgency !== undefined) patch.urgency = data.urgency;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.scope !== undefined) patch.scope = data.scope;
    if (data.dueDate !== undefined) {
      patch.dueDate = data.dueDate;
      patch.isOverdue = new Date(data.dueDate).getTime() < Date.now();
    }
    if (data.assignedDepartmentId !== undefined) {
      patch.assignedDepartmentId = data.assignedDepartmentId;
      patch.assignedDepartmentName =
        get().departments.find((d) => d.id === data.assignedDepartmentId)?.name || '';
    }
    if (data.assigneeId !== undefined) {
      patch.assigneeId = data.assigneeId;
      patch.assigneeName = get().users.find((u) => u.id === data.assigneeId)?.fullName || '';
    }
    if (data.categoryId !== undefined) {
      patch.categoryId = data.categoryId;
      patch.categoryName =
        get().taskCategories.find((c) => c.id === data.categoryId)?.name || '';
    }
    if (data.fieldId !== undefined) {
      patch.fieldId = data.fieldId;
      patch.fieldName = get().fields.find((f) => f.id === data.fieldId)?.name || '';
    }
    if (data.startDate !== undefined) patch.startDate = data.startDate;
    if (data.progress !== undefined) {
      const p = Math.min(100, Math.max(0, Number(data.progress) || 0));
      patch.progress = p;
      if (p >= 100) {
        patch.status = 'COMPLETED';
        patch.completedDate = patch.completedDate || now();
      }
    }
    if (data.coordinatingDepartments !== undefined) {
      patch.coordinatingDepartments = data.coordinatingDepartments;
    }
    if (data.sourceDocumentId !== undefined) patch.sourceDocumentId = data.sourceDocumentId;
    if (data.sourceDocumentNumber !== undefined) {
      patch.sourceDocumentNumber = data.sourceDocumentNumber;
    }
    if (data.chairLeaderUserId !== undefined) patch.chairLeaderUserId = data.chairLeaderUserId;
    if (data.chairLeaderName !== undefined) patch.chairLeaderName = data.chairLeaderName;
    if (data.focalPointText !== undefined) patch.focalPointText = data.focalPointText;
    if (data.sourceKind !== undefined) patch.sourceKind = data.sourceKind;
    if (data.sourceCitation !== undefined) patch.sourceCitation = data.sourceCitation;
    if (data.executionResult !== undefined) patch.executionResult = data.executionResult;
    if (data.roadmap !== undefined) patch.roadmap = data.roadmap;
    if (data.externalTaskId !== undefined) patch.externalTaskId = data.externalTaskId;
    if (data.approverUserId !== undefined) patch.approverUserId = data.approverUserId;
    if (data.approverName !== undefined) patch.approverName = data.approverName;
    if (data.approverEmail !== undefined) patch.approverEmail = data.approverEmail;
    if (data.approverPhone !== undefined) patch.approverPhone = data.approverPhone;

    // Lazy import avoid circular — inline short summary
    const changeBits: string[] = [];
    const fieldLabels: [keyof typeof patch, string][] = [
      ['title', 'Tên việc'],
      ['description', 'Mô tả'],
      ['urgency', 'Mức khẩn'],
      ['dueDate', 'Hạn'],
      ['startDate', 'Ngày BĐ'],
      ['assignedDepartmentName', 'Phòng'],
      ['assigneeName', 'Người làm'],
      ['categoryName', 'Loại'],
      ['fieldName', 'Lĩnh vực'],
      ['chairLeaderName', 'LĐ chủ trì'],
      ['focalPointText', 'Đầu mối'],
      ['executionResult', 'Kết quả'],
      ['roadmap', 'Lộ trình'],
      ['externalTaskId', 'Mã ngoài'],
      ['approverName', 'Người duyệt'],
      ['sourceCitation', 'Nguồn'],
    ];
    for (const [k, label] of fieldLabels) {
      if (patch[k] === undefined) continue;
      const ov = existing[k as keyof typeof existing];
      const nv = patch[k];
      if (String(ov ?? '') === String(nv ?? '')) continue;
      changeBits.push(`${label}: ${ov || '—'} → ${nv || '—'}`);
    }
    if (patch.coordinatingDepartments !== undefined) {
      changeBits.push('Đơn vị phối hợp: cập nhật');
    }
    if (patch.progress !== undefined && patch.progress !== existing.progress) {
      changeBits.push(`Tiến độ: ${existing.progress}% → ${patch.progress}%`);
    }
    const auditMsg = changeBits.length ? changeBits.join('; ') : 'Cập nhật nhiệm vụ';

    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t),
      auditLogs: [createAuditEntry('UPDATE', 'Task', id, auditMsg), ...s.auditLogs],
    }));
    get().recalcKPI();
    return true;
  },

  deleteTask: (id) => {
    const { currentUser, roles } = get();
    if (
      !hasPermission(currentUser, roles, 'task.cancel') &&
      !hasPermission(currentUser, roles, 'task.assign') &&
      currentUser?.role !== 'ADMIN' &&
      currentUser?.role !== 'CHAIRMAN'
    ) {
      return { ok: false, error: 'Bạn không có quyền xóa nhiệm vụ' };
    }
    const task = get().tasks.find(t => t.id === id);
    if (!task) return { ok: false, error: 'Không tìm thấy nhiệm vụ' };
    if (task.status === 'COMPLETED') {
      return { ok: false, error: 'Không xóa nhiệm vụ đã hoàn thành' };
    }
    set(s => ({
      tasks: s.tasks.filter(t => t.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'Task', id, `Xóa nhiệm vụ: ${task.title}`), ...s.auditLogs],
    }));
    get().recalcKPI();
    return { ok: true };
  },

  changeTaskStatus: (id, status) => {
    const { currentUser, roles } = get();
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return false;

    // Phê duyệt kết quả: chỉ role có task.approve + đúng phạm vi
    if (task.status === 'WAITING_APPROVAL' && status === 'COMPLETED') {
      if (!canApproveTaskResult(currentUser, roles, task)) return false;
    } else {
      const canUpdate =
        hasPermission(currentUser, roles, 'task.update') ||
        hasPermission(currentUser, roles, 'task.accept') ||
        hasPermission(currentUser, roles, 'task.approve') ||
        hasPermission(currentUser, roles, 'task.assign') ||
        task.assigneeId === currentUser?.id ||
        task.assignerId === currentUser?.id;
      if (!canUpdate) return false;
    }

    const updates: Partial<Task> = { status, updatedAt: now() };
    if (status === 'COMPLETED') {
      updates.completedDate = now().split('T')[0];
      updates.progress = 100;
      // Snapshot người duyệt nếu chưa có
      if (currentUser && !task.approverUserId) {
        updates.approverUserId = currentUser.id;
        updates.approverName = currentUser.fullName;
        updates.approverEmail = currentUser.email;
        updates.approverPhone = currentUser.phone;
      }
    }
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      auditLogs: [
        createAuditEntry('STATUS_CHANGE', 'Task', id, `${task.status} → ${status}`),
        ...s.auditLogs,
      ],
      notifications: [
        createNotification(
          status === 'COMPLETED'
            ? 'TASK_COMPLETED'
            : status === 'ASSIGNED'
              ? 'TASK_ASSIGNED'
              : 'PROGRESS_UPDATE',
          `Nhiệm vụ: ${task.title}`,
          `Trạng thái chuyển sang: ${status}`,
          `/tasks/${id}`,
        ),
        ...s.notifications,
      ],
    }));
    get().recalcKPI();
    return true;
  },

  // ════════════════════════════════════════════════════════
  // DOCUMENT CRUD
  // ════════════════════════════════════════════════════════
  addDocument: (data) => {
    const { currentUser, roles } = get();
    if (!hasPermission(currentUser, roles, 'document.create')) return null;

    const id = uid('doc');
    const docType = get().documentTypes.find(d => d.id === data.documentTypeId);
    const field = get().fields.find(f => f.id === data.fieldId);
    const newDoc: IncomingDocument = {
      id,
      documentNumber: data.documentNumber || '',
      issuedDate: data.issuedDate || '',
      receivedDate: data.receivedDate || now().split('T')[0],
      issuer: data.issuer || '',
      subject: data.subject || '',
      documentTypeId: data.documentTypeId || '',
      documentTypeName: docType?.name || '',
      fieldId: data.fieldId || '',
      fieldName: field?.name || '',
      urgency: data.urgency || 'THUONG',
      security: data.security || 'THUONG',
      attachments: data.attachments || [],
      taskIds: data.taskIds || [],
      createdBy: currentUser?.id || '',
      createdAt: now(),
      sourceKind: data.sourceKind ?? null,
      sourceCitation: data.sourceCitation ?? null,
    };
    set(s => ({
      incomingDocuments: [newDoc, ...s.incomingDocuments],
      auditLogs: [createAuditEntry('CREATE', 'Document', id, `Thêm văn bản: ${newDoc.documentNumber}`), ...s.auditLogs],
    }));
    return newDoc;
  },

  updateDocument: (id, data) => {
    const { currentUser, roles } = get();
    if (!hasPermission(currentUser, roles, 'document.edit')) return false;
    if (!get().incomingDocuments.some(d => d.id === id)) return false;

    // Allowlist only editable business fields (block taskIds/id/created* mass-assign).
    const patch: Partial<IncomingDocument> = {};
    if (data.documentNumber !== undefined) patch.documentNumber = data.documentNumber;
    if (data.issuer !== undefined) patch.issuer = data.issuer;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.issuedDate !== undefined) patch.issuedDate = data.issuedDate;
    if (data.receivedDate !== undefined) patch.receivedDate = data.receivedDate;
    if (data.urgency !== undefined) patch.urgency = data.urgency;
    if (data.security !== undefined) patch.security = data.security;

    if (data.documentTypeId !== undefined) {
      patch.documentTypeId = data.documentTypeId;
      patch.documentTypeName =
        get().documentTypes.find((d) => d.id === data.documentTypeId)?.name || '';
    }
    if (data.fieldId !== undefined) {
      patch.fieldId = data.fieldId;
      patch.fieldName = data.fieldId
        ? get().fields.find((f) => f.id === data.fieldId)?.name || ''
        : '';
    }
    if (data.sourceKind !== undefined) patch.sourceKind = data.sourceKind;
    if (data.sourceCitation !== undefined) patch.sourceCitation = data.sourceCitation;

    set(s => ({
      incomingDocuments: s.incomingDocuments.map(d => d.id === id ? { ...d, ...patch } : d),
      auditLogs: [createAuditEntry('UPDATE', 'Document', id, `Cập nhật văn bản`), ...s.auditLogs],
    }));
    return true;
  },

  deleteDocument: (id) => {
    const { currentUser, roles, incomingDocuments } = get();
    if (!hasPermission(currentUser, roles, 'document.delete')) {
      return { ok: false, error: 'Bạn không có quyền xóa văn bản' };
    }
    const doc = incomingDocuments.find(d => d.id === id);
    if (!doc) return { ok: false, error: 'Không tìm thấy văn bản' };
    if (doc.taskIds && doc.taskIds.length > 0) {
      return { ok: false, error: 'Văn bản đang gắn nhiệm vụ, không thể xóa' };
    }
    set(s => ({
      incomingDocuments: s.incomingDocuments.filter(d => d.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'Document', id, `Xóa văn bản: ${doc.documentNumber}`), ...s.auditLogs],
    }));
    return { ok: true };
  },

  // ════════════════════════════════════════════════════════
  // USER CRUD
  // ════════════════════════════════════════════════════════
  addUser: (data) => {
    const id = uid('user');
    const dept = get().departments.find(d => d.id === data.departmentId);
    const newUser: User = {
      id,
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || 'SPECIALIST',
      departmentId: data.departmentId || '',
      departmentName: dept?.name || '',
      position: data.position || '',
      avatar: data.avatar?.trim() || `https://i.pravatar.cc/150?u=${id}`,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      lastLogin: '',
    };
    set(s => ({
      users: [newUser, ...s.users],
      auditLogs: [createAuditEntry('CREATE', 'User', id, `Thêm người dùng: ${newUser.fullName}`), ...s.auditLogs],
    }));
    return newUser;
  },

  updateUser: (id, data) => {
    const prev = get().users.find((u) => u.id === id);
    const nextActive = data.isActive !== undefined ? !!data.isActive : prev?.isActive;
    // Deactivating self ends session (same as toggleUserActive)
    if (prev?.isActive && nextActive === false && get().currentUser?.id === id) {
      clearSessionUserId();
    }
    set((s) => {
      const users = s.users.map((u) => (u.id === id ? { ...u, ...data } : u));
      const deactivatedSelf = prev?.isActive && nextActive === false && s.currentUser?.id === id;
      const updated = users.find((u) => u.id === id);
      return {
        users,
        // Keep session profile in sync when editing self (avatar, name, phone, …)
        currentUser: deactivatedSelf
          ? null
          : s.currentUser?.id === id && updated
            ? updated
            : s.currentUser,
        auditLogs: [
          createAuditEntry(
            'UPDATE',
            'User',
            id,
            data.isActive === false
              ? `Cập nhật + khóa: ${prev?.fullName || id}`
              : data.isActive === true
                ? `Cập nhật + mở khóa: ${prev?.fullName || id}`
                : `Cập nhật người dùng: ${prev?.fullName || id}`
          ),
          ...s.auditLogs,
        ],
      };
    });
  },

  deleteUser: (id) => {
    set(s => ({
      users: s.users.filter(u => u.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'User', id, `Xóa người dùng`), ...s.auditLogs],
    }));
  },

  toggleUserActive: (id) => {
    const user = get().users.find(u => u.id === id);
    if (!user) return;
    const nextActive = !user.isActive;
    // Locking the signed-in account ends their session immediately.
    if (!nextActive && get().currentUser?.id === id) {
      clearSessionUserId();
    }
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, isActive: nextActive } : u),
      currentUser: !nextActive && s.currentUser?.id === id ? null : s.currentUser,
      auditLogs: [createAuditEntry('UPDATE', 'User', id, `${user.isActive ? 'Khóa' : 'Mở khóa'} tài khoản: ${user.fullName}`), ...s.auditLogs],
    }));
  },

  // ════════════════════════════════════════════════════════
  // DEPARTMENT CRUD
  // ════════════════════════════════════════════════════════
  addDepartment: (data) => {
    const id = uid('dept');
    const newDept: Department = {
      id,
      name: data.name || '',
      code: data.code || '',
      parentId: data.parentId || null,
      headId: data.headId || null,
      deputyHeadId: data.deputyHeadId || null,
      memberCount: data.memberCount ?? 0,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
    };
    set(s => ({
      departments: [...s.departments, newDept],
      auditLogs: [createAuditEntry('CREATE', 'Department', id, `Thêm phòng ban: ${newDept.name}`), ...s.auditLogs],
    }));
    return newDept;
  },

  updateDepartment: (id, data) => {
    set(s => ({
      departments: s.departments.map(d => d.id === id ? { ...d, ...data } : d),
      auditLogs: [createAuditEntry('UPDATE', 'Department', id, `Cập nhật phòng ban`), ...s.auditLogs],
    }));
  },

  deleteDepartment: (id) => {
    set(s => ({
      departments: s.departments.filter(d => d.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'Department', id, `Xóa phòng ban`), ...s.auditLogs],
    }));
  },

  // ════════════════════════════════════════════════════════
  // ROLE CRUD
  // ════════════════════════════════════════════════════════
  addRole: (data) => {
    const id = uid('role');
    const newRole: Role = {
      id,
      name: data.name || '',
      code: data.code || '',
      description: data.description || '',
      permissions: data.permissions || [],
      userCount: 0,
    };
    set(s => ({
      roles: [...s.roles, newRole],
      auditLogs: [createAuditEntry('CREATE', 'Role', id, `Thêm vai trò: ${newRole.name}`), ...s.auditLogs],
    }));
    return newRole;
  },

  updateRole: (id, data) => {
    set(s => ({
      roles: s.roles.map(r => r.id === id ? { ...r, ...data } : r),
      auditLogs: [createAuditEntry('UPDATE', 'Role', id, `Cập nhật vai trò`), ...s.auditLogs],
    }));
  },

  deleteRole: (id) => {
    set(s => ({
      roles: s.roles.filter(r => r.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'Role', id, `Xóa vai trò`), ...s.auditLogs],
    }));
  },

  // ════════════════════════════════════════════════════════
  // CATALOG CRUD (DocumentType, TaskCategory, Field)
  // ════════════════════════════════════════════════════════
  addDocumentType: (data) => {
    const id = uid('doctype');
    set(s => ({
      documentTypes: [...s.documentTypes, {
        id,
        name: data.name || '',
        code: data.code || '',
        isActive: data.isActive !== undefined ? !!data.isActive : true,
      }],
      auditLogs: [createAuditEntry('CREATE', 'DocumentType', id, `Thêm loại văn bản: ${data.name}`), ...s.auditLogs],
    }));
  },
  updateDocumentType: (id, data) => {
    set(s => ({
      documentTypes: s.documentTypes.map(d => d.id === id ? { ...d, ...data } : d),
      auditLogs: [createAuditEntry('UPDATE', 'DocumentType', id, `Cập nhật loại văn bản`), ...s.auditLogs],
    }));
  },
  deleteDocumentType: (id) => {
    set(s => ({
      documentTypes: s.documentTypes.filter(d => d.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'DocumentType', id, `Xóa loại văn bản`), ...s.auditLogs],
    }));
  },

  addTaskCategory: (data) => {
    const id = uid('cat');
    set(s => ({
      taskCategories: [...s.taskCategories, {
        id,
        name: data.name || '',
        code: data.code || '',
        isActive: data.isActive !== undefined ? !!data.isActive : true,
      }],
      auditLogs: [createAuditEntry('CREATE', 'TaskCategory', id, `Thêm nhóm nhiệm vụ: ${data.name}`), ...s.auditLogs],
    }));
  },
  updateTaskCategory: (id, data) => {
    set(s => ({
      taskCategories: s.taskCategories.map(c => c.id === id ? { ...c, ...data } : c),
      auditLogs: [createAuditEntry('UPDATE', 'TaskCategory', id, `Cập nhật nhóm nhiệm vụ`), ...s.auditLogs],
    }));
  },
  deleteTaskCategory: (id) => {
    set(s => ({
      taskCategories: s.taskCategories.filter(c => c.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'TaskCategory', id, `Xóa nhóm nhiệm vụ`), ...s.auditLogs],
    }));
  },

  addField: (data) => {
    const id = uid('field');
    set(s => ({
      fields: [...s.fields, {
        id,
        name: data.name || '',
        code: data.code || '',
        isActive: data.isActive !== undefined ? !!data.isActive : true,
      }],
      auditLogs: [createAuditEntry('CREATE', 'Field', id, `Thêm lĩnh vực: ${data.name}`), ...s.auditLogs],
    }));
  },
  updateField: (id, data) => {
    set(s => ({
      fields: s.fields.map(f => f.id === id ? { ...f, ...data } : f),
      auditLogs: [createAuditEntry('UPDATE', 'Field', id, `Cập nhật lĩnh vực`), ...s.auditLogs],
    }));
  },
  deleteField: (id) => {
    set(s => ({
      fields: s.fields.filter(f => f.id !== id),
      auditLogs: [createAuditEntry('DELETE', 'Field', id, `Xóa lĩnh vực`), ...s.auditLogs],
    }));
  },

  // ════════════════════════════════════════════════════════
  // PROGRESS / COMMENTS / EXTENSIONS
  // ════════════════════════════════════════════════════════
  addProgressUpdate: (data) => {
    const task = get().tasks.find(t => t.id === data.taskId);
    if (!task) return;
    const actor = get().currentUser;
    const id = uid('prog');
    const entry: ProgressUpdate = {
      id,
      taskId: data.taskId,
      userId: actor?.id || '',
      userName: actor?.fullName || '',
      userAvatar: actor?.avatar || '',
      progress: data.progress,
      previousProgress: task.progress,
      content: data.content,
      difficulties: data.difficulties || null,
      suggestions: data.suggestions || null,
      attachments: [],
      createdAt: now(),
    };
    const progressStatus =
      data.progress >= 100
        ? ('WAITING_APPROVAL' as const)
        : task.status === 'ASSIGNED' || task.status === 'ACCEPTED'
          ? ('IN_PROGRESS' as const)
          : undefined;
    set(s => ({
      progressUpdates: [entry, ...s.progressUpdates],
      tasks: s.tasks.map(t =>
        t.id === data.taskId
          ? {
              ...t,
              progress: data.progress,
              updatedAt: now(),
              ...(progressStatus ? { status: progressStatus } : {}),
            }
          : t,
      ),
      notifications: [
        createNotification('PROGRESS_UPDATE', `Cập nhật tiến độ: ${task.title}`, `Tiến độ: ${data.progress}%`, `/tasks/${data.taskId}`),
        ...s.notifications,
      ],
      auditLogs: [createAuditEntry('PROGRESS', 'Task', data.taskId, `Tiến độ: ${task.progress}% → ${data.progress}%`), ...s.auditLogs],
    }));
    get().recalcKPI();
  },

  addComment: (data) => {
    const actor = get().currentUser;
    const id = uid('cmt');
    const entry: TaskComment = {
      id,
      taskId: data.taskId,
      userId: actor?.id || '',
      userName: actor?.fullName || '',
      userAvatar: actor?.avatar || '',
      content: data.content,
      mentions: [],
      attachments: [],
      createdAt: now(),
      isEdited: false,
    };
    set(s => ({
      taskComments: [entry, ...s.taskComments],
      notifications: [
        createNotification('COMMENT', 'Bình luận mới', data.content.substring(0, 80), `/tasks/${data.taskId}`),
        ...s.notifications,
      ],
    }));
  },

  addExtensionRequest: (data) => {
    const task = get().tasks.find(t => t.id === data.taskId);
    if (!task) return;
    const actor = get().currentUser;
    const id = uid('ext');
    const entry: ExtensionRequest = {
      id,
      taskId: data.taskId,
      taskTitle: task.title,
      requesterId: actor?.id || '',
      requesterName: actor?.fullName || '',
      currentDueDate: task.dueDate,
      requestedDueDate: data.requestedDueDate,
      reason: data.reason,
      attachments: [],
      status: 'PENDING',
      decidedBy: null,
      decidedByName: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: now(),
    };
    set(s => ({
      extensionRequests: [entry, ...s.extensionRequests],
      notifications: [
        createNotification('EXTENSION_REQUEST', `Yêu cầu gia hạn: ${task.title}`, data.reason, `/tasks/${data.taskId}`),
        ...s.notifications,
      ],
    }));
  },

  approveExtension: (id, note) => {
    const ext = get().extensionRequests.find(e => e.id === id);
    if (!ext) return;
    const actor = get().currentUser;
    set(s => ({
      extensionRequests: s.extensionRequests.map(e => e.id === id ? {
        ...e, status: 'APPROVED' as const, decidedBy: actor?.id || '', decidedByName: actor?.fullName || '', decidedAt: now(), decisionNote: note,
      } : e),
      tasks: s.tasks.map(t => t.id === ext.taskId ? { ...t, dueDate: ext.requestedDueDate, updatedAt: now() } : t),
      auditLogs: [createAuditEntry('APPROVE', 'ExtensionRequest', id, `Phê duyệt gia hạn → ${ext.requestedDueDate}`), ...s.auditLogs],
    }));
  },

  rejectExtension: (id, note) => {
    const actor = get().currentUser;
    set(s => ({
      extensionRequests: s.extensionRequests.map(e => e.id === id ? {
        ...e, status: 'REJECTED' as const, decidedBy: actor?.id || '', decidedByName: actor?.fullName || '', decidedAt: now(), decisionNote: note,
      } : e),
      auditLogs: [createAuditEntry('REJECT', 'ExtensionRequest', id, `Từ chối gia hạn: ${note}`), ...s.auditLogs],
    }));
  },

  // ════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════════
  markNotificationRead: (id) => {
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }));
  },
  markAllNotificationsRead: () => {
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) }));
  },
  deleteNotification: (id) => {
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
  },

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  getTaskById: (id) => get().tasks.find(t => t.id === id),
  getUserById: (id) => get().users.find(u => u.id === id),
  getDepartmentById: (id) => get().departments.find(d => d.id === id),
  getDocumentById: (id) => get().incomingDocuments.find(d => d.id === id),
  getProgressByTaskId: (taskId) => get().progressUpdates.filter(p => p.taskId === taskId),
  getCommentsByTaskId: (taskId) => get().taskComments.filter(c => c.taskId === taskId),
  getExtensionsByTaskId: (taskId) => get().extensionRequests.filter(e => e.taskId === taskId),
  getUnreadNotifications: () => get().notifications.filter(n => !n.isRead),

  recalcKPI: () => {
    const tasks = get().tasks;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProg = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length;
    const waiting = tasks.filter(t => t.status === 'WAITING_APPROVAL').length;
    const overdue = tasks.filter(t => t.isOverdue).length;
    const nearDl = tasks.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const diff = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
      return diff >= 0 && diff <= 3;
    }).length;
    const onTime = tasks.filter(t => t.status === 'COMPLETED' && !t.isOverdue).length;
    set({
      reportKPI: {
        totalTasks: total,
        inProgress: inProg,
        waitingApproval: waiting,
        completed,
        onTime,
        nearDeadline: nearDl,
        overdue,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
        onTimeRate: completed ? Math.round((onTime / completed) * 100) : 0,
      },
    });
  },
};
});
