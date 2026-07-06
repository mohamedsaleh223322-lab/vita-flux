import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, List, Plus } from 'lucide-react';
import { getRequestFilters, getRequests } from '../api/requestsClient.js';
import RequestsPageHeader from '../components/requests/RequestsPageHeader.jsx';
import RequestsSelect, { RequestsDateField } from '../components/requests/RequestsFormControls.jsx';
import ToastMessage from '../components/manage-inventory/ToastMessage.jsx';

const initialFilters = {
  requestType: '',
  status: '',
  bloodType: '',
  hospital: '',
  governorate: '',
  fromDate: '',
  toDate: '',
};

export default function RequestsLandingPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [options, setOptions] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [matchCount, setMatchCount] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFilters(true);
      setError(null);
      try {
        const data = await getRequestFilters();
        if (!cancelled) setOptions(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load filters');
          setOptions({
            bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            statuses: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'],
            requestTypes: [
              { value: 'sent', label: 'Outgoing' },
              { value: 'received', label: 'Incoming' }
            ],
            governorates: [],
            hospitals: []
          });
        }
      } finally {
        if (!cancelled) setLoadingFilters(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const queryParams = useMemo(() => {
    const q = {};
    if (filters.requestType) q.type = filters.requestType;
    if (filters.status) q.status = filters.status;
    if (filters.bloodType) q.bloodType = filters.bloodType;
    if (filters.hospital) q.hospital = filters.hospital;
    if (filters.governorate) q.governorate = filters.governorate;
    if (filters.fromDate) q.fromDate = filters.fromDate;
    if (filters.toDate) q.toDate = filters.toDate;
    q.page = 1;
    q.limit = 500;
    return q;
  }, [filters]);

  const applyFilters = useCallback(async () => {
    setLoadingRequests(true);
    setError(null);
    try {
      const { total } = await getRequests(queryParams);
      setMatchCount(total);
      setFilterApplied(true);
      setToast({ variant: 'success', message: 'Filters applied.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch requests');
      setToast({ variant: 'error', message: 'Could not apply filters.' });
    } finally {
      setLoadingRequests(false);
    }
  }, [queryParams]);

  const resetFilters = () => {
    setFilters({ ...initialFilters });
    setFilterApplied(false);
    setMatchCount(null);
    setToast({ variant: 'success', message: 'Filters reset.' });
  };

  const listHref = useMemo(() => {
    const q = new URLSearchParams();
    if (filters.requestType) q.set('type', filters.requestType);
    else q.set('type', 'sent');
    if (filters.status) q.set('status', filters.status);
    if (filters.bloodType) q.set('bloodType', filters.bloodType);
    if (filters.hospital) q.set('hospital', filters.hospital);
    if (filters.governorate) q.set('governorate', filters.governorate);
    if (filters.fromDate) q.set('fromDate', filters.fromDate);
    if (filters.toDate) q.set('toDate', filters.toDate);
    const s = q.toString();
    return s ? `/requests/list?${s}` : '/requests/list';
  }, [filters]);

  const statusOptions = useMemo(() => {
    const raw = options?.statuses ?? [];
    return raw.map((s) => ({
      value: typeof s === 'string' ? s : s.value,
      label:
        typeof s === 'string'
          ? s.charAt(0).toUpperCase() + s.slice(1)
          : s.label ?? String(s.value),
    }));
  }, [options]);

  return (
    <div className="w-full space-y-8">
      {toast ? <ToastMessage variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <RequestsPageHeader
        title="Requests"
        subtitle="Manage blood requests - incoming and outgoing"
      />

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Filter</h2>
        {loadingFilters ? (
          <div className="grid animate-pulse gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100" />
            ))}
            <div className="h-16 rounded-lg bg-gray-100 md:col-span-2" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <RequestsSelect
                label="Request Type"
                value={filters.requestType}
                onChange={(v) => setFilters((f) => ({ ...f, requestType: v }))}
                options={options?.requestTypes ?? []}
                getValue={(o) => o.value}
                getLabel={(o) => o.label}
              />
              <RequestsSelect
                label="Status"
                value={filters.status}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                options={statusOptions}
              />
              <RequestsSelect
                label="Blood Type"
                value={filters.bloodType}
                onChange={(v) => setFilters((f) => ({ ...f, bloodType: v }))}
                options={(options?.bloodTypes ?? []).map((b) => ({ value: b, label: b }))}
                getValue={(o) => o.value}
                getLabel={(o) => o.label}
              />
              <RequestsSelect
                label="Hospital"
                value={filters.hospital}
                onChange={(v) => setFilters((f) => ({ ...f, hospital: v }))}
                options={options?.hospitals ?? []}
                getValue={(o) => String(o.id)}
                getLabel={(o) => o.name}
              />
              <RequestsSelect
                label="Governorate"
                value={filters.governorate}
                onChange={(v) => setFilters((f) => ({ ...f, governorate: v }))}
                options={options?.governorates ?? []}
                getValue={(o) => String(o.id)}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <RequestsDateField
                label="From Date"
                value={filters.fromDate}
                onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))}
              />
              <RequestsDateField
                label="To Date"
                value={filters.toDate}
                onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={applyFilters}
                disabled={loadingRequests}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Filter className="h-4 w-4" />
                {loadingRequests ? 'Applying…' : 'Apply Filters'}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {filterApplied && matchCount !== null && !loadingRequests ? (
          <p className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{matchCount}</span> request
            {matchCount === 1 ? '' : 's'} match your filters.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">What would you like to do?</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            to="/requests/new"
            className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-red-700 p-6 text-white shadow-md transition hover:shadow-lg"
          >
            <div>
              <h3 className="text-xl font-bold">New Request</h3>
              <p className="mt-1 text-sm text-red-100">Create a new blood request</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition group-hover:scale-105">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </span>
          </Link>

          <Link
            to={listHref}
            className="group relative flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm transition hover:shadow-md"
          >
            <div>
              <h3 className="text-xl font-bold text-red-700">View Requests</h3>
              <p className="mt-1 text-sm text-red-900/70">View sent &amp; received requests</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition group-hover:scale-105">
              <List className="h-6 w-6" strokeWidth={2.5} />
            </span>
          </Link>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate(listHref)}
            className="text-sm font-medium text-red-600 underline-offset-2 hover:underline"
          >
            Open requests table with current filters
          </button>
        </div>
      </section>
    </div>
  );
}
