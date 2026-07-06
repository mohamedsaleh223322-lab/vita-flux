import { useEffect, useMemo, useState } from 'react';
import {
  Droplets,
  Clock,
  TrendingUp,
  ShieldCheck,
  Brain,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Scale,
  Truck,
} from 'lucide-react';
import ForecastHeader from '../components/forecast/ForecastHeader.jsx';
import DateRangeFilterCard from '../components/forecast/DateRangeFilterCard.jsx';
import { fetchPrediction } from '../api/predictionClient.js';

// ─── Blood group visual helpers (UI only — no data logic) ────────────────────
const BLOOD_GROUP_STYLES = {
  'A+':  'bg-[#FEE2E2] text-[#DC2626]',
  'A-':  'bg-[#DCFCE7] text-[#16A34A]',
  'B+':  'bg-[#CCFBF1] text-[#0D9488]',
  'B-':  'bg-[#DBEAFE] text-[#3B82F6]',
  'AB+': 'bg-[#EDE9FE] text-[#7C3AED]',
  'AB-': 'bg-[#FCE7F3] text-[#DB2777]',
  'O+':  'bg-[#CFFAFE] text-[#0891B2]',
  'O-':  'bg-[#F0FDF4] text-[#166534]',
};

const DAYS_LEFT_COLORS = {
  'Critical':  'text-[#DC2626]',
  'High Risk': 'text-[#F59E0B]',
  'Moderate':  'text-[#D97706]',
  'Safe':      'text-[#16A34A]',
  'Low Risk':  'text-[#16A34A]',
  'Unknown':   'text-[#6B7280]',
};

const getRiskColor = (riskLevel) => DAYS_LEFT_COLORS[riskLevel] ?? 'text-[#6B7280]';

// ─── Default date helpers ─────────────────────────────────────────────────────
function todayString() {
  return new Date().toISOString().split('T')[0];
}

