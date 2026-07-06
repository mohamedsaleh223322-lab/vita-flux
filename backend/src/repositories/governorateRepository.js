import { query } from '../db/index.js';

export const getAllGovernorates = async () => {
  const result = await query('SELECT * FROM governorates ORDER BY name ASC');
  return result.rows;
};
