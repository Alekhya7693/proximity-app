import { create } from 'zustand';

export interface DiscoveryFilterState {
  radius: number;
  ageRange: [number, number];
  showMe: string;
  vibeFilter: string;
  setRadius: (radius: number) => void;
  setAgeRange: (range: [number, number]) => void;
  setShowMe: (showMe: string) => void;
  setVibeFilter: (vibe: string) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = {
  radius: 300,
  ageRange: [21, 38] as [number, number],
  showMe: 'Everyone',
  vibeFilter: 'Any',
};

export const useFiltersStore = create<DiscoveryFilterState>((set) => ({
  ...DEFAULT_FILTERS,
  setRadius: (radius) => set({ radius }),
  setAgeRange: (ageRange) => set({ ageRange }),
  setShowMe: (showMe) => set({ showMe }),
  setVibeFilter: (vibeFilter) => set({ vibeFilter }),
  resetFilters: () => set(DEFAULT_FILTERS),
}));
