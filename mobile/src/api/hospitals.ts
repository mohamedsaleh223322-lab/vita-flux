import apiClient from './client';
import { Hospital } from '../types';

export const hospitalsApi = {
  getByGovernorate: async (governorateId: number, search?: string): Promise<Hospital[]> => {
    const params: Record<string, string | number> = { governorateId };
    if (search) params.search = search;
    const { data } = await apiClient.get<Hospital[]>('/hospitals', { params });
    return data;
  },

  getById: async (id: string): Promise<Hospital> => {   // UUID string
    const { data } = await apiClient.get<Hospital>(`/hospitals/${id}`);
    return data;
  },
};
