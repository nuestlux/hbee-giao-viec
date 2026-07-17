import type { Role, Task, User, UserRole } from '../types';

/** Map User.role enum → roles[].code in mock seed (VICE_CHAIRMAN uses CHAIRMAN pack). */
const ROLE_CODE_MAP: Record<UserRole, string> = {
  CHAIRMAN: 'CHAIRMAN',
  VICE_CHAIRMAN: 'CHAIRMAN',
  DEPT_HEAD: 'DEPT_HEAD',
  DEPT_DEPUTY: 'DEPT_DEPUTY',
  SPECIALIST: 'SPECIALIST',
  CLERK: 'CLERK',
  ADMIN: 'ADMIN',
};

export function getRolePermissionCodes(user: User | null | undefined, roles: Role[]): string[] {
  if (!user) return [];
  const code = ROLE_CODE_MAP[user.role] || user.role;
  const role = roles.find((r) => r.code === code);
  return role?.permissions ?? [];
}

export function hasPermission(
  user: User | null | undefined,
  roles: Role[],
  permissionCode: string,
): boolean {
  return getRolePermissionCodes(user, roles).includes(permissionCode);
}

/** Sửa meta nhiệm vụ (tiêu đề, phân công, hạn…) — không gồm task.update. */
export function canEditTaskMeta(
  user: User | null | undefined,
  roles: Role[],
  task?: Task | null,
): boolean {
  if (!user) return false;
  if (
    hasPermission(user, roles, 'task.create') ||
    hasPermission(user, roles, 'task.assign') ||
    user.role === 'ADMIN' ||
    user.role === 'CHAIRMAN' ||
    user.role === 'VICE_CHAIRMAN'
  ) {
    return true;
  }
  // Người giao việc này
  if (task?.assignerId && task.assignerId === user.id) return true;
  return false;
}

/**
 * Cập nhật tiến độ — seed: `task.update` = "Cập nhật tiến độ".
 * + người được giao / người giao việc này.
 */
export function canUpdateTaskProgress(
  user: User | null | undefined,
  roles: Role[],
  task?: Task | null,
): boolean {
  if (!user) return false;
  if (hasPermission(user, roles, 'task.update')) return true;
  if (!task) return false;
  if (task.assigneeId && task.assigneeId === user.id) return true;
  if (task.assignerId && task.assignerId === user.id) return true;
  // Giao phòng, chưa gán người: cán bộ cùng phòng được cập nhật
  if (
    !task.assigneeId &&
    task.assignedDepartmentId &&
    task.assignedDepartmentId === user.departmentId
  ) {
    return true;
  }
  return false;
}

/** Can see full subject of high-security docs (not just generic viewers). */
export function canViewSecretDocument(
  user: User | null | undefined,
  roles: Role[],
): boolean {
  return (
    hasPermission(user, roles, 'document.edit') ||
    user?.role === 'ADMIN' ||
    user?.role === 'CHAIRMAN' ||
    user?.role === 'VICE_CHAIRMAN'
  );
}

/**
 * Phê duyệt kết quả nhiệm vụ (WAITING_APPROVAL → COMPLETED).
 * - Bắt buộc quyền `task.approve` (CHAIRMAN/VICE, DEPT_HEAD, ADMIN trong seed).
 * - Nếu task chỉ định `approverUserId` → chỉ người đó (hoặc lãnh đạo/admin).
 * - Trưởng/phó phòng: chỉ phòng mình chủ trì.
 * - Chủ tịch / admin: toàn đơn vị (khi không bị khóa bởi approverUserId).
 */
export function canApproveTaskResult(
  user: User | null | undefined,
  roles: Role[],
  task: Task | null | undefined,
): boolean {
  if (!user || !task) return false;
  if (task.status !== 'WAITING_APPROVAL') return false;
  if (!hasPermission(user, roles, 'task.approve')) return false;

  const isLeader =
    user.role === 'ADMIN' ||
    user.role === 'CHAIRMAN' ||
    user.role === 'VICE_CHAIRMAN';

  if (task.approverUserId) {
    return task.approverUserId === user.id || isLeader;
  }

  if (user.role === 'DEPT_HEAD' || user.role === 'DEPT_DEPUTY') {
    return task.assignedDepartmentId === user.departmentId;
  }

  return isLeader || hasPermission(user, roles, 'task.approve');
}
