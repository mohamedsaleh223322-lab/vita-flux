import { query } from '../db/index.js';

export const getUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const createUser = async (client, { hospital_id, full_name, email, password, role, phone, governorate }) => {
  const result = await client.query(
    `INSERT INTO users (hospital_id, full_name, email, password, role, phone, governorate) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [hospital_id, full_name, email, password, role, phone, governorate]
  );
  return result.rows[0];
};