function plusDaysString(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ─── Reusable UI components (unchanged visual appearance) ─────────────────────
function BloodGroupPill({ type }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${BLOOD_GROUP_STYLES[type]}`}>
      {type}
    </span>
  );
}

function Panel({ title, subtitle, children, footer, className = '' }) {
  return (
    <article className={`rounded-[12px] border border-[#F1F5F9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col ${className}`}>
      <div className="mb-3">
        <h2 className="text-[15px] font-bold text-[#111]">{title}</h2>
        {subtitle ? <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{subtitle}</p> : null}
      </div>
      <div className="flex-1">
        {children}
      </div>
      {footer}
    </article>
  );
}

function KpiCard({ label, value, subLabel, icon: Icon, bg, iconColor, valueColor = 'text-[#111]' }) {
  return (
    <div className="rounded-[12px] border border-[#F1F5F9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#6B7280]">{label}</p>
          <p className={`text-[28px] font-bold ${valueColor}`}>{value}</p>
          <p className="text-[11px] font-medium text-[#9CA3AF]">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ title, subtitle, items, footer, bg, textColor, icon: Icon }) {
  if (!title || !Icon) return null;
  const safeItems = items ?? [];
  return (
    <div className={`rounded-[12px] ${bg} p-4 flex flex-col h-full`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${textColor}`} />
        <h3 className={`text-[15px] font-bold ${textColor}`}>{title}</h3>
      </div>
      {subtitle ? <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">{subtitle}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 flex-1">
        {safeItems.map((i) => (
          <BloodGroupPill key={i} type={i} />
        ))}
        {safeItems.length === 0 && (
          <span className="text-[12px] font-medium text-[#9CA3AF]">None</span>
        )}
      </div>
      {footer ? <p className="mt-3 text-[12px] font-medium text-[#6B7280] pt-2 border-t border-white/30">{footer}</p> : null}
    </div>
  );
}

function InsightRow({ icon, textBefore, textBold, textAfter }) {
  const icons = {
    trend: { Icon: TrendingUp, bg: 'bg-[#DCFCE7]', color: 'text-[#16A34A]' },
    clock: { Icon: Clock, bg: 'bg-[#FEF3C7]', color: 'text-[#F59E0B]' },
    drop: { Icon: Droplets, bg: 'bg-[#DBEAFE]', color: 'text-[#3B82F6]' },
    truck: { Icon: Truck, bg: 'bg-[#DBEAFE]', color: 'text-[#3B82F6]' },
  };
  const iconConfig = icons[icon] ?? icons.trend;
  const { Icon, bg, color } = iconConfig;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} strokeWidth={2} />
      </div>
      <p className="text-[13px] font-medium text-[#374151] leading-tight">
        {textBefore ?? ''}
        <span className="font-semibold text-[#111]">{textBold ?? ''}</span>
        {textAfter ?? ''}
      </p>
    </div>
  );
}

// ─── Invalid-date warning banner ──────────────────────────────────────────────
function InvalidRangeBanner({ message }) {
  return (
    <div className="rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 flex items-start gap-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" />
      <div>
        <p className="text-[14px] font-bold text-[#92400E]">Invalid Date Range</p>
        <p className="mt-0.5 text-[13px] font-medium text-[#92400E]">{message}</p>
      </div>
    </div>
  );
}

// ─── KPI skeleton loader ──────────────────────────────────────────────────────
function KpiSkeleton({ count }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="rounded-[12px] border border-[#F1F5F9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-[#F3F4F6]" />
        <div className="space-y-1">
          <div className="h-2.5 w-20 rounded bg-[#F3F4F6]" />
          <div className="h-7 w-12 rounded bg-[#F3F4F6]" />
          <div className="h-2 w-16 rounded bg-[#F3F4F6]" />
        </div>
      </div>
    </div>
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function SmartForecastPage() {
  const [showFilters, setShowFilters] = useState(true);
  // Default: today → today + 30 days (always a valid future range)
  const [fromDate, setFromDate] = useState(() => todayString());
  const [toDate,   setToDate]   = useState(() => plusDaysString(30));

  const [loading,      setLoading]      = useState(true);
  const [applying,     setApplying]     = useState(false);
  const [data,         setData]         = useState(null);
  const [error,        setError]        = useState(null);
  // Set when backend returns 400 with a date-validation message
  const [invalidRange, setInvalidRange] = useState(null);

  const maxDemandUnits = useMemo(() => {
    if (!data?.demand) return 1;
    return Math.max(...data.demand.map(d => d.units), 1);
  }, [data]);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  async function loadPrediction() {
    setError(null);
    setInvalidRange(null);
    setLoading(true);
    try {
      const payload = await fetchPrediction(fromDate, toDate);
      setData(payload);
    } catch (err) {
      // 400 with isPastDate flag → show dedicated warning, hide cards
      if (err.status === 400 && err.body?.isPastDate) {
        setInvalidRange(err.body.message);
        setData(null);
      } else if (err.status === 400) {
        setInvalidRange(err.body?.message ?? err.message);
        setData(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load prediction.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyRange() {
    setApplying(true);
    try {
      await loadPrediction();
    } finally {
      setApplying(false);
    }
  }

  function clearRange() {
    setFromDate(todayString());
    setToDate(plusDaysString(30));
    setData(null);
    setError(null);
    setInvalidRange(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="-m-8 min-h-full bg-[#F3F4F6] p-4 font-sans sm:p-6">
      <div className="w-full space-y-4">
        <ForecastHeader
          title="Prediction & Intelligence"
          subtitle="AI-powered predictions based on your real data"
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(v => !v)}
        />

        <DateRangeFilterCard
          open={showFilters}
          fromDate={fromDate}
          toDate={toDate}
          onFromDate={setFromDate}
          onToDate={setToDate}
          onClear={clearRange}
          onApply={applyRange}
          applying={applying}
          onToggleFilters={() => setShowFilters(v => !v)}
        />

        {/* General error (server/network error) */}
        {error && (
          <div className="rounded-[12px] border border-[#FEE2E2] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Invalid date range warning — hides all prediction cards */}
        {invalidRange && !loading && (
          <InvalidRangeBanner message={invalidRange} />
        )}

        {/* Only render prediction cards when range is valid */}
        {!invalidRange && (
          <>
            {/* ── KPI Row ─────────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5" aria-label="KPI summary">
              {loading ? (
                <KpiSkeleton count={5} />
              ) : (
                <>
                  <KpiCard
                    label="Will Run Out"
                    value={data?.kpis?.willRunOut ?? 0}
                    subLabel="Within selected period"
                    icon={Droplets}
                    bg="bg-[#FEE2E2]"
                    iconColor="text-[#DC2626]"
                  />
                  <KpiCard
                    label="May Expire"
                    value={data?.kpis?.mayExpire ?? 0}
                    subLabel="Within selected period"
                    icon={Clock}
                    bg="bg-[#FEF3C7]"
                    iconColor="text-[#F59E0B]"
                    valueColor="text-[#F59E0B]"
                  />
                  <KpiCard
                    label="Total Demand"
                    value={data?.kpis?.totalDemand ?? 0}
                    subLabel={`Until ${data?.dateInfo?.futureEnd ?? '—'}`}
                    icon={TrendingUp}
                    bg="bg-[#DBEAFE]"
                    iconColor="text-[#3B82F6]"
                    valueColor="text-[#3B82F6]"
                  />
                  <KpiCard
                    label="Health Score"
                    value={`${data?.kpis?.healthScore ?? 0}%`}
                    subLabel={data?.kpis?.healthLabel ?? '—'}
                    icon={ShieldCheck}
                    bg="bg-[#DCFCE7]"
                    iconColor="text-[#16A34A]"
                    valueColor="text-[#16A34A]"
                  />
                  <KpiCard
                    label="AI Confidence"
                    value={`${data?.kpis?.aiConfidence ?? 0}%`}
                    subLabel={data?.kpis?.aiLabel ?? '—'}
                    icon={Brain}
                    bg="bg-[#EDE9FE]"
                    iconColor="text-[#7C3AED]"
                    valueColor="text-[#7C3AED]"
                  />
                </>
              )}
            </section>

            {/* ── Three Panels ─────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Predictions">

              {/* Panel 1 — Runout Prediction */}
              <Panel
                title="Runout Prediction"
                subtitle="Estimated days left based on average daily usage"
                footer={
                  !loading && data?.kpis?.willRunOut ? (
                    <div className="mt-3 flex items-start gap-2 rounded-r-[8px] border-l-4 border-[#DC2626] bg-[#FEE2F2] px-3 py-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-[#DC2626]" />
                      <p className="text-sm font-medium text-[#DC2626]">
                        {data.kpis.willRunOut} blood group{data.kpis.willRunOut > 1 ? 's' : ''} will run out.
                      </p>
                    </div>
                  ) : null
                }
              >
                {loading ? (
                  <div className="h-full animate-pulse rounded-[12px] bg-[#F3F4F6]" />
                ) : (
                  <div className="overflow-x-auto rounded-[12px] border border-[#F1F5F9]">
                    <table className="w-full min-w-full divide-y divide-[#F1F5F9] text-[12px]">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Blood Group</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Stock</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Usage</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Days Left</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {(data?.runout ?? []).map((r, idx) => (
                          <tr key={r.bloodGroup} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                            <td className="whitespace-nowrap px-3 py-2"><BloodGroupPill type={r.bloodGroup} /></td>
                            <td className="whitespace-nowrap px-3 py-2 text-[#374151]">{r.currentStock}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-[#374151]">{r.avgDailyUsage}</td>
                            <td className={`whitespace-nowrap px-3 py-2 font-semibold ${getRiskColor(r.riskLevel)}`}>{r.daysLeft}</td>
                            <td className={`whitespace-nowrap px-3 py-2 font-semibold ${getRiskColor(r.riskLevel)}`}>{r.riskLevel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              {/* Panel 2 — Expiry Prediction */}
              <Panel
                title="Expiry Prediction"
                subtitle={`Bags expiring between ${fromDate} and ${toDate}`}
                footer={
                  <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
                    <Info className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                    <p className="text-[12px] font-medium text-[#92400E]">
                      Use these bags first to avoid waste.
                    </p>
                  </div>
                }
              >
                {loading ? (
                  <div className="h-full animate-pulse rounded-[12px] bg-[#F3F4F6]" />
                ) : (
                  <div className="space-y-3 flex flex-col h-full">
                    {/* Expiry Timeline & Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] p-3">
                        <p className="text-[11px] font-medium text-[#92400E]">Total at Risk</p>
                        <p className="text-[24px] font-bold text-[#F59E0B]">
                          {data?.expiry?.summary?.count ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[10px] border border-[#DCFCE7] bg-[#F0FDF4] p-3">
                        <p className="text-[11px] font-medium text-[#166534]">Groups Affected</p>
                        <p className="text-[24px] font-bold text-[#16A34A]">
                          {data?.expiry?.items?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Risk Level Indicator */}
                    <div className="rounded-[10px] border border-[#F1F5F9] bg-[#F9FAFB] p-3">
                      <p className="text-[11px] font-medium text-[#6B7280] mb-2">Risk Distribution</p>
                      <div className="flex gap-1 h-2 mb-2">
                        <div className="flex-1 rounded-l bg-[#DC2626]" style={{ width: '30%' }} />
                        <div className="flex-1 bg-[#F59E0B]" style={{ width: '40%' }} />
                        <div className="flex-1 rounded-r bg-[#16A34A]" style={{ width: '30%' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6B7280]">
                        <span>Critical</span>
                        <span>High</span>
                        <span>Safe</span>
                      </div>
                    </div>

                    {data?.expiry?.items && data.expiry.items.length > 0 ? (
                      <div className="overflow-hidden rounded-[12px] border border-[#F1F5F9] flex-1">
                        <table className="w-full divide-y divide-[#F1F5F9] text-[12px]">
                          <thead className="bg-[#F9FAFB]">
                            <tr>
                              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Group</th>
                              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Bags</th>
                              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Earliest</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {data.expiry.items.map((r, idx) => (
                              <tr key={r.bloodGroup} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                                <td className="whitespace-nowrap px-3 py-2"><BloodGroupPill type={r.bloodGroup} /></td>
                                <td className="whitespace-nowrap px-3 py-2 text-[#374151]">{r.bags}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-[#374151]">{r.earliestExpiry}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100 flex-1">
                        <Clock className="h-7 w-7 text-gray-300 mb-1.5" />
                        <p className="text-xs font-semibold text-gray-500">No bags expiring during selected period.</p>
                      </div>
                    )}
                  </div>
                )}
              </Panel>

              {/* Panel 3 — Demand Forecast */}
              <Panel
                title="Demand Forecast"
                subtitle={`Predicted demand for next ${data?.dateInfo?.daysInPeriod ?? 0} days`}
                footer={
                  <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2">
                    <Info className="mt-0.5 h-4 w-4 text-[#3B82F6]" />
                    <p className="text-[12px] font-medium text-[#3B82F6]">
                      Based on 30-day average usage.
                    </p>
                  </div>
                }
              >
                {loading ? (
                  <div className="h-full animate-pulse rounded-[12px] bg-[#F3F4F6]" />
                ) : data?.demand && data.demand.some(d => d.units > 0) ? (
                  <div className="space-y-2">
                    {(data?.demand ?? []).map((d) => (
                      <div key={d.bloodGroup} className="flex items-center gap-3">
                        <div className="w-10 flex-shrink-0">
                          <BloodGroupPill type={d.bloodGroup} />
                        </div>
                        <div className="flex-1 h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${maxDemandUnits > 0 ? (d.units / maxDemandUnits) * 100 : 0}%`,
                              backgroundColor: d.fill,
                            }}
                          />
                        </div>
                        <div className="w-12 text-right">
                          <span className="text-[12px] font-medium text-[#374151]">{d.units}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100">
                    <TrendingUp className="h-7 w-7 text-gray-300 mb-1.5" />
                    <p className="text-xs font-semibold text-gray-500">No consumption history found.</p>
                  </div>
                )}
              </Panel>
            </section>

            {/* ── Recommendations + Insights ────────────────────────────────── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[72%_28%]" aria-label="Recommendations and insights">

              {/* Smart Recommendations */}
              <article className="rounded-[12px] border border-[#F1F5F9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <h2 className="text-[15px] font-bold text-[#111]">Smart Recommendations</h2>
                <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                  AI suggestions based on predictions
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-48 animate-pulse rounded-[12px] bg-[#F3F4F6]" />
                    ))
                  ) : (
                    <>
                      <RecommendationCard
                        title="Increase Collection"
                        subtitle={data?.recommendations?.increase?.subtitle}
                        items={data?.recommendations?.increase?.items}
                        footer={data?.recommendations?.increase?.footer}
                        bg="bg-[#FFF1F2]"
                        textColor="text-[#DC2626]"
                        icon={ArrowUp}
                      />
                      <RecommendationCard
                        title="Reduce Collection"
                        subtitle={data?.recommendations?.reduce?.subtitle}
                        items={data?.recommendations?.reduce?.items}
                        footer={data?.recommendations?.reduce?.footer}
                        bg="bg-[#FFFBEB]"
                        textColor="text-[#F59E0B]"
                        icon={ArrowDown}
                      />
                      <RecommendationCard
                        title="Maintain Balance"
                        subtitle={data?.recommendations?.maintain?.subtitle}
                        items={data?.recommendations?.maintain?.items}
                        footer={data?.recommendations?.maintain?.footer}
                        bg="bg-[#F0FDF4]"
                        textColor="text-[#16A34A]"
                        icon={Scale}
                      />
                    </>
                  )}
                </div>
              </article>

              {/* Key Insights */}
              <article className="rounded-[12px] border border-[#F1F5F9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col h-full">
                <h2 className="text-[15px] font-bold text-[#111]">Key Insights</h2>
                <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                  Important takeaways for this period
                </p>
                <div className="mt-3 divide-y divide-[#F3F4F6] flex-1">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="py-2.5 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-[#F3F4F6] animate-pulse" />
                        <div className="h-4.5 w-full rounded bg-[#F3F4F6] animate-pulse" />
                      </div>
                    ))
                  ) : (
                    (data?.insights ?? []).map((ins, idx) => (
                      <InsightRow
                        key={idx}
                        icon={ins.icon}
                        textBefore={ins.textBefore}
                        textBold={ins.textBold}
                        textAfter={ins.textAfter}
                      />
                    ))
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
