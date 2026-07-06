import { query } from '../db/index.js';

export const createRequest = async (client, { requester_hospital_id, provider_hospital_id, blood_type, quantity, priority, reason, expiry_date }) => {
  const runQuery = client ? client.query.bind(client) : query;
  const result = await runQuery(
    `INSERT INTO blood_requests (requester_hospital_id, provider_hospital_id, blood_type, quantity, priority, status, reason, expiry_date)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7) RETURNING *`,
    [requester_hospital_id, provider_hospital_id, blood_type, quantity, priority, reason, expiry_date || null]
  );
  return result.rows[0];
};

export const getRequestById = async (id) => {
  const result = await query('SELECT * FROM blood_requests WHERE id = $1', [id]);
  return result.rows[0];
};

export const updateRequestStatus = async (client, requestId, status) => {
  const result = await client.query(
    'UPDATE blood_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, requestId]
  );
  return result.rows[0];
};

export const getRequests = async ({ hospitalId, filters, limit = 10, offset = 0 }) => {
  let whereClauses = [];
  const params = [hospitalId];
  let paramIndex = 2;

  if (filters.type === 'sent') {
    whereClauses.push(`r.requester_hospital_id = $1`);
  } else if (filters.type === 'received') {
    whereClauses.push(`r.provider_hospital_id = $1`);
  } else {
    whereClauses.push(`(r.requester_hospital_id = $1 OR r.provider_hospital_id = $1)`);
  }

  if (filters.bloodType) {
    whereClauses.push(`r.blood_type = $${paramIndex++}`);
    params.push(filters.bloodType);
  }

  if (filters.status) {
    whereClauses.push(`UPPER(r.status) = UPPER($${paramIndex++})`);
    params.push(filters.status);
  }

  if (filters.hospital) {
    whereClauses.push(`
      CASE 
        WHEN r.requester_hospital_id = $1 THEN r.provider_hospital_id 
        ELSE r.requester_hospital_id 
      END = $${paramIndex++}
    `);
    params.push(filters.hospital);
  }

  if (filters.governorate) {
    whereClauses.push(`
      CASE 
        WHEN r.requester_hospital_id = $1 THEN g_prov.id 
        ELSE g_req.id 
      END = $${paramIndex++}
    `);
    params.push(parseInt(filters.governorate, 10));
  }

  if (filters.fromDate) {
    whereClauses.push(`r.created_at >= $${paramIndex++}::timestamp`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    whereClauses.push(`r.created_at <= $${paramIndex++}::timestamp + interval '1 day'`);
    params.push(filters.toDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT r.*, 
           h_req.name as requester_name, 
           h_req.governorate as requester_governorate,
           g_req.id as requester_governorate_id,
           h_prov.name as provider_name,
           h_prov.governorate as provider_governorate,
           g_prov.id as provider_governorate_id
    FROM blood_requests r
    LEFT JOIN hospitals h_req ON r.requester_hospital_id = h_req.id
    LEFT JOIN governorates g_req ON h_req.governorate = g_req.name
    LEFT JOIN hospitals h_prov ON r.provider_hospital_id = h_prov.id
    LEFT JOIN governorates g_prov ON h_prov.governorate = g_prov.name
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const queryParams = [...params, limit, offset];
  const result = await query(sql, queryParams);

  const countSql = `
    SELECT COUNT(*) 
    FROM blood_requests r
    LEFT JOIN hospitals h_req ON r.requester_hospital_id = h_req.id
    LEFT JOIN governorates g_req ON h_req.governorate = g_req.name
    LEFT JOIN hospitals h_prov ON r.provider_hospital_id = h_prov.id
    LEFT JOIN governorates g_prov ON h_prov.governorate = g_prov.name
    ${whereSql}
  `;
  const countResult = await query(countSql, params);

  const mappedItems = result.rows.map(r => {
    const isSent = r.requester_hospital_id === hospitalId;
    return {
      id: r.id,
      type: isSent ? 'sent' : 'received',
      hospital: isSent ? r.provider_name : r.requester_name,
      governorate: isSent ? r.provider_governorate : r.requester_governorate,
      bloodType: r.blood_type,
      quantity: parseInt(r.quantity, 10),
      status: r.status,
      date: new Date(r.created_at).toLocaleDateString(),
      expiryDate: r.expiry_date,
      createdAt: r.created_at
    };
  });

  return { items: mappedItems, total: parseInt(countResult.rows[0].count, 10) };
};

export const linkBatchesToRequest = async (client, requestId, batchIds) => {
  for (const batchId of batchIds) {
    await client.query(
      'INSERT INTO request_batches (request_id, batch_id) VALUES ($1, $2)',
      [requestId, batchId]
    );
  }
};

export const getBatchesByRequest = async (requestId) => {
  const result = await query(
    `SELECT b.* FROM blood_batches b
     JOIN request_batches rb ON b.id = rb.batch_id
     WHERE rb.request_id = $1`,
    [requestId]
  );
  return result.rows;
};

