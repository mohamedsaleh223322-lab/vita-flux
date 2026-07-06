import dotenv from 'dotenv';
dotenv.config();

import { query } from '../../src/db/index.js';

(async () => {
    console.log('=== Debug Analytics ===');

    console.log('\n1. Checking transactions table:');
    const txRes = await query(`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50`);
    console.log('Transactions count:', txRes.rows.length);
    console.log('Transactions:', txRes.rows);

    console.log('\n2. Checking blood_batches table:');
    const batchesRes = await query(`SELECT * FROM blood_batches LIMIT 50`);
    console.log('Blood batches count:', batchesRes.rows.length);
    console.log('Blood batches:', batchesRes.rows);

    console.log('\n=== End Debug ===');
})();
