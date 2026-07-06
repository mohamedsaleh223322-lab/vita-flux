import { apiFetch } from './apiFetch.js';

function normalizeFilters(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      bloodTypes: [],
      hospitals: [],
      governorates: [],
      statuses: [],
      requestTypes: [],
      directions: [],
    };
  }
  return {
    bloodTypes: raw.bloodTypes ?? raw.blood_types ?? [],
    hospitals: raw.hospitals ?? [],
    governorates: raw.governorates ?? [],
    statuses: raw.statuses ?? [],
    requestTypes: raw.requestTypes ?? raw.request_types ?? [],
    directions: raw.directions ?? [],
  };
}

function normalizeRequestList(data) {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.requests && Array.isArray(data.requests)) return data.requests;
  return [];
}

function paramsToQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      q.set(key, String(value));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getRequestFilters() {
  const data = await apiFetch('/api/requests/filters');
  return normalizeFilters(data);
}

export async function getGovernorates() {
  const data = await apiFetch('/api/governorates');
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getHospitals(governorateId) {
  const id = Number(governorateId);
  if (!id) return [];
  const data = await apiFetch(`/api/hospitals?governorateId=${encodeURIComponent(id)}`);
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getRequests(query = {}) {
  const data = await apiFetch(`/api/requests${paramsToQuery(query)}`);
  const list = normalizeRequestList(data);
  const total =
    typeof data?.total === 'number'
      ? data.total
      : typeof data?.meta?.total === 'number'
        ? data.meta.total
        : list.length;
  return { items: list, total };
}

export async function createRequest(body) {
  return apiFetch('/api/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateRequestStatus(id, status) {
  return apiFetch(`/api/requests/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteRequest(id) {
  await apiFetch(`/api/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}
