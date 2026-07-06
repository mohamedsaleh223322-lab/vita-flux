import { query } from '../db/index.js';

export const getHospitalsByGovernorate = async (governorateId) => {
  // The schema has 'governorate' as character varying(100) in hospitals table, 
  // but it seems there should be a relation. 
  // Wait, looking at the schema: 
  // CREATE TABLE public.hospitals (..., governorate character varying(100) NOT NULL, ...)
  // But governorates table exists: CREATE TABLE public.governorates (id integer NOT NULL, name text NOT NULL)
  // There is NO foreign key between hospitals.governorate and governorates.id in the dump.
  // This is strange. Let's re-examine the dump.
  
  // Line 306: governorate character varying(100) NOT NULL
  // Line 254: CREATE TABLE public.governorates (id integer NOT NULL, name text NOT NULL)
  
  // I'll assume hospitals should have had a governorate_id, but the current schema has a string.
  // I'll try to find hospitals where the string matches the governorate name.
  
  const result = await query(`
    SELECT h.* 
    FROM hospitals h
    JOIN governorates g ON h.governorate = g.name
    WHERE g.id = $1
    ORDER BY h.name ASC
  `, [governorateId]);
  return result.rows;
};

export const createHospital = async (client, { name, governorate, address, phone }) => {
  const result = await client.query(
    'INSERT INTO hospitals (name, governorate, address, phone) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, governorate, address, phone]
  );
  return result.rows[0];
};

export const getHospitalById = async (id) => {
  const result = await query('SELECT * FROM hospitals WHERE id = $1', [id]);
  return result.rows[0];
};
