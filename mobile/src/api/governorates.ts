import apiClient from './client';
import { Governorate } from '../types';

export const governoratesApi = {
  getAll: async (): Promise<Governorate[]> => {
    const { data } = await apiClient.get<Governorate[]>('/governorates');
    return data;
  },
};
