import { Loader2 } from 'lucide-react';
export default function ActionButton({ variant, children, onClick, disabled = false, loading = false, className = '', }) {
    const baseClass = 'h-12 w-full rounded-lg px-4 text-sm font-bold uppercase tracking-wider text-white transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70';
    const variantClass = variant === 'danger'
        ? 'bg-red-400 hover:bg-red-500 focus-visible:ring-red-300'
        : 'bg-slate-500 hover:bg-slate-600 focus-visible:ring-slate-300';
    return (<button type="button" onClick={onClick} disabled={disabled || loading} className={`${baseClass} ${variantClass} ${className}`}>
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
        {children}
      </span>
    </button>);
}
