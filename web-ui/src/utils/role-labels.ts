import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  CHAIRMAN: 'Chủ tịch',
  VICE_CHAIRMAN: 'Phó Chủ tịch',
  DEPT_HEAD: 'Trưởng phòng',
  DEPT_DEPUTY: 'Phó phòng',
  SPECIALIST: 'Chuyên viên',
  CLERK: 'Văn thư',
  ADMIN: 'Quản trị hệ thống',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] || role;
}
