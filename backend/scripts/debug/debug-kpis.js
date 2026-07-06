import { query } from '../../src/db/index.js';

(async () => {
  try {
    const hospitalId = '344cc3c6-56f6-4c90-a959-b9d7b0abfd61'; // example hospital id from logs
    
    // Average Daily Usage
    const avgUsageRes = await query(
      `SELECT 
         SUM(CASE WHEN type = 'REMOVE' THEN quantity ELSE 0 END) as total_removed,
         COUNT(DISTINCT DATE(timestamp)) as days_with_transactions
       FROM transactions
       WHERE hospital_id = $1`,
      [hospitalId]
    );
    console.log('Avg usage numbers:', avgUsageRes.rows[0]);

    // Top Consumed
    const topConsumedRes = await query(
      `SELECT blood_type, SUM(quantity) as total_quantity
       FROM transactions
       WHERE hospital_id = $1 AND type = 'REMOVE'
       GROUP BY blood_type
       ORDER BY total_quantity DESC
       LIMIT 1`,
      [hospitalId]
    );
    console.log('Top consumed:', topConsumedRes.rows[0]);
    
  } catch (err) {
    console.error(err);
  }
})();
