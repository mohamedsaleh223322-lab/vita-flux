// backend/src/controllers/analyticsController.js
import * as analyticsService from '../services/analyticsService.js';
import { query } from '../db/index.js';

export const getReports = async (req, res) => {
  const { fromDate, toDate } = req.query;
  try {
    const data = await analyticsService.getSmartReport(req.user.hospitalId, { fromDate, toDate });
    res.json(data);
  } catch (err) {
    console.error('[analyticsController.getReports]', err);
    res.status(500).json({ message: err.message });
  }
};

export const getForecast = async (req, res) => {
  const { fromDate, toDate } = req.query;
  try {
    const data = await analyticsService.getForecast(req.user.hospitalId, { fromDate, toDate });
    res.json(data);
  } catch (err) {
    console.error('[analyticsController.getForecast]', err);
    res.status(500).json({ message: err.message });
  }
};

export const getExpiring = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, batch_code, blood_type AS "bloodType", 1 AS quantity,
              expiry_date AS "expiryDate", created_at, status
       FROM blood_batches
       WHERE hospital_id = $1 AND status = 'AVAILABLE'
         AND expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '7 days')
       ORDER BY expiry_date ASC`,
      [req.user.hospitalId]
    );
    res.json({ batches: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpired = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, batch_code, blood_type AS "bloodType", 1 AS quantity,
              expiry_date AS "expiryDate", created_at, status
       FROM blood_batches
       WHERE hospital_id = $1 AND status = 'EXPIRED'
       ORDER BY expiry_date DESC`,
      [req.user.hospitalId]
    );
    res.json({ batches: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLowStock = async (req, res) => {
  try {
    const result = await query(
      `SELECT blood_type AS "bloodType", COUNT(*)::int AS units
       FROM blood_batches
       WHERE hospital_id = $1 AND status = 'AVAILABLE'
       GROUP BY blood_type
       HAVING COUNT(*) < 5
       ORDER BY units ASC`,
      [req.user.hospitalId]
    );
    res.json({ alerts: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};