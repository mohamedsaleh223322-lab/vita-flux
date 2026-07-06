import { query } from '../../src/db/index.js';

async function main() {
  try {
    // Check transactions sample and distinct types
    const txTypes = await query("SELECT DISTINCT type FROM transactions LIMIT 10");
    console.log('Transaction types:', txTypes.rows.map(r => r.type));

    // Check blood_batches schema
    const batchCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blood_batches'");
    console.log('\n=== blood_batches columns ===');
    console.table(batchCols.rows);

    // Check transactions sample
    const txSample = await query("SELECT * FROM transactions LIMIT 3");
    console.log('\n=== transactions sample ===');
    console.table(txSample.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
