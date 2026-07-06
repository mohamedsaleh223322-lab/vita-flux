const base =
  'rounded-[12px] border border-[#F1F5F9] bg-white p-5 shadow-sm transition-shadow hover:shadow-md';

export default function ForecastKpiCard({
  label,
  value,
  subLabel,
  icon: Icon,
  iconWrapperClassName,
  iconClassName = 'h-5 w-5',
}) {
  return (
    <div className={base}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrapperClassName}`}>
          <Icon className={iconClassName} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          </div>
          {subLabel ? <p className="mt-0.5 text-xs font-medium text-slate-400">{subLabel}</p> : null}
        </div>
      </div>
    </div>
  );
}

