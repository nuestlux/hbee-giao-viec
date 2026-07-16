/**
 * Chọn thư mục lưu báo cáo qua File System Access API (Chrome/Edge).
 * Lưu DirectoryHandle trong IndexedDB để lần xuất sau ghi vào đúng thư mục.
 */

const DB_NAME = 'hbee-fs-access';
const STORE = 'handles';
const HANDLE_KEY = 'report-export-dir';

/** Loose typing for Chromium File System Access API */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDirHandle = any;

export type PickFolderResult =
  | { ok: true; folderName: string; displayPath: string }
  | { ok: false; reason: 'unsupported' | 'aborted' | 'error'; message: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

export async function saveReportExportDirHandle(handle: AnyDirHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB put failed'));
  });
  db.close();
}

export async function loadReportExportDirHandle(): Promise<AnyDirHandle | null> {
  try {
    const db = await openDb();
    const handle = await new Promise<AnyDirHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function clearReportExportDirHandle(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export function canPickDirectory(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

async function ensureWritePermission(handle: AnyDirHandle): Promise<boolean> {
  try {
    if (typeof handle.queryPermission === 'function') {
      let perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted' && typeof handle.requestPermission === 'function') {
        perm = await handle.requestPermission({ mode: 'readwrite' });
      }
      return perm === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

/** Mở dialog chọn thư mục trên máy (Chrome / Edge). */
export async function pickReportExportFolder(): Promise<PickFolderResult> {
  if (!canPickDirectory()) {
    return {
      ok: false,
      reason: 'unsupported',
      message:
        'Trình duyệt không hỗ trợ chọn thư mục. Dùng Chrome/Edge hoặc nhập đường dẫn thủ công.',
    };
  }

  try {
    const w = window as unknown as {
      showDirectoryPicker: (opts?: object) => Promise<AnyDirHandle>;
    };
    const handle = await w.showDirectoryPicker({
      id: 'hbee-report-export',
      mode: 'readwrite',
      startIn: 'documents',
    });

    await ensureWritePermission(handle);
    await saveReportExportDirHandle(handle);

    const folderName = (handle.name as string) || 'Thư mục đã chọn';
    const displayPath =
      folderName.includes('\\') || folderName.includes('/')
        ? folderName
        : `…\\${folderName}`;

    return { ok: true, folderName, displayPath };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'AbortError') {
      return { ok: false, reason: 'aborted', message: 'Đã hủy chọn thư mục' };
    }
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Không chọn được thư mục',
    };
  }
}

/** Ghi file vào thư mục đã chọn. false → fallback download. */
export async function writeBlobToReportExportFolder(
  filename: string,
  data: ArrayBuffer,
): Promise<boolean> {
  const handle = await loadReportExportDirHandle();
  if (!handle) return false;

  try {
    const ok = await ensureWritePermission(handle);
    if (!ok) return false;

    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}
