import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/4th/backend/.env' });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  try {
    console.log('Env config loaded:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    
    // Check users columns
    const columnsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('--- Columns of users table ---');
    console.table(columnsRes.rows);

    // Check users constraints
    const constraintsRes = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'users'::regclass
    `);
    console.log('--- Constraints of users table ---');
    console.table(constraintsRes.rows);

    // Check role enum values
    try {
      const enumRes = await pool.query(`
        SELECT e.enumlabel 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' OR t.typname = 'role'
      `);
      console.log('--- Enum values for role ---');
      console.table(enumRes.rows);
    } catch (e) {
      console.error('Error fetching enum values:', e.message);
    }

    // Check governorates rows
    try {
      const govRes = await pool.query('SELECT * FROM governorates');
      console.log('--- Governorates ---');
      console.table(govRes.rows);
    } catch (e) {
      console.error('Error fetching governorates:', e.message);
    }
  } catch (err) {
    console.error('DB Connection error:', err);
  } finally {
    await pool.end();
  }
}

main();
