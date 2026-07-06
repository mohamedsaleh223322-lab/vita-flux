import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Sparkles,
  RefreshCw,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  FileText,
  Droplets,
  Flame,
  HeartPulse
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api/apiFetch.js';
import { getRealtimeSocket } from '../lib/realtimeClient.js';
import '../styles/smart-report.css';
import { BLOOD_TYPES } from '../constants/index.js';

const BLOOD_COLORS = {
  'A+': '#7C3AED',
  'A-': '#3B82F6',
  'B+': '#0D9488',
  'B-': '#F472B6',
  'AB+': '#F59E0B',
  'AB-': '#60A5FA',
  'O+': '#E11D2E',
  'O-': '#F97316'
};

const today = () => new Date().toISOString().split('T')[0];
const monthAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

// Helper to get heatmap cell color
const getHeatmapColor = (value, maxValue) => {
  if (maxValue === 0) return 'var(--heat-empty)';
  const ratio = value / maxValue;
  if (ratio === 0) return 'var(--heat-empty)';
  if (ratio < 0.25) return 'var(--heat-low)';
  if (ratio < 0.5) return 'var(--heat-medium)';
  if (ratio < 0.75) return 'var(--heat-high)';
  return 'var(--heat-max)';
};

// Format date for tooltip
const formatDateTooltip = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Skeleton component
function CardSkeleton() {
  return (
    <div className="report-card" style={{ height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <div className="skeleton-shimmer" style={{ height: 18, width: '60%' }} />
        <div className="skeleton-shimmer" style={{ height: 12, width: '40%', marginTop: 6 }} />
      </div>
      <div className="skeleton-shimmer" style={{ flex: 1 }} />
      <div className="skeleton-shimmer" style={{ height: 24, marginTop: 12 }} />
    </div>
  );
}

// Empty state
function EmptyState({ message = 'No data available' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1 }}>
      <Activity className="text-slate-200 animate-pulse" style={{ width: 32, height: 32, marginBottom: 8 }} />
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-light)' }}>{message}</p>
    </div>
  );
}

// Card component
function Card({ index, title, subtitle, children, footer, footerTone = 'slate', className = '', icon: Icon, iconBg, iconColor }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`report-card ${className}`}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexShrink: 0, alignItems: 'flex-start' }}>
        {Icon && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 10,
            background: iconBg || 'rgba(124, 58, 237, 0.1)',
            color: iconColor || '#7C3AED',
            flexShrink: 0
          }}>
            <Icon style={{ width: 20, height: 20 }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h2
            className="flex items-center gap-2"
            style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-dark)', margin: 0 }}
          >
            {index !== undefined && <span style={{ color: 'var(--primary-navy)', fontWeight: 800 }}>{index}.</span>}
            {title}
          </h2>
          {subtitle && (
            <p style={{ marginTop: 2, fontSize: 12, fontWeight: 400, color: 'var(--text-light)', margin: 0 }}>{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
      {footer && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.4,
            background: footerTone === 'red' ? '#FEF2F2' : footerTone === 'green' ? '#F0FDF4' : '#F8FAFC',
            color: footerTone === 'red' ? '#991B1B' : footerTone === 'green' ? '#065F46' : '#475569'
          }}
        >
          <Info className="shrink-0 mt-0.5 opacity-60" style={{ width: 14, height: 14 }} />
          <span>{footer}</span>
        </div>
      )}
    </motion.article>
  );
}

