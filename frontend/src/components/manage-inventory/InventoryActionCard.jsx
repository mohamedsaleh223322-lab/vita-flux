export default function InventoryActionCard({ type, title, icon: Icon, children, }) {
    const topAccentClass = type === 'remove' ? 'border-t-red-400' : 'border-t-slate-600';
    const iconWrapClass = type === 'remove' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600';
    return (<section className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${topAccentClass} border-t-4 flex flex-col h-full`}>
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${iconWrapClass}`}>
            <Icon className="h-4 w-4"/>
          </div>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-700">{title}</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col px-6 py-5">{children}</div>
    </section>);
}
