import apiClient from './client';
import { FavoriteHospital, AddFavoritePayload } from '../types';

export const favoritesApi = {
  getAll: async (): Promise<FavoriteHospital[]> => {
    const { data } = await apiClient.get<FavoriteHospital[]>('/favorites');
    return data;
  },

  add: async (payload: AddFavoritePayload): Promise<void> => {
    await apiClient.post('/favorites', payload);
  },

  remove: async (hospitalId: string): Promise<void> => {   // UUID
    await apiClient.delete(`/favorites/${hospitalId}`);
  },

  check: async (hospitalId: string): Promise<boolean> => {   // UUID
    const { data } = await apiClient.get<{ isFavorite: boolean }>(
      `/favorites/check/${hospitalId}`
    );
    return data.isFavorite;
  },
};
