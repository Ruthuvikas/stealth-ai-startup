import { create } from 'zustand';
import { UserProfile } from '../types';
import { saveData, loadData, KEYS } from '../services/storage';

interface UserState extends UserProfile {
  setName: (name: string) => void;
  setFavoriteCharacters: (ids: string[]) => void;
  completeOnboarding: () => void;
  hydrate: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  name: '',
  favoriteCharacters: [],
  onboarded: false,

  setName: (name: string) => {
    set({ name });
    saveData(KEYS.USER, { ...get(), name });
  },

  setFavoriteCharacters: (ids: string[]) => {
    set({ favoriteCharacters: ids });
    saveData(KEYS.USER, { ...get(), favoriteCharacters: ids });
  },

  completeOnboarding: () => {
    set({ onboarded: true });
    saveData(KEYS.USER, { ...get(), onboarded: true });
  },

  hydrate: async () => {
    const data = await loadData<UserProfile>(KEYS.USER);
    if (data) {
      set({ name: data.name, favoriteCharacters: data.favoriteCharacters, onboarded: data.onboarded });
    }
  },
}));
