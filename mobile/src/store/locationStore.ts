import { create } from 'zustand';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  currentLocation: Coordinates | null;
  locationPermissionGranted: boolean;
  isTrackingActive: boolean;
  lastUpdated: string | null;
  errorMessage: string | null;

  setLocation: (coords: Coordinates) => void;
  setPermissionGranted: (granted: boolean) => void;
  setTrackingActive: (active: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  locationPermissionGranted: false,
  isTrackingActive: false,
  lastUpdated: null,
  errorMessage: null,

  setLocation: (coords: Coordinates) =>
    set({
      currentLocation: coords,
      lastUpdated: new Date().toISOString(),
      errorMessage: null,
    }),

  setPermissionGranted: (granted: boolean) =>
    set({ locationPermissionGranted: granted }),

  setTrackingActive: (active: boolean) => set({ isTrackingActive: active }),

  setError: (error: string | null) => set({ errorMessage: error }),

  clearLocation: () =>
    set({
      currentLocation: null,
      isTrackingActive: false,
      lastUpdated: null,
    }),
}));
