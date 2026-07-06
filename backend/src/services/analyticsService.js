import { query } from '../db/index.js';

const TIMEZONE = 'UTC';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ==== CARD 1: Daily Usage Heatmap ====
const getHeatmapData = async (hospitalId, fromDate, toDate) => {
  const res = await query(
    `SELECT 
      TO_CHAR(DATE(timestamp AT TIME ZONE $1), 'YYYY-MM-DD') AS date,
      EXTRACT(DOW FROM timestamp AT TIME ZONE $1) AS day_of_week,
      SUM(CASE WHEN type = 'REMOVE' THEN quantity ELSE 0 END)::int AS consumed
    FROM transactions
    WHERE hospital_id = $2
      AND timestamp AT TIME ZONE $1 >= $3::date
      AND timestamp AT TIME ZONE $1 <= $4::date + interval '1 day'
      AND type = 'REMOVE'
    GROUP BY TO_CHAR(DATE(timestamp AT TIME ZONE $1), 'YYYY-MM-DD'), EXTRACT(DOW FROM timestamp AT TIME ZONE $1)
    ORDER BY date ASC`,
    [TIMEZONE, hospitalId, fromDate, toDate]
  );
  return res.rows;
};

// ==== CARD 2: Blood Type Distribution (Usage) ====
const getUsageDistributionData = async (hospitalId, fromDate, toDate) => {
  const consumedRes = await query(
    `SELECT 
      blood_type,
      SUM(quantity)::int AS consumed
    FROM transactions
    WHERE hospital_id = $1
      AND timestamp AT TIME ZONE $2 >= $3::date
      AND timestamp AT TIME ZONE $2 <= $4::date + interval '1 day'
      AND type = 'REMOVE'
    GROUP BY blood_type`,
    [hospitalId, TIMEZONE, fromDate, toDate]
  );

  const consumedByType = {};
  BLOOD_GROUPS.forEach(bt => consumedByType[bt] = 0);
  consumedRes.rows.forEach(row => consumedByType[row.blood_type] = row.consumed);

  const totalConsumed = Object.values(consumedByType).reduce((a, b) => a + b, 0);
  const distribution = BLOOD_GROUPS.map(bt => ({
    bloodType: bt,
    consumed: consumedByType[bt]
  }));

  return {
    distribution,
    totalConsumed
  };
};

// ==== CARD3: Stock Level Overview ====
const getCurrentStockOverview = async (hospitalId) => {
  const currentStockRes = await query(
    `SELECT COUNT(*)::int as total_stock FROM blood_batches 
     WHERE hospital_id = $1 AND status = 'AVAILABLE'`,
    [hospitalId]
  );

  const totalStock = currentStockRes.rows[0].total_stock;
  const maxCapacity = 200; // Reasonable default, can be dynamic later
  const stockRatio = Math.min(totalStock / maxCapacity, 1);
  let status = 'healthy';
  if (stockRatio < 0.25) status = 'critical';
  else if (stockRatio < 0.5) status = 'warning';

  return {
    totalStock,
    maxCapacity,
    stockRatio,
    status
  };
};

// ==== CARD4: Consumption Trends ====
const getConsumptionTrends = async (hospitalId, fromDate, toDate) => {
  const dailyRes = await query(
    `SELECT 
      TO_CHAR(DATE(timestamp AT TIME ZONE $1), 'YYYY-MM-DD') AS date,
      SUM(quantity)::int AS consumed
    FROM transactions
    WHERE hospital_id = $2
      AND timestamp AT TIME ZONE $1 >= $3::date
      AND timestamp AT TIME ZONE $1 <= $4::date + interval '1 day'
      AND type = 'REMOVE'
    GROUP BY TO_CHAR(DATE(timestamp AT TIME ZONE $1), 'YYYY-MM-DD')
    ORDER BY date ASC`,
    [TIMEZONE, hospitalId, fromDate, toDate]
  );

  // Previous period comparison
  const fromObj = new Date(fromDate);
  const toObj = new Date(toDate);
  const daysDiff = Math.ceil((toObj - fromObj) / (1000 * 60 * 60 * 24));
  const prevFrom = new Date(fromObj);
  prevFrom.setDate(prevFrom.getDate() - daysDiff);
  const prevTo = new Date(fromObj);
  prevTo.setDate(prevTo.getDate() - 1);

  const prevRes = await query(
    `SELECT SUM(quantity)::int AS total FROM transactions
     WHERE hospital_id = $1 
       AND timestamp AT TIME ZONE $2 >= $3::date 
       AND timestamp AT TIME ZONE $2 <= $4::date + interval '1 day'
       AND type = 'REMOVE'`,
    [hospitalId, TIMEZONE, prevFrom.toISOString().split('T')[0], prevTo.toISOString().split('T')[0]]
  );
  const currentTotal = dailyRes.rows.reduce((sum, r) => sum + r.consumed, 0);
  const prevTotal = prevRes.rows[0].total || 0;
  const changeRate = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  let trendDirection = 'stable';
  if (changeRate > 10) trendDirection = 'rising';
  else if (changeRate < -10) trendDirection = 'falling';

  return {
    daily: dailyRes.rows,
    currentTotal,
    previousTotal: prevTotal,
    changeRate,
    trendDirection
  };
};

