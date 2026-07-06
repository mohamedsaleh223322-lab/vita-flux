import { useEffect, useState, useMemo, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { apiFetch } from '../api/apiFetch.js';

// Safe icon resolutions to prevent any possible version incompatibility crashes
const Droplet = Lucide.Droplet || (() => null);
const AlertTriangle = Lucide.AlertTriangle || (() => null);
const CheckCircle = Lucide.CheckCircle || Lucide.CheckCircle2 || (() => null);
const Search = Lucide.Search || (() => null);
const X = Lucide.X || (() => null);
const Hash = Lucide.Hash || (() => null);
const Package = Lucide.Package || (() => null);
const BarChart2 = Lucide.BarChart2 || Lucide.BarChart || (() => null);
const ChevronUp = Lucide.ChevronUp || (() => null);
const ChevronDown = Lucide.ChevronDown || (() => null);
const Loader2 = Lucide.Loader2 || (() => null);
const ServerCrash = Lucide.ServerCrash || (() => null);
const RefreshCw = Lucide.RefreshCw || (() => null);
const Calendar = Lucide.Calendar || (() => null);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getStatus(count) {
  if (count >= 1 && count <= 3) return 'Critical';
  if (count >= 4 && count <= 5) return 'Low Stock';
  if (count >= 6) return 'Healthy';
  return null; // for count ===0
}

function getBloodGroupBadgeClass(group) {
  if (!group || typeof group !== 'string') {
    return 'bg-slate-100 text-slate-500 border-slate-200';
  }
  const g = group.replace(/[+-]/g, '');
  if (group.startsWith('A')) {
    return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
  } else if (group.startsWith('B')) {
    return 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]';
  } else if (group.startsWith('O')) {
    return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  } else { // AB
    return 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]';
  }
}

