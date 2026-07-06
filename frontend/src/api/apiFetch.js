import { getToken, clearSession } from '../lib/authStorage.js';

/**
 * JSON fetch with Authorization header when a session exists.
 * Automatically clears session and redirects to /login on 401.
 * @param {string} input
 * @param {RequestInit} [init]
 */
export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // Token expired or invalid — clear session and redirect to login
    if (res.status === 401) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    const msg =
      typeof body === 'object' && body != null && body.message
        ? body.message
        : typeof body === 'string' && body
          ? body
          : res.statusText;
    const err = new Error(msg || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}
