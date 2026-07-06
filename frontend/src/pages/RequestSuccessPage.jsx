import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';

export default function RequestSuccessPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <div className="relative">
          <ClipboardCheck className="h-14 w-14" strokeWidth={1.75} />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Request Submitted Successfully!</h1>
      <p className="mt-2 text-gray-500">We will review your request and get back to you shortly.</p>
      <Link
        to="/requests/list"
        className="mt-8 inline-flex rounded-lg bg-red-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
      >
        Back to Requests
      </Link>
    </div>
  );
}
