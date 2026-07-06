import { Link, useLocation, useParams } from 'react-router-dom';

export default function RequestDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const row = location.state;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Request #{id}</h1>
        {row ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Hospital</dt>
              <dd className="font-medium text-gray-900">{row.hospital}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Governorate</dt>
              <dd className="font-medium text-gray-900">{row.governorate}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Blood type</dt>
              <dd className="font-semibold text-red-600">{row.bloodType}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Quantity</dt>
              <dd className="font-medium text-gray-900">{row.quantity} bags</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium capitalize text-gray-900">{row.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900">{row.date}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            Open this page from the requests table to see full details, or wire{' '}
            <code className="rounded bg-gray-100 px-1">GET /api/requests/:id</code> later.
          </p>
        )}
      </div>
      <Link
        to="/requests/list"
        className="inline-flex text-sm font-medium text-red-600 hover:underline"
      >
        ← Back to list
      </Link>
    </div>
  );
}
