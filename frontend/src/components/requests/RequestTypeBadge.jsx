const styles = {
  sent: 'bg-sky-50 text-sky-700',
  received: 'bg-emerald-50 text-emerald-700',
};

export default function RequestTypeBadge({ type }) {
  const key = String(type || '').toLowerCase();
  const cls = styles[key] ?? 'bg-gray-100 text-gray-700';
  const label = key === 'received' ? 'Received' : key === 'sent' ? 'Sent' : '—';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
