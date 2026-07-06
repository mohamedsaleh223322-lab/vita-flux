import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RequestsPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    pages.push(i);
  }
  const windowed =
    totalPages <= 5
      ? pages
      : (() => {
          const out = new Set([1, totalPages, page, page - 1, page + 1]);
          return [...out].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
        })();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {windowed.map((n, idx) => (
          <span key={n} className="flex items-center gap-2">
            {idx > 0 && windowed[idx - 1] !== n - 1 ? (
              <span className="px-1 text-gray-400">…</span>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(n)}
              className={`min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                n === page
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
