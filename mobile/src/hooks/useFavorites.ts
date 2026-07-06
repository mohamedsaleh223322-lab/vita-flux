import { useCallback } from 'react';
import { favoritesApi } from '../api/favorites';
import { useFavoritesStore } from '../store/favoritesStore';
import { useAuthStore } from '../store/authStore';
import { Hospital, FavoriteHospital } from '../types';

export function useFavorites() {
  const { isLoggedIn } = useAuthStore();
  const { favorites, addLocal, removeLocal, isFavorite, setFavorites } =
    useFavoritesStore();

  const loadFavorites = useCallback(async () => {
    if (!isLoggedIn) return;
    const list = await favoritesApi.getAll();
    setFavorites(list);
  }, [isLoggedIn]);

  const toggleFavorite = useCallback(
    async (hospital: Hospital) => {
      if (!isLoggedIn) return;
      const alreadyFav = isFavorite(hospital.id);
      if (alreadyFav) {
        removeLocal(hospital.id);
        await favoritesApi.remove(hospital.id);    // UUID string
      } else {
        // optimistic add
        const fav: FavoriteHospital = {
          ...hospital,
          favorite_id: Date.now(),
          favorited_at: new Date().toISOString(),
        };
        addLocal(fav);
        await favoritesApi.add({ hospitalId: hospital.id });  // UUID string
      }
    },
    [isLoggedIn, isFavorite]
  );

  return { favorites, loadFavorites, toggleFavorite, isFavorite };
}
