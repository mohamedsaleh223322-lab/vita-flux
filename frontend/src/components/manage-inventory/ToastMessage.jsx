import { AlertCircle, CheckCircle2, X } from 'lucide-react';
export default function ToastMessage({ variant, message, onClose }) {
    const isSuccess = variant === 'success';
    const iconClass = isSuccess ? 'text-emerald-600' : 'text-red-600';
    const wrapClass = isSuccess
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-red-200 bg-red-50 text-red-800';
    return (<div className={`fixed right-4 top-4 z-50 w-[min(92vw,24rem)] rounded-xl border px-4 py-3 shadow-lg ${wrapClass}`}>
      <div className="flex items-start gap-3">
        {isSuccess ? <CheckCircle2 className={`mt-0.5 h-5 w-5 ${iconClass}`}/> : <AlertCircle className={`mt-0.5 h-5 w-5 ${iconClass}`}/>}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="rounded p-1 text-current/70 transition hover:bg-black/5 hover:text-current" aria-label="Close toast">
          <X className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
