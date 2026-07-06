/**
 * prediction/service/predictionService.js
 *
 * Core business logic for the Prediction & Intelligence module.
 * All formulas are documented inline.
 * NO mock data. NO hardcoded numbers. NO shared code with analyticsService.
 */

import * as repo from '../repository/predictionRepository.js';
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_COLORS,
  classifyRisk,
  formatDaysLeft,
  rangeDays,
  clamp,
  stdDev,
  todayISO,
} from '../utils/predictionUtils.js';

/** How many days of history to use for average daily usage calculations */
const LOOKBACK_DAYS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a stock map: { bloodGroup -> currentUnits }.
 * All 8 blood groups always present (0 if not in DB).
 */
function buildStockMap(stockRows) {
  const map = {};
  BLOOD_GROUPS.forEach(bg => (map[bg] = 0));
  stockRows.forEach(row => {
    if (map[row.blood_type] !== undefined) {
      map[row.blood_type] = row.units;
    }
  });
  return map;
}

/**
 * Build an average-daily-usage map: { bloodGroup -> avgUnitsPerDay }.
 * Uses LOOKBACK_DAYS window.
 * Formula: total_consumed_in_window / LOOKBACK_DAYS
 */
function buildAvgUsageMap(consumptionRows) {
  const map = {};
  BLOOD_GROUPS.forEach(bg => (map[bg] = 0));
  consumptionRows.forEach(row => {
    if (map[row.blood_type] !== undefined) {
      // total_consumed / LOOKBACK_DAYS → avg per day
      map[row.blood_type] = row.total_consumed / LOOKBACK_DAYS;
    }
  });
  return map;
}

/**
 * Build a daily-usage array per blood group (for stdDev calculation).
 * Returns { bloodGroup -> number[] } where each element is units consumed on one day.
 */
