import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SearchX } from 'lucide-react';
import { cn } from '@/utils/cn';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';
import SearchInput from './SearchInput';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Hide this column below the given breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

const HIDDEN: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  pageSize: initialPageSize = 8,
  pageSizeOptions = [5, 8, 15],
  searchable = false,
  searchPlaceholder = 'Search…',
  searchFilter,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  toolbar,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchFilter) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => searchFilter(row, q));
  }, [data, query, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  return (
    <div className={cn('card overflow-hidden', className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          {searchable ? (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={searchPlaceholder}
              className="w-full max-w-xs"
            />
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={6} cols={columns.length} />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-9 w-9" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn('table-th', col.hideBelow && HIDDEN[col.hideBelow])}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick
                      ? 'cursor-pointer hover:bg-brand-50/50 dark:hover:bg-slate-800/60'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('table-td', col.hideBelow && HIDDEN[col.hideBelow], col.className)}
                    >
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{start + 1}</span>–
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(start + pageSize, filtered.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="select !w-auto !py-1.5 text-xs"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                aria-label="First page"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[4rem] px-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                aria-label="Last page"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
