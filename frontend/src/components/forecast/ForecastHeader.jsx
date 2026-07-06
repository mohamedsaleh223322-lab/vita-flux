import { SlidersHorizontal } from 'lucide-react';

export default function ForecastHeader({
  title,
  subtitle,
  showFilters,
  onToggleFilters,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-gray-500 sm:text-base">{subtitle}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onToggleFilters}
        className="inline-flex items-center gap-2 self-start rounded-lg border border-indigo-500 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
      >
        <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
        {showFilters ? 'Filter' : 'Show Filters'}
      </button>
    </div>
  );
}
