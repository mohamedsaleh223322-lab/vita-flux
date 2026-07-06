/**
 * frontend/src/api/predictionClient.js
 *
 * Thin client for the Prediction & Intelligence backend module.
 * All calculation stays on the backend — frontend only renders.
 */

import { apiFetch } from './apiFetch.js';

/**
 * Fetch a full prediction payload from the dedicated prediction endpoint.
 *
 * @param {string} fromDate  YYYY-MM-DD — must be today or future
 * @param {string} toDate    YYYY-MM-DD — must be >= fromDate
 * @returns {Promise<import('../pages/SmartForecastPage.jsx').PredictionResponse>}
 * @throws  Will throw an Error with `message` and `status` on HTTP error.
 *          Callers should inspect err.status === 400 + err.body.isPastDate
 *          to distinguish validation errors from server errors.
 */
export async function fetchPrediction(fromDate, toDate) {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate)   params.append('toDate',   toDate);
  return apiFetch(`/api/prediction?${params.toString()}`);
}
