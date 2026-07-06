export function formatPhone(phone: string): string {
  // Simple formatting for Egyptian numbers: 01XXXXXXXXX → +20 1XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+20 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(iso);
}

export function truncate(text: string, max = 50): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
