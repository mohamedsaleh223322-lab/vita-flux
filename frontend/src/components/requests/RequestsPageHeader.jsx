import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function RequestsPageHeader({
  title,
  subtitle,
  backTo = null,
  backLabel = 'Back',
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-500 md:text-base">{subtitle}</p> : null}
      </div>
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {backLabel}
        </Link>
      ) : null}
    </div>
  );
}
