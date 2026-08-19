import { ReactNode, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
}

export function AdminTable<T extends { id: number }>({
  title,
  subtitle,
  columns,
  rows,
  isLoading,
  isError,
  onRetry,
  searchPlaceholder = 'Search…',
}: {
  title: string;
  subtitle: string;
  columns: Column<T>[];
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => columns.some((c) => c.searchValue?.(row).toLowerCase().includes(q)));
  }, [rows, query, columns]);

  if (isLoading) return <CardSkeleton count={4} />;
  if (isError) return <ErrorState message="Could not load data" onRetry={onRetry} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder={searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No records yet" description="Nothing to show here right now." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                {columns.map((c) => <th key={c.header} className="px-5 py-3 font-semibold">{c.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-ink-50 transition hover:bg-ink-50/60 last:border-0 dark:border-ink-800/60 dark:hover:bg-ink-800/40">
                  {columns.map((c) => <td key={c.header} className="px-5 py-4">{c.render(row)}</td>)}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-ink-400">No matches for “{query}”</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { StatusBadge };
