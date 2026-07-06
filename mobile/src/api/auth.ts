import apiClient from './client';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  uploadAvatar: async (formData: FormData): Promise<{ avatarUrl: string }> => {
    const { data } = await apiClient.post<{ avatarUrl: string }>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