function buildDailyUsageArrays(dailyRows) {
  const map = {};
  BLOOD_GROUPS.forEach(bg => (map[bg] = []));
  dailyRows.forEach(row => {
    if (map[row.blood_type] !== undefined) {
      map[row.blood_type].push(row.consumed);
    }
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CARD 1 — Will Run Out
 * Formula:
 *   daysLeft[bg] = currentStock[bg] / avgDailyUsage[bg]
 *   willRunOut   = count(bg where daysLeft < rangeDays)
 *
 * A blood group with 0 avg usage is never "predicted to run out" even if
 * stock is 0 — it would be classified separately as already depleted.
 */
function calcWillRunOut(stockMap, avgUsageMap, days) {
  let count = 0;
  BLOOD_GROUPS.forEach(bg => {
    const stock = stockMap[bg];
    const avg = avgUsageMap[bg];
    if (avg > 0) {
      const daysLeft = stock / avg;
      if (daysLeft < days) count++;
    } else if (stock === 0) {
      // No stock AND no recorded usage — still a risk
      count++;
    }
  });
  return count;
}

/**
 * CARD 2 — May Expire
 * Count of AVAILABLE bags whose expiry_date falls within the selected range.
 */
function calcMayExpire(expiryRows) {
  return expiryRows.reduce((sum, row) => sum + row.bags, 0);
}

/**
 * CARD 3 — Total Demand
 * Formula:
 *   totalAvgDailyUsage = sum(avgDailyUsage[bg]) for all bg
 *   totalDemand        = round(totalAvgDailyUsage * rangeDays)
 */
function calcTotalDemand(avgUsageMap, days) {
  const totalAvgDaily = Object.values(avgUsageMap).reduce((a, b) => a + b, 0);
  return Math.round(totalAvgDaily * days);
}

/**
 * CARD 4 — Health Score (0–100)
 *
 * Components (must sum to 100 weight points):
 *   stockCoverage    (40 pts): fraction of blood groups with daysLeft >= rangeDays
 *   expiryRisk       (25 pts): 1 - (expiringBags / max(totalStock, 1))
 *   demandPressure   (20 pts): 1 - clamp(totalDemand / max(totalStock,1), 0, 1)
 *   bloodTypeBalance (15 pts): fraction of blood groups that have any stock
 *
 * healthScore = round(stockCoverage*40 + expiryRisk*25 + demandPressure*20 + bloodTypeBalance*15)
 */
function calcHealthScore(stockMap, avgUsageMap, expiryCount, totalStock, totalDemand, days) {
  // stockCoverage: what fraction of blood groups have enough stock for the full period?
  let coveredGroups = 0;
  BLOOD_GROUPS.forEach(bg => {
    const stock = stockMap[bg];
    const avg = avgUsageMap[bg];
    const daysLeft = avg > 0 ? stock / avg : (stock > 0 ? Infinity : 0);
    if (daysLeft >= days) coveredGroups++;
  });
  const stockCoverage = coveredGroups / BLOOD_GROUPS.length; // 0–1

  // expiryRisk: fewer expiring bags = better score
  const expiryRisk = 1 - clamp(expiryCount / Math.max(totalStock, 1), 0, 1);

  // demandPressure: if demand exceeds stock we score 0; equal = 0.5; demand=0 = 1
  const demandPressure = 1 - clamp(totalDemand / Math.max(totalStock, 1), 0, 1);

  // bloodTypeBalance: how many of the 8 groups have any stock?
  const groupsWithStock = BLOOD_GROUPS.filter(bg => stockMap[bg] > 0).length;
  const bloodTypeBalance = groupsWithStock / BLOOD_GROUPS.length;

  const score = Math.round(
    stockCoverage    * 40 +
    expiryRisk       * 25 +
    demandPressure   * 20 +
    bloodTypeBalance * 15
  );
  return clamp(score, 0, 100);
}

function healthLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Critical';
}

/**
 * CARD 5 — AI Confidence (0–100)
 *
 * Components:
 *   dataCompleteness    (40 pts): fraction of blood groups with any historical usage
 *   historicalDepth     (35 pts): min(activeDays, LOOKBACK_DAYS) / LOOKBACK_DAYS
 *   predictionStability (25 pts): 1 - avg(stdDev[bg] / (avgUsage[bg] + 0.01)) — capped 0–1
 *
 * aiConfidence = round(dataCompleteness*40 + historicalDepth*35 + predictionStability*25)
 */
function calcAiConfidence(avgUsageMap, dailyArrays, activeDays) {
  // dataCompleteness
  const typesWithData = BLOOD_GROUPS.filter(bg => avgUsageMap[bg] > 0).length;
  const dataCompleteness = typesWithData / BLOOD_GROUPS.length;

  // historicalDepth
  const historicalDepth = clamp(activeDays / LOOKBACK_DAYS, 0, 1);

  // predictionStability — coefficient of variation per type
  const cvValues = BLOOD_GROUPS.map(bg => {
    const arr = dailyArrays[bg] ?? [];
    const avg = avgUsageMap[bg];
    if (avg === 0 && arr.length === 0) return 1; // perfectly stable at 0
    const sd = stdDev(arr);
    return clamp(sd / (avg + 0.01), 0, 1);
  });
  const avgCV = cvValues.reduce((a, b) => a + b, 0) / cvValues.length;
  const predictionStability = 1 - avgCV;

  const score = Math.round(
    dataCompleteness    * 40 +
    historicalDepth     * 35 +
    predictionStability * 25
  );
  return clamp(score, 0, 100);
}

function aiLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 55) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the Runout Prediction table (one row per blood group).
 */
function buildRunoutTable(stockMap, avgUsageMap, days) {
  return BLOOD_GROUPS.map(bg => {
    const currentStock = stockMap[bg];
    const avg = avgUsageMap[bg];
    const daysLeftNum = avg > 0 ? currentStock / avg : Infinity;
    const riskLevel = classifyRisk(daysLeftNum);
    return {
      bloodGroup: bg,
      currentStock,
      avgDailyUsage: parseFloat(avg.toFixed(2)),
      daysLeft: formatDaysLeft(daysLeftNum, days),
      riskLevel,
    };
  });
}

/**
 * Build the Expiry Prediction table from repository rows.
 */
function buildExpiryTable(expiryRows) {
  return expiryRows.map(row => ({
    bloodGroup: row.blood_type,
    bags: row.bags,
    earliestExpiry: row.earliest_expiry,
  }));
}

/**
 * Build the Demand Forecast table (one row per blood group).
 * Formula: units = round(avgDailyUsage[bg] * rangeDays)
 */
function buildDemandTable(avgUsageMap, days) {
  return BLOOD_GROUPS
    .map(bg => ({
      bloodGroup: bg,
      units: Math.round(avgUsageMap[bg] * days),
      fill: BLOOD_GROUP_COLORS[bg],
    }))
    .sort((a, b) => b.units - a.units);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate Smart Recommendations dynamically.
 *
 * increase: blood groups expected to run out within the selected period
 * reduce:   blood groups with daysLeft > 3× the period AND stock >= 10
 * maintain: everything else that has some stock
 */
function buildRecommendations(stockMap, avgUsageMap, days) {
  const increase = [];
  const reduce   = [];
  const maintain = [];

  BLOOD_GROUPS.forEach(bg => {
    const stock = stockMap[bg];
    const avg   = avgUsageMap[bg];
    const daysLeft = avg > 0 ? stock / avg : (stock > 0 ? Infinity : 0);

    if (daysLeft < days) {
      increase.push(bg);
    } else if (daysLeft > days * 3 && stock >= 10) {
      reduce.push(bg);
    } else if (stock > 0) {
      maintain.push(bg);
    }
  });

  const increaseFooter = increase.length > 0
    ? `These groups may run out within the next ${days} days.`
    : 'No groups require increased collection at this time.';

  const reduceFooter = reduce.length > 0
    ? `Stock will be sufficient for more than ${days * 3} days.`
    : 'No groups have excess stock requiring reduction.';

  const maintainFooter = maintain.length > 0
    ? 'Current stock is expected to be adequate for the period.'
    : 'No groups are at a stable maintenance level.';

  return {
    increase: {
      subtitle: increase.length > 0 ? 'High demand & low stock predicted' : 'No urgent need identified',
      items: increase,
      footer: increaseFooter,
    },
    reduce: {
      subtitle: reduce.length > 0 ? 'Overstock predicted' : 'No overstock detected',
      items: reduce,
      footer: reduceFooter,
    },
    maintain: {
      subtitle: maintain.length > 0 ? 'Stable levels' : 'No groups at stable level',
      items: maintain,
      footer: maintainFooter,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Key Insights
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate 4 dynamic Key Insights based on actual calculations.
 */
function buildInsights(stockMap, avgUsageMap, expiryCount, totalStock, totalDemand, days) {
  const insights = [];

  // 1. Most consumed blood group (highest avgDailyUsage)
  const topBg = BLOOD_GROUPS.reduce((best, bg) =>
    avgUsageMap[bg] > (avgUsageMap[best] ?? 0) ? bg : best,
    BLOOD_GROUPS[0]
  );
  const topUnits = Math.round(avgUsageMap[topBg] * days);
  if (topUnits > 0) {
    insights.push({
      icon: 'drop',
      textBefore: '',
      textBold: topBg,
      textAfter: ` is the most consumed blood group (${topUnits} units expected in ${days} days).`,
    });
  } else {
    insights.push({
      icon: 'drop',
      textBefore: 'No consumption history found for this hospital. ',
      textBold: 'Add consumption records',
      textAfter: ' to generate demand forecasts.',
    });
  }

  // 2. Expiry rate
  const expiryRate = totalStock > 0
    ? ((expiryCount / totalStock) * 100).toFixed(1)
    : '0.0';
  insights.push({
    icon: 'clock',
    textBefore: '',
    textBold: 'Expiry rate:',
    textAfter: ` ${expiryRate}% of current stock (${expiryCount} bags) may expire within the selected period.`,
  });

  // 3. Expected dispatches (total demand)
  insights.push({
    icon: 'truck',
    textBefore: '',
    textBold: `${totalDemand} units`,
    textAfter: ` are expected to be dispatched over the next ${days} days.`,
  });

  // 4. Highest expiry risk (blood group with most expiring bags)
  const highestExpiryRisk = BLOOD_GROUPS.reduce((best, bg) => {
    return (stockMap[bg] ?? 0) > (stockMap[best] ?? 0) ? bg : best;
  }, BLOOD_GROUPS[0]);
  const criticalGroups = BLOOD_GROUPS.filter(bg => {
    const avg = avgUsageMap[bg];
    const stock = stockMap[bg];
    return avg > 0 && stock / avg <= 3;
  });

  if (criticalGroups.length > 0) {
    insights.push({
      icon: 'trend',
      textBefore: '',
      textBold: `${criticalGroups.length} blood group${criticalGroups.length > 1 ? 's' : ''}`,
      textAfter: ` (${criticalGroups.join(', ')}) are at critical risk of running out within 3 days.`,
    });
  } else {
    insights.push({
      icon: 'trend',
      textBefore: 'Inventory trajectory is ',
      textBold: 'stable',
      textAfter: `. No blood groups predicted to run out within 3 days.`,
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the full prediction payload for a given hospital and date range.
 *
 * @param {number} hospitalId
 * @param {string} fromDate  YYYY-MM-DD (today or future)
 * @param {string} toDate    YYYY-MM-DD (>= fromDate)
 * @returns {Promise<PredictionResponse>}
 */
export async function getPrediction(hospitalId, fromDate, toDate) {
  const days = rangeDays(fromDate, toDate);

  // Fetch all data in parallel from the repository
  const [
    stockRows,
    expiryRows,
    consumptionRows,
    dailyRows,
    activeDays,
    totalStock,
  ] = await Promise.all([
    repo.getCurrentStockByType(hospitalId),
    repo.getExpiringBagsInRange(hospitalId, fromDate, toDate),
    repo.getTotalConsumptionByType(hospitalId, LOOKBACK_DAYS),
    repo.getDailyConsumptionHistory(hospitalId, LOOKBACK_DAYS),
    repo.getActiveDaysCount(hospitalId, LOOKBACK_DAYS),
    repo.getTotalAvailableStock(hospitalId),
  ]);

  // Build lookup maps
  const stockMap    = buildStockMap(stockRows);
  const avgUsageMap = buildAvgUsageMap(consumptionRows);
  const dailyArrays = buildDailyUsageArrays(dailyRows);

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const willRunOut   = calcWillRunOut(stockMap, avgUsageMap, days);
  const mayExpire    = calcMayExpire(expiryRows);
  const totalDemand  = calcTotalDemand(avgUsageMap, days);
  const healthScore  = calcHealthScore(stockMap, avgUsageMap, mayExpire, totalStock, totalDemand, days);
  const aiConfidence = calcAiConfidence(avgUsageMap, dailyArrays, activeDays);

  // ── Table Builders ────────────────────────────────────────────────────────
  const runout  = buildRunoutTable(stockMap, avgUsageMap, days);
  const expiry  = {
    summary: { count: mayExpire },
    items:   buildExpiryTable(expiryRows),
  };
  const demand  = buildDemandTable(avgUsageMap, days);

  // ── Recommendations & Insights ────────────────────────────────────────────
  const recommendations = buildRecommendations(stockMap, avgUsageMap, days);
  const insights        = buildInsights(stockMap, avgUsageMap, mayExpire, totalStock, totalDemand, days);

  // ── Date metadata (used by frontend) ─────────────────────────────────────
  const dateInfo = {
    historicalFrom: fromDate,
    historicalTo:   toDate,
    futureEnd:      toDate,
    daysInPeriod:   days,
    isHistorical:   false,   // prediction engine always forward-looking
  };

  return {
    kpis: {
      willRunOut,
      mayExpire,
      totalDemand,
      healthScore,
      healthLabel: healthLabel(healthScore),
      aiConfidence,
      aiLabel: aiLabel(aiConfidence),
    },
    runout,
    expiry,
    demand,
    recommendations,
    insights,
    dateInfo,
  };
}
