import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../db/index.js';
import { logger } from '../utils/logger.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const signToken = (userId, governorateId) =>
  jwt.sign({ userId, governorateId, role: 'MOBILE_USER' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

// ── POST /api/mobile/auth/login ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ message: 'Phone and password are required.' });

    // Look up by phone first; fallback to email for hospital-staff accounts
    const result = await query(
      `SELECT * FROM users WHERE phone = $1 OR email = $1 LIMIT 1`,
      [phone.trim()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid phone number or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid phone number or password.' });

    const token = signToken(user.id, null);
    const { password: _pw, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    logger.error('Mobile login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// ── POST /api/mobile/auth/register ────────────────────────────────────────
export const register = async (req, res) => {
  const { fullName, phone, email, password, confirmPassword, governorateId } = req.body;

  // Validation
  if (!fullName || !phone || !password)
    return res.status(400).json({ message: 'Full name, phone, and password are required.' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    // Check phone uniqueness (skipped in development/test environment for testing duplicates)
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      const existing = await client.query(
        `SELECT id FROM users WHERE phone = $1`,
        [phone.trim()]
      );
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Phone number is already registered.' });
      }
    }

    // Resolve governorate name
    let governorateName = null;
    if (governorateId) {
      const govRes = await client.query(`SELECT name FROM governorates WHERE id = $1`, [governorateId]);
      governorateName = govRes.rows[0]?.name || null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert mobile user — no hospital_id (nullable after migration)
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, phone, password, role, governorate)
       VALUES ($1, $2, $3, $4, 'USER', $5)
       RETURNING id, full_name, email, phone, role, governorate, created_at`,
      [
        fullName.trim(),
        email?.trim() || null,
        phone.trim(),
        hashedPassword,
        governorateName,
      ]
    );
    const user = userRes.rows[0];

    await client.query('COMMIT');

    const token = signToken(user.id, governorateId || null);
    res.status(201).json({ token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Mobile register error:', err);
    res.status(500).json({ message: err.message || 'Server error during registration.' });
  } finally {
    release();
  }
};

// ── GET /api/mobile/auth/me ────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, governorate, avatar_url, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
    const u = result.rows[0];
    // Build full avatar URL
    if (u.avatar_url && !u.avatar_url.startsWith('http')) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      u.avatar_url = `${protocol}://${host}/${u.avatar_url}`;
    }
    res.json(u);
  } catch (err) {
    logger.error('Mobile getMe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── POST /api/mobile/auth/avatar ───────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

    const relativePath = `uploads/${req.file.filename}`;
    await query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [relativePath, req.user.userId]);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const avatarUrl = `${protocol}://${host}/${relativePath}`;

    res.json({ avatarUrl });
  } catch (err) {
    logger.error('Mobile uploadAvatar error:', err);
    res.status(500).json({ message: 'Failed to upload avatar.' });
  }
};
