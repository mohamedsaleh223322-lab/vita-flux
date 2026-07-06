import { Droplet } from 'lucide-react';
export function AlertItem({ bloodType, bagsLeft, className = '' }) {
    return (<div className={`flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-4 py-3 ${className}`} role="status">
      <div className="flex min-w-0 items-center gap-2">
        <Droplet className="h-5 w-5 shrink-0 text-red-600" strokeWidth={2} aria-hidden/>
        <span className="font-bold text-red-600">{bloodType}</span>
      </div>
      <span className="shrink-0 text-sm font-medium text-slate-800">
        {bagsLeft} {bagsLeft === 1 ? 'Bag' : 'Bags'} Left
      </span>
    </div>);
}
