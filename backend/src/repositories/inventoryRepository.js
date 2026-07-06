import { query } from '../db/index.js';

export const getAvailableBatchesFIFO = async (client, hospitalId, bloodType, quantity) => {
  const result = await client.query(
    `SELECT * FROM blood_batches 
     WHERE hospital_id = $1 AND blood_type = $2 AND status = 'AVAILABLE'
     ORDER BY expiry_date ASC, created_at ASC
     LIMIT $3`,
    [hospitalId, bloodType, quantity]
  );
  return result.rows;
};

export const updateBatchStatus = async (client, batchId, status) => {
  await client.query(
    'UPDATE blood_batches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, batchId]
  );
};

export const addBatch = async (client, { hospital_id, batch_number, blood_type, expiry_date, collection_date, batch_code }) => {
  const result = await client.query(
    `INSERT INTO blood_batches (hospital_id, batch_number, blood_type, expiry_date, collection_date, status, batch_code)
     VALUES ($1, $2, $3, $4, $5, 'AVAILABLE', $6) RETURNING *`,
    [hospital_id, batch_number, blood_type, expiry_date, collection_date, batch_code]
  );
  return result.rows[0];
};

export const createTransaction = async (client, { hospital_id, batch_id, type, blood_type, component, quantity, reason }) => {
  const result = await client.query(
    `INSERT INTO transactions (hospital_id, batch_id, type, blood_type, component, quantity, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [hospital_id, batch_id, type, blood_type, component, quantity, reason]
  );
  return result.rows[0];
};

export const getInventorySummary = async (hospitalId) => {
  const result = await query(
    `SELECT blood_type, COUNT(*) as units
     FROM blood_batches
     WHERE hospital_id = $1 AND status = 'AVAILABLE'
     GROUP BY blood_type`,
    [hospitalId]
  );
  return result.rows;
};

export const getInventoryAggregated = async (hospitalId) => {
  const result = await query(
    `SELECT
       blood_type,
       COALESCE(component::text, 'WHOLE_BLOOD') AS component,
       COUNT(*)::int AS units_in_stock
     FROM blood_batches
     WHERE hospital_id = $1 AND status = 'AVAILABLE'
     GROUP BY blood_type, component
     ORDER BY blood_type, component`,
    [hospitalId]
  );
  return result.rows;
};

export const getAvailableBatchesForDisplay = async (hospitalId) => {
  const result = await query(
    `SELECT
       bb.id,
       bb.batch_code,
       bb.blood_type,
       bb.expiry_date,
       counts.total_units
     FROM blood_batches bb
     JOIN (
       SELECT blood_type, COUNT(*)::int AS total_units
       FROM blood_batches
       WHERE hospital_id = $1 AND status = 'AVAILABLE'
       GROUP BY blood_type
     ) counts ON bb.blood_type = counts.blood_type
     WHERE bb.hospital_id = $1 AND bb.status = 'AVAILABLE'
     ORDER BY bb.blood_type, bb.created_at ASC`,
    [hospitalId]
  );
  return result.rows;
};

export const getTransactionsToday = async (hospitalId) => {
  const result = await query(
    `SELECT type, COUNT(*) as count
     FROM transactions
     WHERE hospital_id = $1 AND timestamp >= CURRENT_DATE
     GROUP BY type`,
    [hospitalId]
  );
  return result.rows;
};

export const getAddedTodayCount = async (hospitalId) => {
  const result = await query(
    `SELECT COUNT(*)::int as count 
     FROM blood_batches 
     WHERE hospital_id = $1 AND created_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`,
    [hospitalId]
  );
  return result.rows[0].count;
};

export const getRemovedTodayCount = async (hospitalId) => {
  const result = await query(
    `SELECT COUNT(*)::int as count 
     FROM blood_batches 
     WHERE hospital_id = $1 
       AND (
         (status = 'USED' AND updated_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')) OR 
         (status = 'IN_TRANSFER' AND updated_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')) OR
         (status = 'DISPOSED' AND (disposed_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') OR updated_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')))
       )`,
    [hospitalId]
  );
  return result.rows[0].count;
};

export const getInventoryBatchesList = async (hospitalId) => {
  const result = await query(
    `SELECT * FROM blood_batches
     WHERE hospital_id = $1
     ORDER BY created_at DESC`,
    [hospitalId]
  );
  return result.rows;
};

export const getAverageDailyUsage = async (hospitalId) => {
  const result = await query(
    `WITH daily_usage AS (
      SELECT 
        DATE(timestamp AT TIME ZONE 'UTC') AS usage_date,
        SUM(quantity) AS total_used
      FROM transactions
      WHERE hospital_id = $1 AND type = 'REMOVE'
      GROUP BY DATE(timestamp AT TIME ZONE 'UTC')
    )
    SELECT 
      COALESCE(SUM(total_used), 0) AS total_used,
      COUNT(*) AS days_with_transactions
    FROM daily_usage`,
    [hospitalId]
  );
  const row = result.rows[0];
  const avg = row.days_with_transactions > 0 ? row.total_used / row.days_with_transactions : 0;
  return Math.round(avg * 10) / 10;
};

export const getTopConsumed = async (hospitalId) => {
  const result = await query(
    `SELECT 
      blood_type,
      SUM(quantity)::int AS total_consumed
    FROM transactions
    WHERE hospital_id = $1 AND type = 'REMOVE'
    GROUP BY blood_type
    ORDER BY total_consumed DESC
    LIMIT 1`,
    [hospitalId]
  );
  return result.rows.length > 0 ? result.rows[0] : { blood_type: '—', total_consumed: 0 };
};
