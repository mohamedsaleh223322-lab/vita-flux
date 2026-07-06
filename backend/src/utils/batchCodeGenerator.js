import { query } from '../db/index.js';

/**
 * Generates an array of sequential, concurrent-safe batch codes for the current year.
 * Format: BB-YYYY-XXXXXX (e.g. BB-2026-000123)
 * 
 * @param {object} client - The DB client (usually transactional)
 * @param {number} count - Number of codes to generate
 * @returns {Promise<string[]>} Array of generated batch codes
 */
export const generateBatchCodes = async (client, count) => {
  const db = client || { query };
  const year = new Date().getFullYear();
  const prefix = `BB-${year}-`;
  
  // Concurrency safety: obtain a transaction-level advisory lock for the current year.
  // This blocks concurrent inserts from generating the same numbers at the same time.
  const lockKey = 123456000 + year;
  await db.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

  // Retrieve the latest batch_code for the current year
  const result = await db.query(
    `SELECT batch_code FROM blood_batches 
     WHERE batch_code LIKE $1 
     ORDER BY batch_code DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  let startNum = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].batch_code;
    if (lastCode) {
      const parts = lastCode.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          startNum = lastNum + 1;
        }
      }
    }
  }

  const codes = [];
  for (let i = 0; i < count; i++) {
    const num = startNum + i;
    const paddedNum = String(num).padStart(6, '0');
    codes.push(`${prefix}${paddedNum}`);
  }
  
  return codes;
};
