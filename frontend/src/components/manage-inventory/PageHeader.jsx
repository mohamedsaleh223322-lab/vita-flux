export default function PageHeader({ title, subtitle }) {
    return (<header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="text-sm font-medium text-slate-500">{subtitle}</p>
    </header>);
}
