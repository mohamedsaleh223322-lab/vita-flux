const cardBase = 'rounded-[12px] border border-[#F1F5F9] bg-white shadow-sm transition-shadow hover:shadow-md';
export function StatCard({ label, value, icon: Icon, iconWrapperClassName, iconClassName = 'h-5 w-5', layout = 'metric', subLabel, badge, className = '', }) {
    if (layout === 'summary') {
        return (<div className={`${cardBase} flex items-center gap-4 p-5 ${className}`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapperClassName}`}>
          <Icon className={iconClassName} strokeWidth={2} aria-hidden/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-slate-500">{label}</p>
          <p className="truncate text-lg font-bold text-slate-900">{value}</p>
          {subLabel ? (<p className="truncate text-xs text-slate-400">{subLabel}</p>) : null}
        </div>
      </div>);
    }
    return (<div className={`${cardBase} relative overflow-hidden p-5 ${className}`}>
      <div className="absolute right-4 top-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrapperClassName}`}>
          <Icon className={iconClassName} strokeWidth={2} aria-hidden/>
        </div>
      </div>
      <p className="pr-14 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {badge}
      </div>
    </div>);
}
