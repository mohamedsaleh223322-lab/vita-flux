import { CalendarDays } from 'lucide-react';
export default function ExpiryDatePicker({ value, onChange, label = 'Expiry Date', disabled = false, }) {
    return (<div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"/>
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
      </div>
    </div>);
}
