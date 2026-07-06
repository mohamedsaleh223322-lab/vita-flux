import { create } from 'zustand';
import { Governorate } from '../types';

interface GovernorateState {
  selected: Governorate | null;
  setSelected: (g: Governorate) => void;
  clear: () => void;
}

export const useGovernorateStore = create<GovernorateState>((set) => ({
  selected: null,
  setSelected: (g) => set({ selected: g }),
  clear: () => set({ selected: null }),
}));
