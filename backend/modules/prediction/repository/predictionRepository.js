/**
 * prediction/repository/predictionRepository.js
 *
 * All raw SQL queries for the prediction module.
 * Contains NO business logic — only data retrieval.
 */

import { query } from '../../../src/db/index.js';

const TZ = 'UTC';

/**
 * Current available stock count per blood type.
 * @param {number} hospitalId
 * @returns {Promise<Array<{ blood_type: string, units: number }>>}
 */
export async function getCurrentStockByType(hospitalId) {
  const res = await query(
    `SELECT blood_type, COUNT(*)::int AS units
     FROM blood_batches
     WHERE hospital_id = $1
       AND status = 'AVAILABLE'
     GROUP BY blood_type`,
    [hospitalId]
  );
  return res.rows;
}

/**
 * Bags whose expiry_date falls within [fromDate, toDate].
 * Returns per-type counts and earliest expiry date.
 * @param {number} hospitalId
 * @param {string} fromDate  YYYY-MM-DD
 * @param {string} toDate    YYYY-MM-DD
 * @returns {Promise<Array<{ blood_type: string, bags: number, earliest_expiry: string }>>}
 */
export async function getExpiringBagsInRange(hospitalId, fromDate, toDate) {
  const res = await query(
    `SELECT
       blood_type,
       COUNT(*)::int                             AS bags,
       TO_CHAR(MIN(expiry_date), 'DD Mon YYYY')  AS earliest_expiry
     FROM blood_batches
     WHERE hospital_id = $1
       AND status = 'AVAILABLE'
       AND expiry_date >= $2::date
       AND expiry_date <= $3::date
     GROUP BY blood_type
     ORDER BY MIN(expiry_date) ASC`,
    [hospitalId, fromDate, toDate]
  );
  return res.rows;
}

/**
 * Daily consumption (REMOVE transactions) over the last N days.
 * Used to derive average daily usage per blood type.
 * @param {number} hospitalId
 * @param {number} lookbackDays  e.g. 30
 * @returns {Promise<Array<{ blood_type: string, consumed_day: string, consumed: number }>>}
 */
export async function getDailyConsumptionHistory(hospitalId, lookbackDays) {
  const res = await query(
    `SELECT
       blood_type,
       TO_CHAR(DATE(timestamp AT TIME ZONE $1), 'YYYY-MM-DD') AS consumed_day,
       SUM(quantity)::int                                       AS consumed
     FROM transactions
     WHERE hospital_id = $2
       AND type = 'REMOVE'
       AND timestamp AT TIME ZONE $1 >= (CURRENT_DATE - ($3 || ' days')::interval)
     GROUP BY blood_type, DATE(timestamp AT TIME ZONE $1)
     ORDER BY blood_type, consumed_day ASC`,
    [TZ, hospitalId, lookbackDays]
  );
  return res.rows;
}

/**
 * Total consumed units per blood type over the last N days.
 * @param {number} hospitalId
 * @param {number} lookbackDays
 * @returns {Promise<Array<{ blood_type: string, total_consumed: number }>>}
 */
export async function getTotalConsumptionByType(hospitalId, lookbackDays) {
  const res = await query(
    `SELECT
       blood_type,
       SUM(quantity)::int AS total_consumed
     FROM transactions
     WHERE hospital_id = $1
       AND type = 'REMOVE'
       AND timestamp AT TIME ZONE $2 >= (CURRENT_DATE - ($3 || ' days')::interval)
     GROUP BY blood_type`,
    [hospitalId, TZ, lookbackDays]
  );
  return res.rows;
}

/**
 * Count of distinct days that had any transaction activity in the last N days.
 * Used for confidence scoring (historical depth).
 * @param {number} hospitalId
 * @param {number} lookbackDays
 * @returns {Promise<number>}
 */
export async function getActiveDaysCount(hospitalId, lookbackDays) {
  const res = await query(
    `SELECT COUNT(DISTINCT DATE(timestamp AT TIME ZONE $1))::int AS active_days
     FROM transactions
     WHERE hospital_id = $2
       AND type = 'REMOVE'
       AND timestamp AT TIME ZONE $1 >= (CURRENT_DATE - ($3 || ' days')::interval)`,
    [TZ, hospitalId, lookbackDays]
  );
  return res.rows[0]?.active_days ?? 0;
}

/**
 * Total current available stock (all types combined).
 * @param {number} hospitalId
 * @returns {Promise<number>}
 */
export async function getTotalAvailableStock(hospitalId) {
  const res = await query(
    `SELECT COUNT(*)::int AS total
     FROM blood_batches
     WHERE hospital_id = $1
       AND status = 'AVAILABLE'`,
    [hospitalId]
  );
  return res.rows[0]?.total ?? 0;
}
