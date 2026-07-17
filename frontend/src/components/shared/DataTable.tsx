import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, actions?: any) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  actions?: any;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  pageSize = 10,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = searchKey
    ? data.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      )}

      <div className="stat-card overflow-hidden p-0">
        {/* Table for medium+ screens */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((col) => (
                  <th key={col.key} className="text-left p-2.5 sm:p-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-foreground/60 text-sm">
                    No data found.
                  </td>
                </tr>
              ) : (
                paged.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => onRowClick?.(item)}
                    className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-2.5 sm:p-4 text-xs sm:text-sm text-foreground">
                        {col.render ? col.render(item, actions) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card list for small screens */}
        <div className="block sm:hidden">
          {paged.length === 0 ? (
            <div className="p-4 text-center text-foreground/60 text-sm">No data found.</div>
          ) : (
            <div className="space-y-3 p-3">
              {paged.map((item, i) => (
                <div
                  key={i}
                  onClick={() => onRowClick?.(item)}
                  className={`bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 transition-shadow ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {columns.slice(0, 2).map((col) => (
                        <div key={col.key} className="mb-1">
                          <div className="text-xs text-foreground/70">{col.label}</div>
                          <div className="text-sm text-foreground font-medium truncate">
                            {col.render ? col.render(item, actions) : String(item[col.key] ?? '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {columns.length > 2 && (
                    <details className="mt-2 text-xs text-foreground/70">
                      <summary className="list-none">More</summary>
                      <div className="mt-2 space-y-1">
                        {columns.slice(2).map((col) => (
                          <div key={col.key} className="flex justify-between">
                            <div className="text-foreground/70">{col.label}</div>
                            <div className="text-foreground truncate ml-3">{col.render ? col.render(item, actions) : String(item[col.key] ?? '')}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-foreground/70">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm text-foreground/70">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
