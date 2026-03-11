import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'proximity_access_token',
  REFRESH_TOKEN: 'proximity_refresh_token',
  USER_DATA: 'proximity_user_data',
  ONBOARDING_COMPLETE: 'proximity_onboarding_complete',
  APP_MODE: 'proximity_app_mode',
} as const;

/**
 * Platform-aware storage abstraction.
 * Uses localStorage on web, expo-secure-store on native.
 */

// Web-safe storage helpers
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may be unavailable in some contexts
    }
  },
  async deleteItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
  },
};

// Eagerly load SecureStore on native via require (lazy-safe for web)
let nativeStorage: typeof webStorage | null = null;

function loadNativeStorage(): typeof webStorage {
  if (nativeStorage) return nativeStorage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    nativeStorage = {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
    return nativeStorage;
  } catch {
    // Fallback to web storage if SecureStore is unavailable
    return webStorage;
  }
}

function getStore(): typeof webStorage {
  if (Platform.OS === 'web') {
    return webStorage;
  }
  return loadNativeStorage();
}

export const storage = {
  async getAccessToken(): Promise<string | null> {
    const store = getStore();
    return store.getItem(KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    const store = getStore();
    await store.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    const store = getStore();
    return store.getItem(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    const store = getStore();
    await store.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async clearTokens(): Promise<void> {
    const store = getStore();
    await store.deleteItem(KEYS.ACCESS_TOKEN);
    await store.deleteItem(KEYS.REFRESH_TOKEN);
  },

  async getUserData<T>(): Promise<T | null> {
    const store = getStore();
    const data = await store.getItem(KEYS.USER_DATA);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async setUserData<T>(data: T): Promise<void> {
    const store = getStore();
    await store.setItem(KEYS.USER_DATA, JSON.stringify(data));
  },

  async clearUserData(): Promise<void> {
    const store = getStore();
    await store.deleteItem(KEYS.USER_DATA);
  },

  async getOnboardingComplete(): Promise<boolean> {
    const store = getStore();
    const value = await store.getItem(KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  },

  async setOnboardingComplete(complete: boolean): Promise<void> {
    const store = getStore();
    await store.setItem(KEYS.ONBOARDING_COMPLETE, complete ? 'true' : 'false');
  },

  async getAppMode(): Promise<'social' | 'professional' | null> {
    const store = getStore();
    const mode = await store.getItem(KEYS.APP_MODE);
    if (mode === 'social' || mode === 'professional') return mode;
    return null;
  },

  async setAppMode(mode: 'social' | 'professional'): Promise<void> {
    const store = getStore();
    await store.setItem(KEYS.APP_MODE, mode);
  },

  async clearAll(): Promise<void> {
    const store = getStore();
    await Promise.all(
      Object.values(KEYS).map((key) => store.deleteItem(key)),
    );
  },
};
