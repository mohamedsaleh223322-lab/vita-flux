/**
 * prediction/validators/predictionValidators.js
 *
 * Validates the fromDate / toDate query parameters for the prediction endpoint.
 *
 * Rules:
 *  1. Both params must be present.
 *  2. Both must be valid YYYY-MM-DD date strings.
 *  3. fromDate must be >= today (prediction engine is forward-looking only).
 *  4. toDate must be >= fromDate.
 */

import { todayISO } from '../utils/predictionUtils.js';

/**
 * @param {string|undefined} fromDate
 * @param {string|undefined} toDate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePredictionRange(fromDate, toDate) {
  // 1. Presence check
  if (!fromDate || !toDate) {
    return {
      valid: false,
      error: 'Both fromDate and toDate are required (YYYY-MM-DD).',
    };
  }

  // 2. Format check — must be parseable dates
  const from = new Date(fromDate);
  const to   = new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format. Use YYYY-MM-DD.',
    };
  }

  // 3. fromDate must be >= today (no past dates)
  const today = new Date(todayISO()); // midnight UTC
  if (from < today) {
    return {
      valid: false,
      error: 'Prediction engine only supports current and future dates.',
      isPastDate: true,
    };
  }

  // 4. toDate must be >= fromDate
  if (to < from) {
    return {
      valid: false,
      error: 'toDate must be on or after fromDate.',
    };
  }

  return { valid: true, error: null };
}