// ==== CARD5: Consumption Factors (Weighted) ====
const getConsumptionFactors = async (hospitalId, fromDate, toDate) => {
  const factors = [
    { name: 'Historical Usage', contribution: 40, weight: 0.4 },
    { name: 'Day-Type Pattern', contribution: 30, weight: 0.3 },
    { name: 'Seasonal Trend', contribution: 20, weight: 0.2 },
    { name: 'Special Events', contribution: 10, weight: 0.1 }
  ];

  const totalContribution = factors.reduce((sum, f) => sum + f.contribution, 0);
  return factors.map(f => ({
    ...f,
    percentage: Math.round((f.contribution / totalContribution) * 100)
  }));
};

// ==== CARD6: Expiry Timeline ====
const getExpiryTimeline = async (hospitalId) => {
  const res = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + 3) AS within3,
      COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + 7 AND expiry_date > CURRENT_DATE + 3) AS within7,
      COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + 14 AND expiry_date > CURRENT_DATE + 7) AS within14,
      COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + 30 AND expiry_date > CURRENT_DATE + 14) AS within30,
      COUNT(*) FILTER (WHERE expiry_date > CURRENT_DATE + 30) AS after30
    FROM blood_batches
    WHERE hospital_id = $1
      AND status = 'AVAILABLE'`,
    [hospitalId]
  );

  return res.rows[0];
};

// ==== CARD7: Top Consumed Combinations ====
const getTopConsumedCombinations = async (hospitalId, fromDate, toDate) => {
  const res = await query(
    `SELECT blood_type, SUM(quantity)::int AS total_consumed 
     FROM transactions
     WHERE hospital_id = $1
       AND timestamp AT TIME ZONE $2 >= $3::date
       AND timestamp AT TIME ZONE $2 <= $4::date + interval '1 day'
       AND type = 'REMOVE'
     GROUP BY blood_type
     ORDER BY total_consumed DESC
     LIMIT 5`,
    [hospitalId, TIMEZONE, fromDate, toDate]
  );

  const list = res.rows;
  let comparisonRatio = '∞';
  if (list.length > 0) {
    // Calculate ratio of top type vs average of remaining types
    const remaining = list.slice(1);
    const avgRemaining = remaining.length > 0
      ? remaining.reduce((sum, r) => sum + r.total_consumed, 0) / remaining.length
      : 0;
    if (avgRemaining > 0) {
      comparisonRatio = (list[0].total_consumed / avgRemaining).toFixed(1);
    }
  }

  return {
    list,
    comparisonRatio,
    topType: list[0]?.blood_type || 'None'
  };
};

// ==== CARD8: Inventory Health Check ====
const getInventoryHealth = async (hospitalId) => {
  // Get current stock by type
  const stockByTypeRes = await query(
    `SELECT blood_type, COUNT(*)::int AS units FROM blood_batches
     WHERE hospital_id = $1 AND status = 'AVAILABLE'
     GROUP BY blood_type`,
    [hospitalId]
  );

  const stockMap = {};
  BLOOD_GROUPS.forEach(bt => stockMap[bt] = 0);
  stockByTypeRes.rows.forEach(row => stockMap[row.blood_type] = row.units);

  let healthyCount = 0;
  let lowCount = 0;
  let criticalCount = 0;

  // Use EXACT SAME LOGIC as BloodInventory page's getStatus function
  Object.entries(stockMap).forEach(([bloodType, count]) => {
    if (count >= 1 && count <= 3) criticalCount++;
    else if (count >= 4 && count <= 5) lowCount++;
    else if (count >= 6) healthyCount++;
    // count === 0 is ignored
  });

  // Calculate health score using formula suggested
  const totalTypes = healthyCount + lowCount + criticalCount; // count only types with stock
  const healthScore = totalTypes > 0 
    ? Math.round(((healthyCount * 100) + (lowCount * 50) + (criticalCount * 0)) / (healthyCount + lowCount + criticalCount)) 
    : 0;

  // Determine footer message based on health score
  let footerMessage = 'Inventory health is good.';
  if (healthScore < 30) footerMessage = 'Immediate stock injection required!';
  else if (healthScore < 60) footerMessage = 'Some groups need attention.';

  return {
    healthScore,
    healthyGroups: healthyCount,
    lowStockGroups: lowCount,
    criticalGroups: criticalCount,
    footerMessage
  };
};

// ==== CARD9: Summary Data ====
const getSummaryData = async (hospitalId, fromDate, toDate) => {
  const usageDist = await getUsageDistributionData(hospitalId, fromDate, toDate);
  // Find top used type
  let topUsed = 'N/A';
  if (usageDist.distribution.length > 0) {
    const sorted = [...usageDist.distribution].sort((a, b) => b.consumed - a.consumed);
    if (sorted[0]?.consumed > 0) {
      topUsed = sorted[0].bloodType;
    }
  }

  // Expiring within NEXT 14 DAYS from TODAY
  const expiringRes = await query(
    `SELECT COUNT(*)::int AS count FROM blood_batches
     WHERE hospital_id = $1
       AND status = 'AVAILABLE'
       AND expiry_date >= CURRENT_DATE 
       AND expiry_date <= CURRENT_DATE + INTERVAL '14 days'`,
    [hospitalId]
  );

  const health = await getInventoryHealth(hospitalId);

  return {
    totalUnits: usageDist.totalConsumed,
    mostUsedType: topUsed,
    expiringSoon: expiringRes.rows[0].count,
    healthScore: health.healthScore
  };
};

// ==== CARD9: Smart Insight Generator ====
const generateSmartInsights = async (hospitalId, fromDate, toDate) => {
  const trends = await getConsumptionTrends(hospitalId, fromDate, toDate);
  const health = await getInventoryHealth(hospitalId, fromDate, toDate);
  const expiry = await getExpiryTimeline(hospitalId);
  const topConsumed = await getTopConsumedCombinations(hospitalId, fromDate, toDate);

  const insights = [];

  if (trends.trendDirection === 'rising') {
    insights.push({
      type: 'demand_rise',
      title: 'Demand is Rising',
      text: `Usage increased ${Math.abs(Math.round(trends.changeRate))}% compared to previous period.`
    });
  } else if (trends.trendDirection === 'falling') {
    insights.push({
      type: 'demand_fall',
      title: 'Usage is Down',
      text: `Usage decreased ${Math.abs(Math.round(trends.changeRate))}% compared to previous period.`
    });
  }

  const expiringSoon = (expiry.today || 0) + (expiry.within3 || 0);
  if (expiringSoon > 0) {
    insights.push({
      type: 'expiry_risk',
      title: 'Expiry Alert',
      text: `${expiringSoon} units expiring soon - consider immediate usage or redistribution.`
    });
  }

  if (health.criticalGroups > 0) {
    insights.push({
      type: 'critical_stock',
      title: 'Critical Stock Levels',
      text: `${health.criticalGroups} blood groups are critically low. Immediate restock needed.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'stable',
      title: 'System is Stable',
      text: 'No critical issues detected - inventory and consumption are healthy.'
    });
  }

  return insights;
};

