/** Client-side table sort — Ant Design-like cycle: none → asc → desc → none (optional) */

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string | null;
  direction: SortDirection;
};

export function toggleSort(
  current: SortState,
  nextKey: string,
  /** When true, third click clears sort */
  allowClear = false,
): SortState {
  if (current.key !== nextKey) {
    return { key: nextKey, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { key: nextKey, direction: 'desc' };
  }
  if (allowClear) {
    return { key: null, direction: 'asc' };
  }
  return { key: nextKey, direction: 'asc' };
}

type SortValue = string | number | boolean | Date | null | undefined;

/**
 * Sort a shallow copy of rows by accessor map.
 * Prefer explicit accessors for nested/display fields.
 */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  accessors?: Partial<Record<string, (row: T) => SortValue>>,
): T[] {
  if (!sort.key) return rows;
  const key = sort.key;
  const dir = sort.direction === 'asc' ? 1 : -1;
  const get =
    accessors?.[key] ??
    ((row: T) => {
      const v = (row as Record<string, unknown>)[key] as SortValue;
      return v;
    });

  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;

    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir;
    }
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      return (Number(va) - Number(vb)) * dir;
    }

    const sa = String(va);
    const sb = String(vb);
    const da = va instanceof Date ? va : new Date(sa);
    const db = vb instanceof Date ? vb : new Date(sb);
    if (
      !Number.isNaN(da.getTime()) &&
      !Number.isNaN(db.getTime()) &&
      /^\d{4}-\d{2}/.test(sa) &&
      /^\d{4}-\d{2}/.test(sb)
    ) {
      return (da.getTime() - db.getTime()) * dir;
    }

    return sa.localeCompare(sb, 'vi', { sensitivity: 'base', numeric: true }) * dir;
  });
}
