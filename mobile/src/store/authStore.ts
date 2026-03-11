import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  gender: 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
  dateOfBirth: string;
  profilePhotos: string[];
  socialInterests: string[];
  professionalInterests: string[];
  vibes: string[];
  isVerified: boolean;
  isOnboardingComplete: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getAccessToken(),
        storage.getRefreshToken(),
        storage.getUserData<User>(),
      ]);

      set({
        accessToken,
        refreshToken,
        user: userData,
        isAuthenticated: !!accessToken && !!userData,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      storage.setAccessToken(accessToken),
      storage.setRefreshToken(refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setUser: async (user: User) => {
    await storage.setUserData(user);
    set({ user, isAuthenticated: true });
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...updates };
      storage.setUserData(updatedUser);
      set({ user: updatedUser });
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
