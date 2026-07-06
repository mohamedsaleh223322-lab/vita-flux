import { query } from '../../src/db/index.js';

(async () => {
  try {
    const res = await query('SELECT * FROM blood_requests');
    console.log('Blood requests count:', res.rows.length);
    console.log('Blood requests:', res.rows);
    
    const hospitals = await query('SELECT id, name FROM hospitals');
    console.log('Hospitals:', hospitals.rows);
  } catch (err) {
    console.error(err);
  }
})();
