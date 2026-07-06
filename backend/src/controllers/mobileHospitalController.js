import { query } from '../db/index.js';
import { logger } from '../utils/logger.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildImageUrl(req, imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/${imageUrl}`;
}

// ── GET /api/mobile/governorates ──────────────────────────────────────────
export const getGovernorates = async (req, res) => {
  try {
    const result = await query(`SELECT id, name FROM governorates ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    logger.error('Mobile getGovernorates error:', err);
    res.status(500).json({ message: 'Failed to fetch governorates.' });
  }
};

// ── GET /api/mobile/hospitals?governorateId=:id ────────────────────────────
export const getHospitals = async (req, res) => {
  const { governorateId, search } = req.query;
  try {
    let sql = `
      SELECT
        h.id,
        h.name,
        h.governorate,
        h.address,
        h.phone,
        h.image_url,
        h.open_24_hours,
        h.opening_time,
        h.closing_time,
        true AS has_blood_bank,
        COALESCE(inv.total_units, 0)::int AS total_units,
        COALESCE(inv.available_types, 0)::int AS blood_types_count,
        CASE WHEN COALESCE(inv.total_units, 0) > 0 THEN 'available' ELSE 'unavailable' END AS stock_status
      FROM hospitals h
      LEFT JOIN (
        SELECT
          hospital_id,
          COUNT(*)::int AS total_units,
          COUNT(DISTINCT blood_type)::int AS available_types
        FROM blood_batches
        WHERE status = 'AVAILABLE'
        GROUP BY hospital_id
      ) inv ON inv.hospital_id = h.id
    `;
    const params = [];

    if (governorateId) {
      sql += ` JOIN governorates g ON h.governorate = g.name WHERE g.id = $${params.length + 1}`;
      params.push(parseInt(governorateId, 10));
    }

    if (search) {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ` (h.name ILIKE $${params.length + 1} OR h.address ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY h.name ASC`;

    const result = await query(sql, params);

    const rows = result.rows.map((h) => ({
      id: h.id,
      name: h.name,
      governorate: h.governorate,
      address: h.address,
      phone: h.phone,
      imageUrl: buildImageUrl(req, h.image_url),
      open24Hours: h.open_24_hours,
      openingTime: h.opening_time,
      closingTime: h.closing_time,
      hasBloodBank: h.has_blood_bank,
      stockStatus: h.stock_status,
      totalUnits: h.total_units,
      bloodTypesCount: h.blood_types_count,
      // Legacy fields for backward compat
      total_units: h.total_units,
      available_types: h.blood_types_count,
    }));

    res.json(rows);
  } catch (err) {
    logger.error('Mobile getHospitals error:', err);
    res.status(500).json({ message: 'Failed to fetch hospitals.' });
  }
};

// ── GET /api/mobile/hospitals/:id ─────────────────────────────────────────
export const getHospitalById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
         h.id,
         h.name,
         h.governorate,
         h.address,
         h.phone,
         h.image_url,
         h.open_24_hours,
         h.opening_time,
         h.closing_time,
         true AS has_blood_bank,
         COALESCE(inv.total_units, 0)::int AS total_units,
         COALESCE(inv.available_types, 0)::int AS blood_types_count,
         CASE WHEN COALESCE(inv.total_units, 0) > 0 THEN 'available' ELSE 'unavailable' END AS stock_status
       FROM hospitals h
       LEFT JOIN (
         SELECT
           hospital_id,
           COUNT(*)::int AS total_units,
           COUNT(DISTINCT blood_type)::int AS available_types
         FROM blood_batches
         WHERE status = 'AVAILABLE'
         GROUP BY hospital_id
       ) inv ON inv.hospital_id = h.id
       WHERE h.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Hospital not found.' });

    const h = result.rows[0];
    res.json({
      id: h.id,
      name: h.name,
      governorate: h.governorate,
      address: h.address,
      phone: h.phone,
      imageUrl: buildImageUrl(req, h.image_url),
      open24Hours: h.open_24_hours,
      openingTime: h.opening_time,
      closingTime: h.closing_time,
      hasBloodBank: h.has_blood_bank,
      stockStatus: h.stock_status,
      totalUnits: h.total_units,
      bloodTypesCount: h.blood_types_count,
      // Legacy fields for backward compat
      total_units: h.total_units,
      available_types: h.blood_types_count,
    });
  } catch (err) {
    logger.error('Mobile getHospitalById error:', err);
    res.status(500).json({ message: 'Failed to fetch hospital.' });
  }
};

// ── GET /api/mobile/hospitals/:id/inventory ────────────────────────────────
export const getHospitalInventory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
         blood_type,
         COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_units
       FROM blood_batches
       WHERE hospital_id = $1
       GROUP BY blood_type
       ORDER BY blood_type`,
      [id]
    );

    const ALL_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const map = {};
    for (const row of result.rows) {
      map[row.blood_type] = parseInt(row.available_units, 10) || 0;
    }

    const inventory = ALL_TYPES.map((bt) => ({
      blood_type: bt,
      available_units: map[bt] ?? 0,
    }));

    res.json({
      hospital_id: id,
      inventory,
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Mobile getHospitalInventory error:', err);
    res.status(500).json({ message: 'Failed to fetch inventory.' });
  }
};
