import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total records — Ant Design style footer */
  total?: number;
  pageSize?: number;
  className?: string;
}

/**
 * Pagination bar — Ant Design-inspired: "Tổng n" + page buttons.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  pageSize,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && total === undefined) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const from =
    total !== undefined && pageSize
      ? total === 0
        ? 0
        : (currentPage - 1) * pageSize + 1
      : undefined;
  const to =
    total !== undefined && pageSize
      ? Math.min(currentPage * pageSize, total)
      : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 ${className}`}
    >
      <p className="text-sm text-slate-500 tabular-nums order-2 sm:order-1">
        {total !== undefined ? (
          from !== undefined && to !== undefined ? (
            <>
              {from}–{to} / <strong className="font-semibold text-slate-700">{total}</strong>
            </>
          ) : (
            <>
              Tổng <strong className="font-semibold text-slate-700">{total}</strong>
            </>
          )
        ) : (
          <span className="sr-only">Phân trang</span>
        )}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1 order-1 sm:order-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600
              hover:border-primary-400 hover:text-primary-600 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-slate-200"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          {pages.map((page, i) =>
            typeof page === 'number' ? (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors border
                  ${
                    page === currentPage
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {page}
              </button>
            ) : (
              <span
                key={i}
                className="h-8 w-8 flex items-center justify-center text-slate-400 text-sm"
              >
                …
              </span>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600
              hover:border-primary-400 hover:text-primary-600 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-slate-200"
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
