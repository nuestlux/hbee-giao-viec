import type { Role, User, UserRole } from '../types';

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
