import { type ReactNode } from 'react';
import { CaretUpOutlined, CaretDownOutlined } from './table-sort-icons';

interface Column<T> {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  /** Compact density like Ant Design middle/small */
  size?: 'default' | 'middle';
  className?: string;
}

/**
 * Data table with Ant Design-inspired header sorter (dual caret), sticky feel, empty state.
 */
export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  sortKey,
  sortDirection = 'asc',
  onSort,
  emptyMessage = 'Không có dữ liệu',
  size = 'default',
  className = '',
}: DataTableProps<T>) {
  const cellY = size === 'middle' ? 'py-2.5' : 'py-3.5';

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200">
            {columns.map((col) => {
              const sortable = Boolean(col.sortable && onSort);
              const active = sortKey === col.key;
              const ariaSort = !sortable
                ? undefined
                : active
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none';
              const align =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={ariaSort}
                  className={`px-4 sm:px-5 ${cellY} ${align} text-[0.8125rem] font-semibold text-slate-600 tracking-wide whitespace-nowrap
                    ${sortable ? 'cursor-pointer select-none hover:bg-slate-100/80 group' : ''}
                    ${col.className || ''}`}
                  onClick={() => sortable && onSort?.(col.key)}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 max-w-full ${
                      col.align === 'right' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span className="leading-snug">{col.title}</span>
                    {sortable ? (
                      <span
                        className="inline-flex flex-col leading-none -space-y-1 shrink-0"
                        aria-hidden
                      >
                        <CaretUpOutlined
                          active={active && sortDirection === 'asc'}
                        />
                        <CaretDownOutlined
                          active={active && sortDirection === 'desc'}
                        />
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-16 text-center text-slate-400"
              >
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[0.9375rem] text-slate-500">{emptyMessage}</p>
                  <p className="text-xs text-slate-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={item.id || idx}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors duration-100
                  ${onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-slate-50/70'}`}
              >
                {columns.map((col) => {
                  const align =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                  return (
                    <td
                      key={col.key}
                      className={`px-4 sm:px-5 ${cellY} ${align} text-[0.9375rem] leading-relaxed text-slate-700 align-middle ${col.className || ''}`}
                    >
                      {col.render(item)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export type { Column };
