import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  console.log('Testing connection with config:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Database time:', res.rows[0].now);

    // check tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tablesRes.rows.map(r => r.table_name));

    if (tablesRes.rows.some(r => r.table_name === 'blood_batches')) {
      const countRes = await pool.query('SELECT COUNT(*) FROM blood_batches');
      console.log('Total rows in blood_batches:', countRes.rows[0].count);

      const availableRes = await pool.query("SELECT COUNT(*) FROM blood_batches WHERE status = 'AVAILABLE'");
      console.log("Available rows (status = 'AVAILABLE'):", availableRes.rows[0].count);

      const sample = await pool.query('SELECT * FROM blood_batches LIMIT 3');
      console.log('Sample rows:', sample.rows);
    } else {
      console.log('blood_batches table does not exist in the database!');
    }

  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await pool.end();
  }
}

main();
