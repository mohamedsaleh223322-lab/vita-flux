import { query } from '../../src/db/index.js';

(async () => {
    try {
        console.log('Checking transactions...');

        const res = await query(
            `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 20`
        );
        console.log('Transactions found:', res.rows.length);
        res.rows.forEach(row => console.log(row));

    } catch (err) {
        console.error('Error:', err);
    }
})();
