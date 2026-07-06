const styles = {
  pending: 'bg-orange-50 text-orange-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  in_transit: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
};

export default function RequestStatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const cls = styles[key] ?? 'bg-gray-100 text-gray-700';
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : '—';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {label}
    </span>
  );
}
