import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function RequestRowActions({
  requestId,
  detailState = null,
  onApprove,
  onReject,
  onComplete,
  onDelete,
  busy = false,
}) {
  return (
    <div className="flex items-center gap-2">
      {/* View Details */}
      <Link
        to={`/requests/${encodeURIComponent(requestId)}`}
        state={detailState ?? undefined}
        className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        aria-label="View Details"
      >
        <Eye className="h-4 w-4" />
      </Link>

      {/* Received Requests - Approve/Reject */}
      {detailState?.status === 'PENDING' && detailState?.type === 'received' && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove?.()}
            className="rounded-lg border border-green-600 px-2 py-1 text-xs font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject?.()}
            className="rounded-lg border border-red-600 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {/* Sent Requests - Confirm Receipt */}
      {detailState?.status === 'IN_TRANSIT' && detailState?.type === 'sent' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onComplete?.()}
          className="rounded-lg border border-green-600 px-2 py-1 text-xs font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50"
        >
          Confirm Receipt
        </button>
      )}

      {/* Sent Requests - Cancel/Delete */}
      {((detailState?.status === 'PENDING' && detailState?.type === 'sent') || 
        detailState?.status === 'COMPLETED' || 
        detailState?.status === 'REJECTED') && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete?.()}
          className="rounded-lg border border-red-600 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          {detailState?.status === 'PENDING' ? 'Cancel' : 'Delete'}
        </button>
      )}
    </div>
  );
}
