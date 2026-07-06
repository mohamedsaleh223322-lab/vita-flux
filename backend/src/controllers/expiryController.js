import { query } from '../db/index.js';
import { emitToHospital } from '../sockets/index.js';
import { logger } from '../utils/logger.js';

export const getExpiringSoon = async (req, res) => {
  try {
    const result = await query(
      `SELECT id as batch_id, batch_code, blood_type, expiry_date, created_at, status,
              (expiry_date - CURRENT_DATE) as days_left
       FROM blood_batches 
       WHERE hospital_id = $1 AND status = 'AVAILABLE' 
       AND expiry_date > CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY expiry_date ASC`,
      [req.user.hospitalId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error in getExpiringSoon:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getExpired = async (req, res) => {
  try {
    const result = await query(
      `SELECT id as batch_id, batch_code, blood_type, expiry_date, created_at, status,
              (CURRENT_DATE - expiry_date) as expired_days_ago
       FROM blood_batches 
       WHERE hospital_id = $1 AND status != 'DISPOSED' AND expiry_date < CURRENT_DATE
       ORDER BY expiry_date DESC`,
      [req.user.hospitalId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error in getExpired:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getLowStock = async (req, res) => {
  const THRESHOLD = 5;
  try {
    const result = await query(
      `SELECT blood_type, COUNT(*) as remaining_bags, $2::int as threshold, 'low_stock' as status
       FROM blood_batches
       WHERE hospital_id = $1 AND status = 'AVAILABLE' AND expiry_date >= CURRENT_DATE
       GROUP BY blood_type
       HAVING COUNT(*) <= $2`,
      [req.user.hospitalId, THRESHOLD]
    );
    res.json(result.rows.map(r => ({ ...r, remaining_bags: parseInt(r.remaining_bags) })));
  } catch (err) {
    logger.error('Error in getLowStock:', err);
    res.status(500).json({ message: err.message });
  }
};

export const disposeBatch = async (req, res) => {
  const { batchId } = req.params;
  try {
    const result = await query(
      `UPDATE blood_batches 
       SET status = 'DISPOSED', disposed_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND hospital_id = $2
       RETURNING *`,
      [batchId, req.user.hospitalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Batch not found or unauthorized' });
    }

    const batch = result.rows[0];
    
    // Create transaction record
    await query(
      `INSERT INTO transactions (hospital_id, batch_id, type, blood_type, component, quantity, reason)
       VALUES ($1, $2, 'DISPOSE', $3, $4, 1.0, 'Expired batch manually disposed')`,
      [req.user.hospitalId, batchId, batch.blood_type, batch.component]
    );

    emitToHospital(req.user.hospitalId, 'batch_disposed', { batchId });
    emitToHospital(req.user.hospitalId, 'inventory_updated', { bloodType: batch.blood_type });

    res.json({ message: 'Batch disposed successfully' });
  } catch (err) {
    logger.error('Error in disposeBatch:', err);
    res.status(500).json({ message: err.message });
  }
};
