import { query } from '../db/index.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';
import path from 'path';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildImageUrl(req, imageUrl) {
  if (!imageUrl) return null;
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http')) return imageUrl;
  // Build full URL from request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/${imageUrl}`;
}

// ── GET /api/hospitals/profile ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: 'No hospital associated with this account.' });

    const result = await query(
      `SELECT h.id, h.name, h.phone, h.image_url,
              h.open_24_hours, h.opening_time, h.closing_time
       FROM hospitals h
       WHERE h.id = $1`,
      [hospitalId]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Hospital not found.' });

    const h = result.rows[0];
    res.json({
      id: h.id,
      name: h.name,
      phone: h.phone,
      open24Hours: h.open_24_hours,
      openingTime: h.opening_time,
      closingTime: h.closing_time,
      imageUrl: buildImageUrl(req, h.image_url),
    });
  } catch (err) {
    logger.error('getProfile error:', err);
    res.status(500).json({ message: 'Failed to fetch hospital profile.' });
  }
};

// ── PATCH /api/hospitals/profile ───────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: 'No hospital associated with this account.' });

    const { phone, open24Hours, openingTime, closingTime } = req.body;

    const result = await query(
      `UPDATE hospitals
       SET phone = COALESCE($1, phone),
           open_24_hours = COALESCE($2, open_24_hours),
           opening_time = COALESCE($3, opening_time),
           closing_time = COALESCE($4, closing_time)
       WHERE id = $5
       RETURNING id, name, phone, image_url, open_24_hours, opening_time, closing_time`,
      [phone ?? null, open24Hours ?? null, openingTime ?? null, closingTime ?? null, hospitalId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: 'Hospital not found.' });

    const h = result.rows[0];
    res.json({
      id: h.id,
      name: h.name,
      phone: h.phone,
      open24Hours: h.open_24_hours,
      openingTime: h.opening_time,
      closingTime: h.closing_time,
      imageUrl: buildImageUrl(req, h.image_url),
    });
  } catch (err) {
    logger.error('updateProfile error:', err);
    res.status(500).json({ message: 'Failed to update hospital profile.' });
  }
};

// ── POST /api/hospitals/profile/image ──────────────────────────────────────
export const uploadImage = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: 'No hospital associated with this account.' });

    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

    const relativePath = `uploads/${req.file.filename}`;

    await query(
      `UPDATE hospitals SET image_url = $1 WHERE id = $2`,
      [relativePath, hospitalId]
    );

    const imageUrl = buildImageUrl(req, relativePath);
    res.json({ imageUrl });
  } catch (err) {
    logger.error('uploadImage error:', err);
    res.status(500).json({ message: 'Failed to upload image.' });
  }
};

// ── PATCH /api/hospitals/profile/password ─────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword)
      return res.status(400).json({ message: 'All password fields are required.' });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: 'New passwords do not match.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const result = await query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    logger.error('changePassword error:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};