export default function SmartReportPage() {
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [pendingFromDate, setPendingFromDate] = useState(monthAgo);
  const [pendingToDate, setPendingToDate] = useState(today);
  const [showDateBar, setShowDateBar] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveSync, setLiveSync] = useState(false);
  const [data, setData] = useState(null);

  // For heatmap tooltip
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });

  const loadData = useCallback(async (isLive = false) => {
    isLive ? setLiveSync(true) : setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (fromDate) qs.set('fromDate', fromDate);
      if (toDate) qs.set('toDate', toDate);
      const reportData = await apiFetch(`/api/analytics/reports?${qs}`);
      console.log('[SmartReportPage] Report data received:', reportData);
      setData(reportData);
    } catch (err) {
      console.error('[SmartReportPage] loadData error:', err);
    } finally {
      setLoading(false);
      setLiveSync(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') loadData(true);
    }, 20000);
    return () => clearInterval(id);
  }, [loadData]);

  // WebSocket realtime
  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;
    const refresh = () => loadData(true);
    socket.on('dashboard_updated', refresh);
    socket.on('inventory_updated', refresh);
    socket.on('request_updated', refresh);
    return () => {
      socket.off('dashboard_updated', refresh);
      socket.off('inventory_updated', refresh);
      socket.off('request_updated', refresh);
    };
  }, [loadData]);

  // Generate date range for heatmap
  const dateRange = useMemo(() => {
    const dates = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [fromDate, toDate]);

  // Transform heatmap data
  const heatmapData = useMemo(() => {
    const dataMap = {};
    let maxValue = 0;
    data?.heatmapData?.forEach(item => {
      const consumed = item.consumed || 0;
      dataMap[item.date] = consumed;
      if (consumed > maxValue) maxValue = consumed;
    });
    return { dataMap, maxValue };
  }, [data]);

  // Build heatmap grid (Mon to Sun)
  const heatmapGrid = useMemo(() => {
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const grid = dayOrder.map((dow, idx) => ({
      label: dayLabels[idx],
      cells: []
    }));

    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dow = date.getDay();
      const rowIdx = dayOrder.indexOf(dow);
      const value = heatmapData.dataMap[dateStr] || 0;
      grid[rowIdx].cells.push({ date: dateStr, value, dayOfMonth: date.getDate() });
    });
    return grid;
  }, [dateRange, heatmapData]);

  // Heatmap footer insight
  const heatmapFooter = useMemo(() => {
    let weekdayTotal = 0, weekdayCount = 0;
    let weekendTotal = 0, weekendCount = 0;

    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dow = date.getDay();
      const value = heatmapData.dataMap[dateStr] || 0;
      if (dow >= 1 && dow <= 5) {
        weekdayTotal += value;
        weekdayCount++;
      } else {
        weekendTotal += value;
        weekendCount++;
      }
    });

    const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
    const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;

    if (weekdayAvg > weekendAvg) {
      return "Usage is highest on weekdays, especially mid-month.";
    } else {
      return "Usage is highest on weekends.";
    }
  }, [dateRange, heatmapData]);

  // Distribution data for donut chart (Card2)
  const distributionData = useMemo(() => {
    const dist = data?.usageDistribution?.distribution || [];
    return dist
      .filter(d => d.consumed > 0)
      .map(d => ({
        name: d.bloodType,
        value: d.consumed,
        color: BLOOD_COLORS[d.bloodType]
      }));
  }, [data]);
  const totalConsumed = distributionData.reduce((sum, d) => sum + d.value, 0);

  // For Card 9: Most Used Blood Type (sorted from distributionData)
  const mostUsedBloodType = useMemo(() => {
    const dist = data?.usageDistribution?.distribution || [];
    if (dist.length === 0) return 'None';
    const sorted = [...dist].sort((a, b) => b.consumed - a.consumed);
    return sorted[0]?.consumed > 0 ? sorted[0].bloodType : 'None';
  }, [data]);

  // Stock gauge data (Card3)
  const totalStock = data?.stockOverview?.totalStock || 0;
  const maxUnits = useMemo(() => {
    return Math.max(100, totalStock);
  }, [totalStock]);
  const stockRatio = totalStock / maxUnits;
  const gaugeAngle = 180 - stockRatio * 180;

  // Stock status configuration (Card 3)
  const stockStatus = useMemo(() => {
    const healthyCount = data?.inventoryHealth?.healthyGroups || 0;
    const lowCount = data?.inventoryHealth?.lowStockGroups || 0;
    const criticalCount = data?.inventoryHealth?.criticalGroups || 0;
    const totalTypes = healthyCount + lowCount + criticalCount;
    
    if (!data) {
      return {
        bg: '#F1F5F9',
        borderColor: '#E2E8F0',
        color: '#64748B',
        dotColor: '#94A3B8',
        kpiColor: '#172554',
        label: 'Healthy'
      };
    }
    
    if (totalTypes <= 3) {
      return {
        bg: '#FEF2F2',
        borderColor: '#FEE2E2',
        color: '#991B1B',
        dotColor: '#FF4D4F',
        kpiColor: '#FF4D4F',
        label: 'Critical'
      };
    } else if (totalTypes <= 5) {
      return {
        bg: '#FFFBEB',
        borderColor: '#FEF3C7',
        color: '#B45309',
        dotColor: '#F59E0B',
        kpiColor: '#F59E0B',
        label: 'Low'
      };
    } else {
      return {
        bg: '#F0FDF4',
        borderColor: '#DCFCE7',
        color: '#15803D',
        dotColor: '#22C55E',
        kpiColor: '#172554',
        label: 'Healthy'
      };
    }
  }, [data]);

  // Expiry timeline data (Card6)
  const expiryBuckets = useMemo(() => [
    { label: 'Within 3 Days', count: data?.expiryTimeline?.within3 || 0, tone: 'red' },
    { label: 'Within 7 Days', count: data?.expiryTimeline?.within7 || 0, tone: 'orange' },
    { label: 'Within 14 Days', count: data?.expiryTimeline?.within14 || 0, tone: 'slate' },
    { label: 'Within 30 Days', count: data?.expiryTimeline?.within30 || 0, tone: 'slate' },
    { label: 'After 30 Days', count: data?.expiryTimeline?.after30 || 0, tone: 'green' }
  ], [data]);
  
  const within3Days = data?.expiryTimeline?.within3 || 0;
  const within7Days = data?.expiryTimeline?.within7 || 0;
  const expiringSoonTotal = (data?.expiryTimeline?.within3 || 0) +
                            (data?.expiryTimeline?.within7 || 0) +
                            (data?.expiryTimeline?.within14 || 0) +
                            (data?.expiryTimeline?.within30 || 0);

  // Top consumed combinations (Card7)
  const topConsumed = data?.topConsumed || { list: [], comparisonRatio: '∞', topType: 'None' };

  // Consumption Insights (Card5)
  const consumptionInsights = useMemo(() => {
    if (!data?.consumptionFactors) {
      return { avgDaily: 0, highest: 0, lowest: 0, variability: 'No Data Available' };
    }

    // Step 1: Apply date range filter and group by calendar day
    const daily = data?.consumptionTrends?.daily || [];

    // Build a map of date -> total consumed, filtering to selected date range
    const dayMap = {};
    daily.forEach(d => {
      if (!d.date) return;
      // Apply date range filter
      if (fromDate && d.date < fromDate) return;
      if (toDate && d.date > toDate) return;
      const existing = dayMap[d.date] || 0;
      dayMap[d.date] = existing + (d.consumed || 0);
    });

    // Step 2: Get all daily totals (including zeros — we'll filter below)
    const allDailyTotals = Object.values(dayMap);

    // Step 3: Only days with total > 0
    const activeDays = allDailyTotals.filter(v => v > 0);

    if (activeDays.length === 0) {
      return { avgDaily: 0, highest: 0, lowest: 0, variability: 'No Data Available' };
    }

    // Step 4: Highest = max of all daily totals
    const highest = Math.max(...activeDays);

    // Step 5: Lowest = min among days with total > 0 only
    const lowest = Math.min(...activeDays);

    // Step 6 & 7: Avg = total consumption / number of days with consumption
    const totalConsumedSum = activeDays.reduce((a, b) => a + b, 0);
    const avgDaily = Math.round(totalConsumedSum / activeDays.length);

    // Step 8: Variability = coefficient of variation on active-day totals
    const mean = totalConsumedSum / activeDays.length;
    const variance = activeDays.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / activeDays.length;
    const cv = mean > 0 ? (Math.sqrt(variance) / mean) : 0;
    let variability;
    if (cv < 0.25) variability = 'Low (Stable)';
    else if (cv < 0.5) variability = 'Medium (Moderate fluctuations)';
    else variability = 'High (Significant fluctuations)';

    return { avgDaily, highest, lowest, variability };
  }, [data, fromDate, toDate]);

  return (
    <div className="smart-report-page">
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--primary-navy)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              Smart Report
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4, marginBottom: 0 }}>
              Deep insights and trends based on selected date range
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowDateBar(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'var(--primary-navy)',
                color: 'white',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-90"
            >
              <Filter style={{ width: 16, height: 16 }} />
              Filter <span style={{ fontSize: 12 }}>{showDateBar ? '▲' : '▼'}</span>
              {liveSync && <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDateBar && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'white',
              padding: '12px 20px',
              borderRadius: 12,
              border: '1px solid #E2E8F0'
            }}
          >
            <Calendar style={{ width: 20, height: 20, color: 'var(--text-light)' }} />
            <input
              type="date"
              value={pendingFromDate}
              onChange={(e) => {
                setPendingFromDate(e.target.value);
                setIsDirty(true);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-dark)',
                outline: 'none'
              }}
            />
            <span style={{ color: 'var(--text-light)', fontWeight: 700 }}>–</span>
            <input
              type="date"
              value={pendingToDate}
              onChange={(e) => {
                setPendingToDate(e.target.value);
                setIsDirty(true);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-dark)',
                outline: 'none'
              }}
            />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                if (isDirty) {
                  setFromDate(pendingFromDate);
                  setToDate(pendingToDate);
                  setIsDirty(false);
                }
              }}
              disabled={!isDirty}
              style={{
                background: isDirty ? 'var(--primary-navy)' : '#CBD5E1',
                color: isDirty ? 'white' : '#64748B',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: isDirty ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s'
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="report-grid">
          {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="report-grid">
          {/* Card 1: Daily Usage Heatmap */}
          <Card index={1} title="Daily Usage Heatmap" subtitle="When do we use the most blood?" footer={heatmapFooter} footerTone="red">
            <div className="overflow-x-auto custom-scrollbar" style={{ flex: 1, minHeight: 0, overflow: 'visible' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 6, overflow: 'visible' }}>
                {/* Y-axis labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 4 }}>
                  {heatmapGrid.map((row, idx) => (
                    <span
                      key={idx}
                      style={{
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-light)'
                      }}
                    >
                      {row.label}
                    </span>
                  ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'visible' }}>
                  {heatmapGrid.map((row, rowIdx) => (
                    <div key={rowIdx} style={{ display: 'flex', gap: 3, overflow: 'visible' }}>
                      {row.cells.map((cell, cellIdx) => (
                        <div
                          key={`${rowIdx}-${cellIdx}`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell(cell);
                            setTooltipCoords({
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            backgroundColor: getHeatmapColor(cell.value, heatmapData.maxValue),
                            transition: 'transform 0.15s ease',
                            cursor: 'pointer'
                          }}
                          className="hover:scale-110"
                        />
                      ))}
                    </div>
                  ))}

                  {/* X-axis week markers */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                    {dateRange.map((date, idx) => {
                      const isMarker = [1, 8, 15, 22].includes(date.getDate()) || idx === dateRange.length - 1;
                      if (!isMarker) return <div key={idx} style={{ width: 18 }} />;
                      return (
                        <span
                          key={idx}
                          style={{
                            width: 18,
                            fontSize: 9,
                            fontWeight: 600,
                            color: 'var(--text-light)',
                            textAlign: 'center'
                          }}
                        >
                          {date.getDate()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Blood Type Distribution (Usage) */}
          <Card
            index={2}
            title="Blood Type Distribution (Usage)"
            subtitle="Share of total used blood by type"
            footer={mostUsedBloodType && mostUsedBloodType !== 'None' ? `${mostUsedBloodType} is the most used blood type.` : 'No usage data available.'}
          >
            {totalConsumed === 0 ? (
              <EmptyState message="No consumed blood types in this period." />
            ) : (
              <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div
                                style={{
                                  background: 'white',
                                  padding: 8,
                                  borderRadius: 8,
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                              >
                                <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{payload[0].name}</p>
                                <p style={{ fontSize: 12, margin: 0, color: 'var(--text-dark)' }}>{payload[0].value} units</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)' }}>Total Used</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>{totalConsumed}</span>
                  </div>
                </div>
                <div
                  className="overflow-y-auto custom-scrollbar"
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}
                >
                  {distributionData.map(item => {
                    const pct = totalConsumed > 0 ? Math.round((item.value / totalConsumed) * 100) : 0;
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', flex: 1 }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)' }}>
                          {pct}% ({item.value})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Card 3: Stock Level Overview */}
          <Card
            index={3}
            title="Stock Level Overview"
            subtitle="Current stock level"
            className="p-8"
            icon={TrendingUp}
            iconBg="#EEF0FF"
            iconColor="#7c3aed"
          >
            {totalStock === 0 ? (
              <EmptyState message="No stock data available." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingTop: 4, paddingBottom: 4, gap: 8 }}>
                {/* Top: Segmented Progress Arc */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <svg width="260" height="125" viewBox="0 0 260 125">
                    <defs>
                      <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="130%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.06" />
                      </filter>
                      <linearGradient id="criticalGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF7875" />
                        <stop offset="100%" stopColor="#FF4D4F" />
                      </linearGradient>
                      <linearGradient id="lowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                      <linearGradient id="healthyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4ADE80" />
                        <stop offset="100%" stopColor="#15803D" />
                      </linearGradient>
                    </defs>
                    {/* Background Arc with shadow */}
                    <path
                      d="M 20 115 A 110 110 0 0 1 240 115"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="8"
                      strokeLinecap="round"
                      filter="url(#gaugeShadow)"
                    />
                    
                    {/* Critical Segment Glow - only if active */}
                    {stockStatus.label === 'Critical' && (
                      <path
                        d="M 20 115 A 110 110 0 0 1 65.3 26.0"
                        fill="none"
                        stroke="url(#criticalGrad)"
                        strokeWidth="14"
                        opacity="0.08"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Critical Segment (0-30%) */}
                    <path
                      d="M 20 115 A 110 110 0 0 1 65.3 26.0"
                      fill="none"
                      stroke="url(#criticalGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    
                    {/* Low Segment Glow - only if active */}
                    {stockStatus.label === 'Low' && (
                      <path
                        d="M 65.3 26.0 A 110 110 0 0 1 164.0 10.4"
                        fill="none"
                        stroke="url(#lowGrad)"
                        strokeWidth="14"
                        opacity="0.08"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Low Segment (30-60%) */}
                    <path
                      d="M 65.3 26.0 A 110 110 0 0 1 164.0 10.4"
                      fill="none"
                      stroke="url(#lowGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    
                    {/* Healthy Segment Glow - only if active */}
                    {stockStatus.label === 'Healthy' && (
                      <path
                        d="M 164.0 10.4 A 110 110 0 0 1 240 115"
                        fill="none"
                        stroke="url(#healthyGrad)"
                        strokeWidth="14"
                        opacity="0.08"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Healthy Segment (60-100%) */}
                    <path
                      d="M 164.0 10.4 A 110 110 0 0 1 240 115"
                      fill="none"
                      stroke="url(#healthyGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                
                {/* Center: Stock Value */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: -18, gap: 2 }}>
                  <span style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: 800, 
                    color: stockStatus.kpiColor,
                    lineHeight: 1,
                    transition: 'color 0.2s ease-in-out'
                  }}>
                    {totalStock}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em'
                  }}>
                    Current Units
                  </span>
                </div>

                {/* Bottom: Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 999,
                    backgroundColor: stockStatus.bg,
                    border: `1px solid ${stockStatus.borderColor}`,
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)'
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: stockStatus.dotColor,
                      flexShrink: 0
                    }} />
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: stockStatus.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}>
                      {stockStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Card 4: Consumption Trends */}
          <Card
            index={4}
            title="Consumption Trends"
            subtitle="Track daily consumption patterns"
            footer={data?.consumptionTrends?.daily?.length > 0 ? `${data.consumptionTrends.currentTotal} units consumed in this period.` : 'No trend data available.'}
          >
            {!data?.consumptionTrends?.daily?.length ? (
              <EmptyState message="No consumption data available." />
            ) : (
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.consumptionTrends.daily} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--text-light)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-light)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload?.length) {
                          return (
                            <div
                              style={{
                                background: 'white',
                                padding: 8,
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            >
                              <p style={{ fontSize: 12, fontWeight: 700, margin: 0, marginBottom: 2 }}>{label}</p>
                              <p style={{ fontSize: 12, margin: 0, color: 'var(--text-dark)' }}>{payload[0].value} units</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumed"
                      name="Units"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      fill="url(#areaGrad)"
                      fillOpacity={1}
                      dot={{ r: 3, stroke: '#7C3AED', strokeWidth: 1.5, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Card 5: Consumption Insights */}
          <Card index={5} title="Consumption Insights" subtitle="Key consumption metrics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity style={{ width: 16, height: 16, color: 'var(--text-light)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Average Daily Usage</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-navy)' }}>{consumptionInsights.avgDaily}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp style={{ width: 16, height: 16, color: '#059669' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>Highest Day Consumption</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{consumptionInsights.highest}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingDown style={{ width: 16, height: 16, color: '#D97706' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Lowest Day Consumption</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{consumptionInsights.lowest}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock style={{ width: 16, height: 16, color: 'var(--text-light)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Consumption Variability</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>{consumptionInsights.variability}</span>
              </div>
            </div>
          </Card>

          {/* Card 6: Expiry Timeline */}
          <Card
            index={6}
            title="Expiry Timeline"
            subtitle="When will blood expire?"
            footer={expiringSoonTotal > 0 ? `${expiringSoonTotal} units expiring soon.` : 'No urgent expiry alerts.'}
            footerTone={
              within3Days > 0 ? 'red' :
              within7Days > 0 ? 'orange' :
              expiringSoonTotal > 0 ? 'slate' :
              'green'
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {expiryBuckets.map((bucket, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor:
                          bucket.tone === 'red' ? 'var(--danger-red)' :
                          bucket.tone === 'orange' ? 'var(--warning-orange)' :
                          bucket.tone === 'green' ? 'var(--success-green)' :
                          '#CBD5E1'
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                      {bucket.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color:
                        bucket.tone === 'red' ? 'var(--danger-red)' :
                        bucket.tone === 'orange' ? 'var(--warning-orange)' :
                        bucket.tone === 'green' ? 'var(--success-green)' :
                        'var(--text-dark)',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background:
                        bucket.tone === 'red' ? '#FEF2F2' :
                        bucket.tone === 'orange' ? '#FFF7ED' :
                        bucket.tone === 'green' ? '#F0FDF4' :
                        '#F1F5F9'
                    }}
                  >
                    {bucket.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 7: Top Consumed Combinations */}
          <Card index={7} title="Top Consumed Combinations" subtitle="Most frequently used types">
            {!topConsumed.list.length ? (
              <EmptyState message="No consumption records found." />
            ) : (
              <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topConsumed.list.map((item, idx) => {
                    const maxVal = topConsumed.list[0].total_consumed || 1;
                    const width = Math.max(10, Math.round((item.total_consumed / maxVal) * 100));
                    return (
                      <div key={item.blood_type} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2340' }}>{item.blood_type}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2340' }}>{item.total_consumed}</span>
                        </div>
                        <div style={{ width: '100%', height: 12, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 999,
                              background: '#E53935',
                              width: `${width}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Insight Panel */}
                <div
                  style={{
                    width: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    borderRadius: 16,
                    background: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    textAlign: 'center',
                    flexShrink: 0,
                    gap: 10
                  }}
                >
                  <Droplets style={{ width: 40, height: 40, color: '#E53935' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2340' }}>
                    {topConsumed.topType} is used
                  </span>
                  <span style={{ fontSize: 48, fontWeight: 800, color: '#E53935', lineHeight: 1 }}>
                    {topConsumed.comparisonRatio}x
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    more than any other type
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Card 8: Inventory Health Check */}
          <Card
            index={8}
            title="Inventory Health Check"
            subtitle="Smart evaluation of inventory"
            footer={data?.inventoryHealth?.footerMessage || 'Inventory health is good.'}
            footerTone={
              (data?.inventoryHealth?.healthScore ?? 0) >= 60 ? 'green' :
              (data?.inventoryHealth?.healthScore ?? 0) >= 30 ? 'slate' :
              'red'
            }
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: '100%' }}>
              {/* Circular progress */}
              <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
                <svg className="transform -rotate-90" width="120" height="120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke={
                      (data?.inventoryHealth?.healthScore ?? 0) >= 66 ? 'var(--success-green)' :
                      (data?.inventoryHealth?.healthScore ?? 0) >= 33 ? 'var(--warning-orange)' :
                      'var(--danger-red)'
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="301.44"
                    strokeDashoffset={301.44 - ((data?.inventoryHealth?.healthScore ?? 0) / 100) * 301.44}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-dark)' }}>{data?.inventoryHealth?.healthScore ?? 0}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)' }}>/100</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: 'var(--success-green)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Healthy Groups</span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--success-green)',
                      background: '#F0FDF4',
                      padding: '4px 10px',
                      borderRadius: 999
                    }}
                  >
                    {data?.inventoryHealth?.healthyGroups ?? 0}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: 'var(--warning-orange)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Low Stock Groups</span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--warning-orange)',
                      background: '#FFF7ED',
                      padding: '4px 10px',
                      borderRadius: 999
                    }}
                  >
                    {data?.inventoryHealth?.lowStockGroups ?? 0}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: 'var(--danger-red)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>Critical Groups</span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--danger-red)',
                      background: '#FEF2F2',
                      padding: '4px 10px',
                      borderRadius: 999
                    }}
                  >
                    {data?.inventoryHealth?.criticalGroups ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 9: Summary */}
          <Card
            index={9}
            title="Summary"
            subtitle="Quick overview of your blood bank"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, height: '100%' }}>
              {/* Stat Box 1: Total Units */}
              <div style={{
                background: '#FEF2F2',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid #FEE2E2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Droplets style={{ width: 20, height: 20, color: '#E53935' }} />
                  </div>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#1B1F3B', lineHeight: 1 }}>
                  {data?.summaryData?.totalUnits ?? 0}
                </span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Units
                </span>
              </div>

              {/* Stat Box 2: Most Used Type */}
              <div style={{
                background: '#EFF6FF',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid #BFDBFE'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Droplets style={{ width: 20, height: 20, color: '#1E88E5' }} />
                  </div>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#1B1F3B', lineHeight: 1 }}>
                  {data?.summaryData?.mostUsedType ?? 'None'}
                </span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Most Used Type
                </span>
              </div>

              {/* Stat Box 3: Expiring Soon */}
              <div style={{
                background: '#FFF7ED',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid #FED7AA'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#FFEDD5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Clock style={{ width: 20, height: 20, color: '#FB8C00' }} />
                  </div>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#1B1F3B', lineHeight: 1 }}>
                  {data?.summaryData?.expiringSoon ?? 0}
                </span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Expiring Soon
                </span>
              </div>

              {/* Stat Box 4: Health Score */}
              <div style={{
                background: '#F0FDF4',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid #BBF7D0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HeartPulse style={{ width: 20, height: 20, color: '#43A047' }} />
                  </div>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#1B1F3B', lineHeight: 1 }}>
                  {data?.summaryData?.healthScore ?? 0}/100
                </span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Health Score
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Global Tooltip for Heatmap */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: tooltipCoords.x,
            top: tooltipCoords.y,
            transform: 'translate(-50%, -100%) translateY(-8px)',
            pointerEvents: 'none',
            zIndex: 9999,
            backgroundColor: '#1B1F3B',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <span style={{ fontWeight: 700 }}>{formatDateTooltip(hoveredCell.date)}</span>
          <span>{hoveredCell.value} units</span>
        </div>
      )}
    </div>
  );
}
