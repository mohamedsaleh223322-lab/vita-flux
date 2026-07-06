import { Minus, Plus } from 'lucide-react';

export default function RequestsQuantityStepper({
  value,
  onChange,
  label = 'Quantity (Bags)',
  disabled = false,
  min = 0,
  max = 99,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">{label}</label>
      <div className="flex h-12 max-w-xs items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-full w-12 items-center justify-center bg-gray-50 text-red-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center justify-center text-lg font-semibold text-gray-900">{value}</div>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-full w-12 items-center justify-center bg-gray-50 text-red-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
