import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

// ── Base URL ──────────────────────────────────────────────────────────────
// For Android emulator: use 10.0.2.2 to reach host machine localhost
// For physical device: use your actual network IP
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/mobile`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach JWT & Log ─────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`[API Request] 🚀 ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);
    console.log('[API Request Headers]', JSON.stringify(config.headers, null, 2));
    if (config.data) {
      console.log('[API Request Body]', JSON.stringify(config.data, null, 2));
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ── Response Interceptor: handle 401 & Log ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ✅ ${response.status} <- ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error(
        `[API Timeout] 🛑 Request to [${error.config?.baseURL}${error.config?.url}] timed out after ${error.config?.timeout}ms.` +
        '\nPossible causes: Backend offline, Postgres server hanging, or wrong IP address/routing.'
      );
    } else if (!error.response) {
      console.error(
        `[API Network Error] 📡 No response received from [${error.config?.baseURL}${error.config?.url}].` +
        ` Code: ${error.code}. Message: ${error.message}`
      );
    } else {
      console.error(
        `[API Error] ❌ ${error.response.status} <- ${error.config?.url}` +
        `\nResponse Data:`, JSON.stringify(error.response.data, null, 2)
      );
    }

    if (error.response?.status === 401) {
      // Clear auth and let the app react via the auth store
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
