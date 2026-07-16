/** Client-side session helpers for the mock UI (no real backend yet). */

export const AUTH_STORAGE_KEY = 'hbee-auth-user-id';
export const REMEMBER_FLAG_KEY = 'hbee-auth-remember';
export const REMEMBER_EMAIL_KEY = 'hbee-auth-email';

/** Demo password shared by all mock accounts until NestJS auth is ready. */
export const DEMO_PASSWORD = '123456';

/** Per-user password overrides (mock only — not for production). */
export const USER_PASSWORDS_KEY = 'hbee-auth-passwords';

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Prefer localStorage (remember) then sessionStorage (this tab only). */
export function loadSessionUserId(): string | null {
  return safeGet(localStorage, AUTH_STORAGE_KEY) ?? safeGet(sessionStorage, AUTH_STORAGE_KEY);
}

export function saveSessionUserId(userId: string, remember: boolean): void {
  if (remember) {
    safeSet(localStorage, AUTH_STORAGE_KEY, userId);
    safeRemove(sessionStorage, AUTH_STORAGE_KEY);
    safeSet(localStorage, REMEMBER_FLAG_KEY, '1');
  } else {
    safeSet(sessionStorage, AUTH_STORAGE_KEY, userId);
    safeRemove(localStorage, AUTH_STORAGE_KEY);
    safeRemove(localStorage, REMEMBER_FLAG_KEY);
  }
}

export function clearSessionUserId(): void {
  safeRemove(localStorage, AUTH_STORAGE_KEY);
  safeRemove(sessionStorage, AUTH_STORAGE_KEY);
}

export function isRememberEnabled(): boolean {
  return safeGet(localStorage, REMEMBER_FLAG_KEY) === '1';
}

export function loadRememberedEmail(): string {
  if (!isRememberEnabled()) return '';
  return safeGet(localStorage, REMEMBER_EMAIL_KEY) ?? '';
}

export function saveRememberedEmail(email: string): void {
  safeSet(localStorage, REMEMBER_EMAIL_KEY, email.trim());
  safeSet(localStorage, REMEMBER_FLAG_KEY, '1');
}

export function clearRememberedEmail(): void {
  safeRemove(localStorage, REMEMBER_EMAIL_KEY);
  safeRemove(localStorage, REMEMBER_FLAG_KEY);
}

type PasswordMap = Record<string, string>;

function loadPasswordMap(): PasswordMap {
  const raw = safeGet(localStorage, USER_PASSWORDS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PasswordMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePasswordMap(map: PasswordMap): void {
  safeSet(localStorage, USER_PASSWORDS_KEY, JSON.stringify(map));
}

/** Current password for user: custom override or default demo password. */
export function getUserPassword(userId: string): string {
  const map = loadPasswordMap();
  return map[userId] || DEMO_PASSWORD;
}

export function verifyUserPassword(userId: string, password: string): boolean {
  return getUserPassword(userId) === password;
}

export function setUserPassword(userId: string, newPassword: string): void {
  const map = loadPasswordMap();
  map[userId] = newPassword;
  savePasswordMap(map);
}

export type ChangePasswordError =
  | 'NOT_AUTH'
  | 'CURRENT_WRONG'
  | 'EMPTY'
  | 'MISMATCH';

/** Minimal checks only — no strength rules. */
export function validateNewPassword(
  current: string,
  next: string,
  confirm: string,
  userId: string,
): ChangePasswordError | null {
  if (!verifyUserPassword(userId, current)) return 'CURRENT_WRONG';
  if (!next.trim()) return 'EMPTY';
  if (next !== confirm) return 'MISMATCH';
  return null;
}
