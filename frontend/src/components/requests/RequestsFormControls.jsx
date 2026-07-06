import { Calendar } from 'lucide-react';

export default function RequestsSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  disabled = false,
  getValue = (o) => String(o.value ?? o.id ?? o),
  getLabel = (o) => o.label ?? o.nameEn ?? o.name ?? String(o),
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">{label}</label>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt, idx) => (
            <option key={getValue(opt) + String(idx)} value={getValue(opt)}>
              {getLabel(opt)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
      </div>
    </div>
  );
}

export function RequestsDateField({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}
