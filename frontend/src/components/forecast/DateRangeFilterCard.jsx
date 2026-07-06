import { ArrowRight, SlidersHorizontal } from 'lucide-react';

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

function DateField({ label, value, onChange, disabled, min }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-[128px] rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

export default function DateRangeFilterCard({
  open,
  fromDate,
  toDate,
  onFromDate,
  onToDate,
  onClear,
  onApply,
  applying,
}) {
  if (!open) return null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white px-4 py-1.5 shadow-sm transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 min-h-[34px]">
        {/* Left Side: Filter icon and Date inputs */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 transition-colors">
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateField label="From" value={fromDate} onChange={onFromDate} disabled={applying} min={todayISODate()} />
            <ArrowRight className="h-3 w-3 text-gray-400 shrink-0 mx-0.5" />
            <DateField label="To" value={toDate} onChange={onToDate} disabled={applying} />
          </div>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onClear}
            disabled={applying}
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="rounded-md bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </section>
  );
}
