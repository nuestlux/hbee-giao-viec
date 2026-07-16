import { Search, X, RotateCcw } from 'lucide-react';
import { type ReactNode } from 'react';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter controls (selects) */
  children?: ReactNode;
  /** Shown on the right — e.g. total count */
  total?: number;
  totalLabel?: string;
  /** Reset all filters */
  onReset?: () => void;
  /** Highlight that non-default filters are active */
  hasActiveFilters?: boolean;
  className?: string;
}

/** Ant Design-like select used inside FilterBar */
export const filterSelectClass =
  'h-9 min-w-[9.5rem] px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 ' +
  'hover:border-primary-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 ' +
  'transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Toolbar search + filters — layout inspired by Ant Design Table filter bar:
 * [Search] [Select…] [Select…]  ……  [Reset] [Tổng n]
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  children,
  total,
  totalLabel = 'Tổng',
  onReset,
  hasActiveFilters = false,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-3.5 shadow-sm mb-4 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-xs flex-1 sm:flex-none">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-8 pr-8 rounded-md border border-slate-200 bg-white text-sm text-slate-900
              placeholder:text-slate-400 hover:border-primary-400
              focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-colors"
            aria-label={searchPlaceholder}
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Filters */}
        {children ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{children}</div>
        ) : null}

        {/* Actions + total */}
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-between sm:justify-end">
          {onReset && hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 text-sm font-medium text-slate-600
                hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50/50 transition-colors"
            >
              <RotateCcw size={14} />
              Đặt lại
            </button>
          ) : null}
          {typeof total === 'number' ? (
            <span className="text-sm text-slate-500 tabular-nums whitespace-nowrap px-1">
              {totalLabel}{' '}
              <strong className="font-semibold text-slate-800">{total}</strong>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
