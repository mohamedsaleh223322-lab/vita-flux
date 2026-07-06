import { getClient } from './index.js';

const runMigration = async () => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    console.log('Starting migration...');

    // 1. Add batch_code column if it doesn't exist
    await client.query(`
      ALTER TABLE blood_batches 
      ADD COLUMN IF NOT EXISTS batch_code VARCHAR(50);
    `);
    console.log('Column batch_code checked/added.');

    // 2. Fetch distinct years that have rows with NULL batch_code
    const yearsResult = await client.query(`
      SELECT DISTINCT COALESCE(EXTRACT(YEAR FROM created_at)::int, EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::int) as year 
      FROM blood_batches 
      WHERE batch_code IS NULL 
      ORDER BY year ASC
    `);

    for (const row of yearsResult.rows) {
      const year = row.year;
      console.log(`Backfilling rows for year ${year}...`);

      // Get highest existing batch_code for this year to start from
      const maxResult = await client.query(`
        SELECT batch_code FROM blood_batches 
        WHERE batch_code LIKE $1 
        ORDER BY batch_code DESC 
        LIMIT 1
      `, [`BB-${year}-%`]);

      let lastNum = 0;
      if (maxResult.rows.length > 0) {
        const lastCode = maxResult.rows[0].batch_code;
        if (lastCode) {
          const parts = lastCode.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num)) {
              lastNum = num;
            }
          }
        }
      }

      // Get all NULL rows for this year
      const nullRowsResult = await client.query(`
        SELECT id, created_at FROM blood_batches 
        WHERE COALESCE(EXTRACT(YEAR FROM created_at)::int, EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::int) = $1 AND batch_code IS NULL 
        ORDER BY created_at ASC
      `, [year]);

      console.log(`Found ${nullRowsResult.rows.length} rows to backfill for year ${year}`);

      let count = 0;
      for (const nullRow of nullRowsResult.rows) {
        const nextNum = lastNum + count + 1;
        const paddedNum = String(nextNum).padStart(6, '0');
        const code = `BB-${year}-${paddedNum}`;

        await client.query(`
          UPDATE blood_batches 
          SET batch_code = $1 
          WHERE id = $2
        `, [code, nullRow.id]);

        count++;
      }
      console.log(`Successfully backfilled ${count} rows for year ${year}.`);
    }

    // 3. Add UNIQUE constraint and index
    console.log('Adding UNIQUE constraint and index to batch_code...');
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'blood_batches' AND constraint_name = 'blood_batches_batch_code_key'
    `);

    if (constraintCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE blood_batches 
        ADD CONSTRAINT blood_batches_batch_code_key UNIQUE (batch_code);
      `);
      console.log('UNIQUE constraint added.');
    } else {
      console.log('UNIQUE constraint already exists.');
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blood_batches_batch_code 
      ON blood_batches (batch_code);
    `);
    console.log('Index idx_blood_batches_batch_code checked/created.');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    release();
  }
};

runMigration().then(() => process.exit(0));
