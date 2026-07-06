import { query } from '../db/index.js';
import { logger } from '../utils/logger.js';

// ── GET /api/mobile/favorites ─────────────────────────────────────────────
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;  // UUID from JWT
    const result = await query(
      `SELECT
         fh.id AS favorite_id,
         h.id,
         h.name,
         h.governorate,
         h.address,
         h.phone,
         COALESCE(inv.total_units, 0)::int AS total_units,
         COALESCE(inv.available_types, 0)::int AS available_types,
         fh.created_at AS favorited_at
       FROM favorite_hospitals fh
       JOIN hospitals h ON h.id = fh.hospital_id
       LEFT JOIN (
         SELECT
           hospital_id,
           COUNT(*)::int AS total_units,
           COUNT(DISTINCT blood_type)::int AS available_types
         FROM blood_batches
         WHERE status = 'AVAILABLE'
         GROUP BY hospital_id
       ) inv ON inv.hospital_id = h.id
       WHERE fh.user_id = $1
       ORDER BY fh.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Mobile getFavorites error:', err);
    res.status(500).json({ message: 'Failed to fetch favorites.' });
  }
};

// ── POST /api/mobile/favorites ────────────────────────────────────────────
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;  // UUID
    const { hospitalId } = req.body; // UUID string
    if (!hospitalId) return res.status(400).json({ message: 'hospitalId is required.' });

    const result = await query(
      `INSERT INTO favorite_hospitals (user_id, hospital_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, hospital_id) DO NOTHING
       RETURNING *`,
      [userId, hospitalId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'Already in favorites.' });
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Mobile addFavorite error:', err);
    res.status(500).json({ message: 'Failed to add favorite.' });
  }
};

// ── DELETE /api/mobile/favorites/:hospitalId ──────────────────────────────
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;     // UUID
    const { hospitalId } = req.params;  // UUID string

    await query(
      `DELETE FROM favorite_hospitals WHERE user_id = $1 AND hospital_id = $2`,
      [userId, hospitalId]
    );
    res.status(200).json({ message: 'Removed from favorites.' });
  } catch (err) {
    logger.error('Mobile removeFavorite error:', err);
    res.status(500).json({ message: 'Failed to remove favorite.' });
  }
};

// ── GET /api/mobile/favorites/check/:hospitalId ───────────────────────────
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { hospitalId } = req.params;
    const result = await query(
      `SELECT id FROM favorite_hospitals WHERE user_id = $1 AND hospital_id = $2`,
      [userId, hospitalId]
    );
    res.json({ isFavorite: result.rows.length > 0 });
  } catch (err) {
    logger.error('Mobile checkFavorite error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
