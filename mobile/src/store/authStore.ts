import { create } from 'zustand';
import { User } from '../types';
import { storage } from '../utils/storage';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;

  bootstrap: () => Promise<void>;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoggedIn: false,
  isBootstrapping: true,

  bootstrap: async () => {
    try {
      const [token, user] = await Promise.all([
        storage.getToken(),
        storage.getUser<User>(),
      ]);
      if (token && user) {
        set({ token, user, isLoggedIn: true });
      }
    } catch {
      // ignore
    } finally {
      set({ isBootstrapping: false });
    }
  },

  login: async (token, user) => {
    await Promise.all([storage.setToken(token), storage.setUser(user)]);
    set({ token, user, isLoggedIn: true });
  },

  logout: async () => {
    await storage.clearAll();
    set({ token: null, user: null, isLoggedIn: false });
  },

  updateUser: async (updatedUser) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedUser };
      storage.setUser(newUser).catch(() => {});
      return { user: newUser };
    });
  },
}));
