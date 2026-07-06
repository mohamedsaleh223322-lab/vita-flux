import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add hospital profile columns
    await client.query(`
      ALTER TABLE hospitals
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS open_24_hours BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS opening_time VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
        ADD COLUMN IF NOT EXISTS closing_time VARCHAR(20) NOT NULL DEFAULT '08:00 PM';
    `);
    console.log('✅ hospitals: added image_url, open_24_hours, opening_time, closing_time');

    // Add avatar_url to users table
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    console.log('✅ users: added avatar_url');

    await client.query('COMMIT');
    console.log('✅ Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
