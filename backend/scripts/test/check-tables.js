import { query } from '../../src/db/index.js';

async function main() {
  try {
    // List tables
    const tablesRes = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in public schema:', tablesRes.rows.map(r => r.table_name));

    // Check each table's schema
    for (const table of tablesRes.rows) {
      console.log(`\n=== ${table.table_name} ===`);
      const colsRes = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [table.table_name]);
      console.table(colsRes.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