function getStockStatusBadgeClass(status) {
  switch (status) {
    case 'Healthy':
      return 'bg-[#D1FAE5] text-[#065F46]';
    case 'Low Stock':
      return 'bg-[#FEF3C7] text-[#92400E]';
    case 'Critical':
      return 'bg-[#FEE2E2] text-[#991B1B]';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function BloodInventory() {
  // Required states
  const [bloodData, setBloodData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortColumn, setSortColumn] = useState('bloodId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [groupTotals, setGroupTotals] = useState({}); // Stores total units per blood group

  // Technical UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeAgoText, setTimeAgoText] = useState('Just now');

  // Fetch from live database API
  const fetchInventory = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const data = await apiFetch('/api/inventory/summary');
      const list = data.inventory ?? [];

      // Calculate number of BAGS per blood type
      const gt = {};
      list.forEach(item => {
        if (!gt[item.blood_type]) gt[item.blood_type] = 0;
        gt[item.blood_type] += 1; // each item is one bag!
      });
      setGroupTotals(gt);

      // Each item is one physical blood bag — use real batch_code as Blood ID
      const mapped = list.map((item) => {
        return {
          bloodId:      item.batch_code || '—',   // BB-YYYY-XXXXXX from DB
          bloodGroup:   item.blood_type,
          unitsInStock: Number(item.units_in_stock),
          stockStatus:  getStatus(gt[item.blood_type] || 0), // Use group bag count for status
          expiryDate:   item.expiry_date || '—',
        };
      });

      setBloodData(mapped);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('BloodInventory load error:', err);
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  // Poll database every 15-30s
  useEffect(() => {
    fetchInventory();
    const intervalId = setInterval(() => fetchInventory(), 30000);
    return () => clearInterval(intervalId);
  }, [fetchInventory]);

  // Handle "Just now" / last updated time text refresh
  useEffect(() => {
    const updateTimeText = () => {
      const diffMs = Date.now() - lastUpdated.getTime();
      if (diffMs < 60000) {
        setTimeAgoText('Just now');
      } else {
        const minutes = Math.floor(diffMs / 60000);
        setTimeAgoText(`${minutes}m ago`);
      }
    };
    updateTimeText();
    const intervalId = setInterval(updateTimeText, 10000);
    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, groupFilter, statusFilter]);

  // ─── DERIVED VALUES (useMemo) ────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    let result = [...bloodData];

    // Search query filter (Blood ID - Case insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.bloodId.toLowerCase().includes(q));
    }

    // Blood Group filter
    if (groupFilter !== 'All Groups') {
      result = result.filter(item => item.bloodGroup === groupFilter);
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      result = result.filter(item => item.stockStatus === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bloodData, searchQuery, groupFilter, statusFilter, sortColumn, sortDirection]);

  // Auto-calculated summary cards from live full inventory data
  const summary = useMemo(() => {
    // TOTAL UNITS: sum of all individual bags (count of bloodData)
    const totalUnits = bloodData.length;

    // Count blood types per category
    let lowStock = 0, critical = 0, healthy = 0;
    Object.entries(groupTotals).forEach(([bloodType, count]) => {
      const status = getStatus(count);
      if (status === 'Critical') critical++;
      else if (status === 'Low Stock') lowStock++;
      else if (status === 'Healthy') healthy++;
      // count 0 is ignored
    });

    return { totalUnits, lowStock, critical, healthy };
  }, [bloodData, groupTotals]);

  // Paginated rows (8 per page)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * 8;
    return filteredData.slice(start, start + 8);
  }, [filteredData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / 8));

  // Toggle sort direction
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchInventory();
  };

  return (
    <div className="w-full min-h-full space-y-6 font-sans" style={{ padding: '24px', maxWidth: 'none' }}>
      
      {/* ─── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#111827] leading-none">
            Current Blood Inventory
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
            Real-time availability of blood in stock
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3.5 py-1.5 shadow-sm text-[13px] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            Last updated:&nbsp;
            <span className="font-semibold text-slate-700 tabular-nums">
              {timeAgoText}
            </span>
          </div>

          <button
            onClick={() => fetchInventory(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center" style={{ marginBottom: '20px' }}>
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Blood ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            style={{ padding: '10px 12px 10px 36px', height: '42px' }}
          />
        </div>

        {/* Blood Group dropdown */}
        <div className="relative shrink-0">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="appearance-none bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer transition-colors"
            style={{ padding: '10px 32px 10px 12px', height: '42px', minWidth: '150px' }}
          >
            <option>All Groups</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>O+</option>
            <option>O-</option>
            <option>AB+</option>
            <option>AB-</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Status dropdown */}
        <div className="relative shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer transition-colors"
            style={{ padding: '10px 32px 10px 12px', height: '42px', minWidth: '150px' }}
          >
            <option>All Status</option>
            <option>Healthy</option>
            <option>Low Stock</option>
            <option>Critical</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ─── SUMMARY CARDS ROW ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" style={{ marginBottom: '28px' }}>
        
        {/* TOTAL UNITS CARD */}
        <div className="flex justify-between items-center bg-[#FFFFFF] rounded-xl p-5 border border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:border-slate-200 transition-all duration-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]" style={{ letterSpacing: '.05em' }}>
              Total Units
            </p>
            <p className="mt-1 text-3xl font-bold text-[#111827]">
              {loading ? '—' : summary.totalUnits}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] shrink-0">
            <Droplet className="h-5 w-5 text-[#3B82F6]" strokeWidth={2.5} />
          </div>
        </div>

        {/* LOW STOCK CARD */}
        <div className="flex justify-between items-center bg-[#FFFFFF] rounded-xl p-5 border border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:border-slate-200 transition-all duration-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]" style={{ letterSpacing: '.05em' }}>
              Low Stock
            </p>
            <p className="mt-1 text-3xl font-bold text-[#F59E0B]">
              {loading ? '—' : summary.lowStock}
            </p>
            {!loading && (
              <p className="text-[11px] font-semibold text-[#9CA3AF]">
                {summary.lowStock === 1 ? 'Type' : 'Types'}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFBEB] shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#F59E0B]" strokeWidth={2.5} />
          </div>
        </div>

        {/* CRITICAL CARD */}
        <div className="flex justify-between items-center bg-[#FFFFFF] rounded-xl p-5 border border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:border-slate-200 transition-all duration-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]" style={{ letterSpacing: '.05em' }}>
              Critical
            </p>
            <p className="mt-1 text-3xl font-bold text-[#EF4444]">
              {loading ? '—' : summary.critical}
            </p>
            {!loading && (
              <p className="text-[11px] font-semibold text-[#9CA3AF]">
                {summary.critical === 1 ? 'Type' : 'Types'}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2] shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" strokeWidth={2.5} />
          </div>
        </div>

        {/* HEALTHY CARD */}
        <div className="flex justify-between items-center bg-[#FFFFFF] rounded-xl p-5 border border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:border-slate-200 transition-all duration-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]" style={{ letterSpacing: '.05em' }}>
              Healthy
            </p>
            <p className="mt-1 text-3xl font-bold text-[#10B981]">
              {loading ? '—' : summary.healthy}
            </p>
            {!loading && (
              <p className="text-[11px] font-semibold text-[#9CA3AF]">
                {summary.healthy === 1 ? 'Type' : 'Types'}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] shrink-0">
            <CheckCircle className="h-5 w-5 text-[#10B981]" strokeWidth={2.5} />
          </div>
        </div>

      </div>

      {/* ─── DATA TABLE CONTAINER ────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {error && !loading ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <ServerCrash className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Failed to load inventory</p>
            <p className="max-w-xs text-xs text-slate-400">{error.message || String(error)}</p>
            <button
              onClick={handleRetry}
              className="mt-1 rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" id="inventory-table">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  {/* Blood ID Header */}
                  <th
                    onClick={() => handleSort('bloodId')}
                    className="px-6 py-3.5 cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
                    style={{ width: '30%', letterSpacing: '.06em' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 shrink-0" />
                      Blood ID
                      {sortColumn === 'bloodId' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>

                  {/* Blood Group Header */}
                  <th
                    onClick={() => handleSort('bloodGroup')}
                    className="px-6 py-3.5 cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
                    style={{ width: '25%', letterSpacing: '.06em' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Droplet className="h-3.5 w-3.5 shrink-0" />
                      Blood Group
                      {sortColumn === 'bloodGroup' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>

                  {/* Expiry Date Header */}
                  <th
                    onClick={() => handleSort('expiryDate')}
                    className="px-6 py-3.5 cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
                    style={{ width: '25%', letterSpacing: '.06em' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      Expiry Date
                      {sortColumn === 'expiryDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>

                  {/* Stock Status Header */}
                  <th
                    onClick={() => handleSort('stockStatus')}
                    className="px-6 py-3.5 cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
                    style={{ width: '20%', letterSpacing: '.06em' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                      Stock Status
                      {sortColumn === 'stockStatus' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-12 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-8 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" /></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 relative">
                          <Search className="h-6 w-6 text-[#9CA3AF]" />
                          <X className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-200 p-0.5 font-bold text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No results found</p>
                        <p className="text-xs text-[#9CA3AF] max-w-xs">
                          No blood units found matching your filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={`${row.bloodGroup}-${row.bloodId}-${index}`}
                      className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors duration-150"
                    >
                      {/* Blood ID (component) */}
                      <td className="px-6 py-4 font-medium text-[#374151]" style={{ fontSize: '14px' }}>
                        {row.bloodId}
                      </td>

                      {/* Blood Group */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold border ${getBloodGroupBadgeClass(row.bloodGroup)}`}
                        >
                          {row.bloodGroup}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4 font-bold text-[#374151] tabular-nums" style={{ fontSize: '14px' }}>
                        {row.expiryDate && row.expiryDate !== '—'
                          ? new Date(row.expiryDate).toLocaleDateString()
                          : '—'}
                      </td>

                      {/* Stock Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStockStatusBadgeClass(row.stockStatus)}`}
                        >
                          {row.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION BAR ────────────────────────────────────────────────── */}
        {!loading && !error && filteredData.length > 0 && (
          <div className="flex justify-between items-center border-t border-[#F0F0F0] bg-white px-6 py-4">
            <div className="text-[13px] text-[#6B7280]">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * 8 + 1}</span>–
              <span className="font-semibold text-slate-700">{Math.min(currentPage * 8, filteredData.length)}</span> of&nbsp;
              <span className="font-semibold text-slate-700">{filteredData.length}</span> results
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:bg-slate-50 hover:border-[#E53E3E] hover:text-[#E53E3E] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E5E7EB] disabled:hover:text-[#374151]"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:bg-slate-50 hover:border-[#E53E3E] hover:text-[#E53E3E] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E5E7EB] disabled:hover:text-[#374151]"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
