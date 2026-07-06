import dotenv from 'dotenv';
dotenv.config();

import { query } from '../../src/db/index.js';

(async () => {
    const txRes = await query(`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50`);
    console.log('=== TRANSACTIONS ===');
    console.log('Total:', txRes.rows.length);
    txRes.rows.forEach((tx, i) => {
        console.log(`[${i}] ID: ${tx.id}, Type: ${tx.type}, Blood Type: ${tx.blood_type}, Quantity: ${tx.quantity}, Timestamp: ${tx.timestamp}`);
    });
})();
