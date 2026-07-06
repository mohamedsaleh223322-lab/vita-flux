import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart,
  BarChart2,
  Clock,
  Droplets,
  Flame,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch } from '../api/apiFetch.js';
import DateTimeBox from '../components/layout/DateTimeBox.jsx';


const BLOOD_TYPE_COLORS = {
  'A+': '#BE123C',
  'A-': '#E11D48',
  'B+': '#F43F5E',
  'B-': '#FB7185',
  'O+': '#EC4899',
  'O-': '#F472B6',
  'AB+': '#FDA4AF',
  'AB-': '#FECDD3',
};

function timeAgo(dateVal) {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  const diffMs = new Date() - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function BloodBankDashboard() {
    const [inventory, setInventory] = useState([]);
    const [totalBags, setTotalBags] = useState(0);
    const [addedToday, setAddedToday] = useState(0);
    const [removedToday, setRemovedToday] = useState(0);
    const [averageDailyUsage, setAverageDailyUsage] = useState(0);
    const [topConsumed, setTopConsumed] = useState({ blood_type: '—', total_consumed: 0 });
    const [loading, setLoading] = useState(true);

    // Notifications counts & lists
    const [requestsList, setRequestsList] = useState([]);
    const [requestsCount, setRequestsCount] = useState(0);
    const [inventoryAlertsCount, setInventoryAlertsCount] = useState(0);
    const [fetchingNotifications, setFetchingNotifications] = useState(false);
    
    const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

    // Data loading logic (fetches summary and notifications)
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setFetchingNotifications(true);

            // 1. Fetch Inventory Summary
            const invData = await apiFetch('/api/inventory/summary');
            const byType = invData.byBloodType || [];
            const total = invData.totalUnits || 0;
            const added = invData.addedToday || 0;
            const removed = invData.removedToday || 0;
            const avgDaily = invData.averageDailyUsage || 0;
            const topConsumedData = invData.topConsumed || { blood_type: '—', total_consumed: 0 };

            const inventoryWithColors = byType.map(item => ({
                type: item.bloodType,
                count: item.units,
                percentage: total > 0 ? Math.round((item.units / total) * 100) : 0,
                color: BLOOD_TYPE_COLORS[item.bloodType] || '#94A3B8',
            }));

            setInventory(inventoryWithColors);
            setTotalBags(total);
            setAddedToday(added);
            setRemovedToday(removed);
            setAverageDailyUsage(avgDaily);
            setTopConsumed(topConsumedData);
            
            const critItems = inventoryWithColors.filter(i => i.count >= 1 && i.count <= 5);
            setInventoryAlertsCount(critItems.length);

            // 2. Fetch pending requests
            const reqData = await apiFetch('/api/requests?status=PENDING');
            const rList = reqData.items || [];
            setRequestsList(rList);
            setRequestsCount(reqData.total || rList.length || 0);

            // Mark updated time
            setLastUpdatedTime(new Date());
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
            setFetchingNotifications(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Critical alerts list logic (filtered 1-5 stock units, sorted lowest first)
    const criticalAlerts = useMemo(() => {
        return inventory
            .map(item => ({
                type: item.type,
                stock: item.count
            }))
            .filter(item => item.stock >= 1 && item.stock <= 5)
            .sort((a, b) => a.stock - b.stock);
    }, [inventory]);

    // Recharts donut chart data
    const chartData = useMemo(() => {
        return inventory
            .filter(row => row.count > 0)
            .map((row) => ({
                name: row.type,
                value: row.count,
                fill: row.color
            }));
    }, [inventory]);

    // Badge styling calculations
    const stockBadgeText = criticalAlerts.length > 0 ? 'Critical' : 'Stable';
    const stockBadgeColor = criticalAlerts.length > 0 
        ? 'bg-red-50 text-red-700 border-red-100' 
        : 'bg-emerald-50 text-emerald-700 border-emerald-100';

    const addedPct = totalBags > 0 ? Math.round((addedToday / totalBags) * 100) : 0;
    const removedPct = totalBags > 0 ? Math.round((removedToday / totalBags) * 100) : 0;

    const totalNotifications = requestsCount + inventoryAlertsCount;

    return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Content Wrapper */}
      <div className="space-y-8 w-full">
          {/* Header */}
          <header className="text-left flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Dashboard Overview</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                Real-time overview of your blood inventory and alerts
              </p>
            </div>
            <DateTimeBox />
          </header>

          {/* Top Stats Cards */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key statistics">
            {/* Card 1: Current Stock */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Droplets className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Stock</p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-800 leading-none">{loading ? '—' : totalBags}</h3>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">Total Bags</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${stockBadgeColor}`}>
                    {stockBadgeText}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Added Today */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Plus className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Added Today</p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-800 leading-none">{loading ? '—' : addedToday}</h3>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">Bags Received</span>
                  {addedToday > 0 && (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ↑ {addedPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Removed Today */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Activity className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Removed Today</p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-800 leading-none">{loading ? '—' : removedToday}</h3>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">Bags Dispatched</span>
                  {removedToday > 0 && (
                    <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      ↓ {removedPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Low Stock Alerts */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Alerts</p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-800 leading-none">{loading ? '—' : inventoryAlertsCount}</h3>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">Requires Attention</span>
                  {inventoryAlertsCount > 0 && (
                    <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
                      Critical
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Middle Columns */}
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Distribution */}
            <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 text-left">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800">Current Stock Distribution</h2>
                <p className="text-xs font-medium text-slate-400">Inventory by blood type</p>
              </div>

              <div className="rounded-xl border border-slate-50 bg-[#F8FAFC]/40 p-6">
                <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
                  {/* Recharts Pie */}
                  <div className="relative h-[240px] w-full max-w-[240px] shrink-0">
                    {chartData.length === 0 ? (
                      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No stock data</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip formatter={(value) => [`${value} bags`, 'Count']} contentStyle={{
                              borderRadius: 8,
                              border: '1px solid #F1F5F9',
                              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                            }}/>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="64%" outerRadius="88%" paddingAngle={3} stroke="#fff" strokeWidth={2}>
                              {chartData.map((entry) => (<Cell key={entry.name} fill={entry.fill}/>))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                          <span className="text-3xl font-extrabold text-slate-800 leading-none">{totalBags}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                            Total Bags
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Legend list per blood type with progress bar */}
                  <ul className="flex min-w-0 flex-1 flex-col gap-4 w-full" aria-label="Blood type breakdown">
                    {inventory.filter(row => row.count > 0).map((row) => (
                      <li key={row.type} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden/>
                            <span>{row.type}</span>
                            <span className="font-normal text-slate-400 text-xs">({row.count} {row.count === 1 ? 'bag' : 'bags'})</span>
                          </div>
                          <span className="font-bold text-slate-700">{row.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${row.percentage}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link to="/inventory" className="mt-5 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                View full inventory →
              </Link>
            </article>

            {/* Right: Critical Alerts */}
            <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-left flex flex-col justify-between">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">Critical Alerts</h2>
                <p className="text-xs font-medium text-slate-400">Immediate action required</p>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px] custom-scrollbar pr-1 mt-2">
                {criticalAlerts.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-6 text-center text-sm font-semibold text-emerald-800">
                    ✅ No critical alerts. Stock levels are healthy.
                  </div>
                ) : (
                  criticalAlerts.map(alert => (
                    <div key={alert.type} className="flex items-center justify-between rounded-xl bg-red-50/50 border border-red-100 p-4 transition-all duration-200 hover:bg-red-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <Droplets className="w-6 h-6 fill-red-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-base font-bold text-red-700 leading-tight">{alert.type}</h4>
                          <span className="text-xs text-slate-500 font-medium">Below minimum threshold</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-800 bg-white px-2.5 py-1 rounded-lg border border-red-100 shadow-sm shrink-0">
                        {alert.stock} Bags Left
                      </span>
                    </div>
                  ))
                )}
              </div>

              <Link to="/inventory/alerts" className="mt-6 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors border-t border-slate-50 pt-4">
                View all alerts →
              </Link>
            </article>
          </section>

          {/* Bottom Stats Cards */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Daily summary">
            {/* Card 1: Most Available */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Most Available</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-800 leading-none">
                  {loading ? '—' : inventory.length > 0 ? inventory.reduce((max, r) => r.count > max.count ? r : max, inventory[0]).type : '—'}
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-semibold">Stable Stock</p>
              </div>
            </div>

            {/* Card 2: Average Daily Usage */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Daily Usage</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-800 leading-none">{loading ? '—' : averageDailyUsage}</h3>
                <p className="mt-2 text-xs text-slate-500 font-semibold">Bags / Day</p>
              </div>
            </div>

            {/* Card 3: Top Consumed */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Flame className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Consumed</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-800 leading-none">{loading ? '—' : topConsumed.blood_type}</h3>
                <p className="mt-2 text-xs text-slate-500 font-semibold">{topConsumed.total_consumed} Bags Used</p>
              </div>
            </div>

            {/* Card 4: Net Change */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <BarChart className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Change</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-800 leading-none">
                  {loading ? '—' : (addedToday - removedToday >= 0 ? `+${addedToday - removedToday}` : addedToday - removedToday)}
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-semibold">Bags / Day</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-xs font-medium text-slate-400 border-t border-slate-100 pt-6 text-left">
            Data is updated in real-time. Last updated: {lastUpdatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </footer>
        </div>
      </div>
    );
}
