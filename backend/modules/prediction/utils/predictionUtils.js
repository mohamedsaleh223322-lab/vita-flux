/**
 * prediction/utils/predictionUtils.js
 * Pure helpers and constants — no DB, no business logic.
 */

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Demand-bar fill colour per blood group */
export const BLOOD_GROUP_COLORS = {
  'A+':  '#DC2626',
  'A-':  '#16A34A',
  'B+':  '#0D9488',
  'B-':  '#3B82F6',
  'AB+': '#7C3AED',
  'AB-': '#DB2777',
  'O+':  '#0891B2',
  'O-':  '#166534',
};

/**
 * Classify days-left into a risk level.
 * @param {number} daysLeft
 * @returns {'Critical'|'High Risk'|'Moderate'|'Safe'}
 */
export function classifyRisk(daysLeft) {
  if (!isFinite(daysLeft) || daysLeft > 90) return 'Safe';
  if (daysLeft <= 3)  return 'Critical';
  if (daysLeft <= 7)  return 'High Risk';
  if (daysLeft <= 14) return 'Moderate';
  return 'Safe';
}

/**
 * Format days remaining as a human-readable string.
 * @param {number} daysLeft
 * @param {number} rangeDays  length of the selected period
 */
export function formatDaysLeft(daysLeft, rangeDays) {
  if (!isFinite(daysLeft) || daysLeft > rangeDays * 2) return `>${rangeDays * 2} days`;
  return `${Math.round(daysLeft)} days`;
}

/**
 * Return today's date in YYYY-MM-DD format (local, UTC-safe comparison).
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate number of calendar days between two YYYY-MM-DD strings (inclusive on both ends).
 * Minimum is 1.
 */
export function rangeDays(fromDate, toDate) {
  const diffMs = new Date(toDate) - new Date(fromDate);
  return Math.max(1, Math.round(diffMs / 86_400_000) + 1);
}

/**
 * Return YYYY-MM-DD for N days before today.
 */
export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Simple standard deviation of an array of numbers.
 */
export function stdDev(arr) {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}
