import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deleteRequest, getRequests, updateRequestStatus } from '../api/requestsClient.js';
import RequestsPageHeader from '../components/requests/RequestsPageHeader.jsx';
import RequestStatusBadge from '../components/requests/RequestStatusBadge.jsx';
import RequestTypeBadge from '../components/requests/RequestTypeBadge.jsx';
import RequestRowActions from '../components/requests/RequestRowActions.jsx';
import RequestsPagination from '../components/requests/RequestsPagination.jsx';
import ToastMessage from '../components/manage-inventory/ToastMessage.jsx';

const LIMIT = 10;

export default function RequestsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('type') === 'received' ? 'received' : 'sent';
  const pageFromUrl = Math.max(1, Number(searchParams.get('page')) || 1);

  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const filterStatus = searchParams.get('status') || '';
  const filterBlood = searchParams.get('bloodType') || '';
  const filterHospital = searchParams.get('hospital') || '';
  const filterGov = searchParams.get('governorate') || '';
  const filterFrom = searchParams.get('fromDate') || '';
  const filterTo = searchParams.get('toDate') || '';

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setActiveTab(tabFromUrl);
    setCurrentPage(pageFromUrl);
  }, [tabFromUrl, pageFromUrl]);

  const queryKey = useMemo(
    () =>
      [
        activeTab,
        currentPage,
        filterStatus,
        filterBlood,
        filterHospital,
        filterGov,
        filterFrom,
        filterTo,
      ].join('|'),
    [
      activeTab,
      currentPage,
      filterStatus,
      filterBlood,
      filterHospital,
      filterGov,
      filterFrom,
      filterTo,
    ],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        type: activeTab,
        page: currentPage,
        limit: LIMIT,
      };
      if (filterStatus) query.status = filterStatus;
      if (filterBlood) query.bloodType = filterBlood;
      if (filterHospital) query.hospital = filterHospital;
      if (filterGov) query.governorate = filterGov;
      if (filterFrom) query.fromDate = filterFrom;
      if (filterTo) query.toDate = filterTo;

      const res = await getRequests(query);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Failed to load requests',
      });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    currentPage,
    filterBlood,
    filterFrom,
    filterGov,
    filterHospital,
    filterStatus,
    filterTo,
  ]);

  useEffect(() => {
    load();
  }, [queryKey, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function writeUrl(tab, page) {
    const next = new URLSearchParams(searchParams);
    next.set('type', tab);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function handleTab(tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setCurrentPage(1);
    writeUrl(tab, 1);
  }

  function handlePageChange(page) {
    if (page === currentPage || page < 1 || page > totalPages) return;
    setCurrentPage(page);
    writeUrl(activeTab, page);
  }

  async function patchStatus(id, status) {
    setActionLoadingId(id);
    try {
      const updated = await updateRequestStatus(id, status);
      const nextStatus = updated?.status || status;
      setItems((rows) => rows.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
      setToast({ variant: 'success', message: `Request updated to ${nextStatus.toLowerCase()}.` });
    } catch (e) {
      setToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Update failed',
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function removeRow(id) {
    setActionLoadingId(id);
    try {
      await deleteRequest(id);
      setItems((rows) => rows.filter((r) => r.id !== id));
      setTotal((n) => Math.max(0, n - 1));
      setToast({ variant: 'success', message: 'Request deleted.' });
    } catch (e) {
      setToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Delete failed',
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {toast ? <ToastMessage variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <RequestsPageHeader
        title="Requests"
        subtitle="Manage blood requests - incoming and outgoing"
        backTo="/requests"
        backLabel="Back"
      />

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8" aria-label="Request tabs">
          <button
            type="button"
            onClick={() => handleTab('sent')}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === 'sent'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Sent Requests
          </button>
          <button
            type="button"
            onClick={() => handleTab('received')}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === 'received'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Received Requests
          </button>
        </nav>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Type', 'Hospital', 'Governorate', 'Blood Type', 'Quantity (Bags)', 'Status', 'Date', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                    No requests found.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span 
                        title={row.id} 
                        className="font-mono text-sm text-gray-600"
                      >
                        #{String(row.id).slice(0, 8)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <RequestTypeBadge type={row.type} />
                    </td>
                    <td className="px-4 py-3 text-gray-800">{row.hospital}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.governorate}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-red-600">{row.bloodType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-800">{row.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <RequestStatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.date}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <RequestRowActions
                        requestId={row.id}
                        detailState={row}
                        busy={actionLoadingId === row.id}
                        onApprove={() => patchStatus(row.id, 'APPROVED')}
                        onReject={() => patchStatus(row.id, 'REJECTED')}
                        onComplete={() => patchStatus(row.id, 'COMPLETED')}
                        onDelete={() => removeRow(row.id)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <RequestsPagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}
