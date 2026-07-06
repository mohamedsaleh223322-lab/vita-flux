import { create } from 'zustand';
import { FavoriteHospital } from '../types';

interface FavoritesState {
  favorites: FavoriteHospital[];
  favoriteHospitalIds: Set<string>;  // tracks hospital.id (not favorite row id)
  setFavorites: (list: FavoriteHospital[]) => void;
  addLocal: (h: FavoriteHospital) => void;
  removeLocal: (hospitalId: string) => void;
  isFavorite: (hospitalId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favoriteHospitalIds: new Set(),

  setFavorites: (list) =>
    set({
      favorites: list,
      favoriteHospitalIds: new Set(list.map((f) => f.id)), // f.id = hospital.id
    }),

  addLocal: (h) =>
    set((s) => ({
      favorites: [h, ...s.favorites],
      favoriteHospitalIds: new Set([...s.favoriteHospitalIds, h.id]),
    })),

  removeLocal: (hospitalId) =>
    set((s) => {
      const next = new Set(s.favoriteHospitalIds);
      next.delete(hospitalId);
      return {
        favorites: s.favorites.filter((f) => f.id !== hospitalId),
        favoriteHospitalIds: next,
      };
    }),

  isFavorite: (hospitalId) => get().favoriteHospitalIds.has(hospitalId),
}));
