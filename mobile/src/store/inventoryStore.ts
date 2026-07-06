import { create } from 'zustand';
import { BloodInventoryItem } from '../types';

interface InventoryState {
  inventory: BloodInventoryItem[];
  lastUpdated: string | null;
  isLive: boolean;
  isLoading: boolean;

  setInventory: (items: BloodInventoryItem[], ts: string) => void;
  setIsLive: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  applySocketUpdate: (data: unknown) => void;
  clear: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: [],
  lastUpdated: null,
  isLive: false,
  isLoading: false,

  setInventory: (items, ts) =>
    set({ inventory: items, lastUpdated: ts, isLoading: false }),

  setIsLive: (v) => set({ isLive: v }),
  setIsLoading: (v) => set({ isLoading: v }),

  // Called when socket emits inventory_updated.
  // Payload shape may vary — attempt to extract recognizable inventory arrays.
  applySocketUpdate: (data) => {
    set({ lastUpdated: new Date().toISOString() });
    // If the payload carries an inventory array, merge it
    if (data && typeof data === 'object' && 'inventory' in (data as object)) {
      const payload = data as { inventory: BloodInventoryItem[] };
      if (Array.isArray(payload.inventory)) {
        set({ inventory: payload.inventory });
      }
    }
  },

  clear: () => set({ inventory: [], lastUpdated: null, isLive: false }),
}));
