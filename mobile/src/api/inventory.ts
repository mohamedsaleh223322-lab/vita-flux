import apiClient from './client';
import { InventoryResponse } from '../types';

export const inventoryApi = {
  getByHospital: async (hospitalId: string): Promise<InventoryResponse> => {   // UUID
    const { data } = await apiClient.get<InventoryResponse>(
      `/hospitals/${hospitalId}/inventory`
    );
    return data;
  },
};
