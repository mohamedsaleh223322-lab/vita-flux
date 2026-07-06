import { getClient } from './index.js';

export const runMigrations = async () => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');
    console.log('Running migrate.js migrations...');

    // Add expiry_date column to blood_requests if it doesn't exist
    await client.query(`
      ALTER TABLE blood_requests 
      ADD COLUMN IF NOT EXISTS expiry_date DATE;
    `);
    console.log('Column expiry_date checked/added to blood_requests.');

    // ── Mobile app migrations ──────────────────────────────────────────────

    // Create favorite_hospitals table for mobile citizens
    // Note: BOTH users.id and hospitals.id are UUID in this schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorite_hospitals (
        id          SERIAL PRIMARY KEY,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, hospital_id)
      );
    `);
    console.log('Table favorite_hospitals checked/created.');

    // Add phone index to users for fast mobile login lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);
    console.log('Index idx_users_phone checked/created.');

    // Allow mobile citizen users to have NULL hospital_id
    // (hospital-staff users still have a hospital_id)
    await client.query(`
      ALTER TABLE users ALTER COLUMN hospital_id DROP NOT NULL;
    `).catch(() => {
      // Column may already be nullable — ignore
      console.log('hospital_id already nullable or alter not needed.');
    });

    // Allow users to register without an email
    await client.query(`
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    `).catch((err) => {
      console.log('email column already nullable or alter failed:', err.message);
    });

    // Drop unique constraint on email column
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    `).catch((err) => {
      console.log('Failed to drop unique constraint users_email_key:', err.message);
    });

    await client.query('COMMIT');
    console.log('migrate.js migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('migrate.js migration failed:', err);
    throw err;
  } finally {
    release();
  }
};