// ==== MAIN SMART REPORT ====
export const getSmartReport = async (hospitalId, { fromDate, toDate }) => {
  const from = fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const to = toDate || new Date().toISOString().split('T')[0];

  // Fetch all in parallel for performance
  const [
    heatmapData,
    usageDistribution,
    stockOverview,
    consumptionTrends,
    consumptionFactors,
    expiryTimeline,
    topConsumed,
    inventoryHealth,
    summaryData,
    smartInsights
  ] = await Promise.all([
    getHeatmapData(hospitalId, from, to),
    getUsageDistributionData(hospitalId, from, to),
    getCurrentStockOverview(hospitalId),
    getConsumptionTrends(hospitalId, from, to),
    getConsumptionFactors(hospitalId, from, to),
    getExpiryTimeline(hospitalId),
    getTopConsumedCombinations(hospitalId, from, to),
    getInventoryHealth(hospitalId),
    getSummaryData(hospitalId, from, to),
    generateSmartInsights(hospitalId, from, to)
  ]);

  return {
    heatmapData,
    usageDistribution,
    stockOverview,
    consumptionTrends,
    consumptionFactors,
    expiryTimeline,
    topConsumed,
    inventoryHealth,
    summaryData,
    smartInsights
  };
};

export {
  getHeatmapData,
  getCurrentStockOverview,
  getConsumptionTrends,
  getUsageDistributionData,
  getExpiryTimeline,
  getInventoryHealth,
  getTopConsumedCombinations,
  getConsumptionFactors,
  getSummaryData
};
