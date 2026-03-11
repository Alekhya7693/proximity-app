import { create } from 'zustand';
import { storage } from '../utils/storage';

export type AppMode = 'social' | 'professional';

interface ModeState {
  mode: AppMode;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setMode: (mode: AppMode) => Promise<void>;
  toggleMode: () => Promise<void>;
}

export const useModeStore = create<ModeState>((set, get) => ({
  mode: 'social',
  isInitialized: false,

  initialize: async () => {
    const savedMode = await storage.getAppMode();
    set({
      mode: savedMode ?? 'social',
      isInitialized: true,
    });
  },

  setMode: async (mode: AppMode) => {
    await storage.setAppMode(mode);
    set({ mode });
  },

  toggleMode: async () => {
    const { mode } = get();
    const newMode: AppMode = mode === 'social' ? 'professional' : 'social';
    await storage.setAppMode(newMode);
    set({ mode: newMode });
  },
}));
