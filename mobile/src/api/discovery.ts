import apiClient from './client';
import { AppMode } from '../store/modeStore';

export interface DiscoveryProfile {
  id: string;
  displayName: string;
  bio: string;
  age: number;
  gender: string;
  profilePhotos: string[];
  distance: number;
  compatibilityScore: number;
  interests: string[];
  vibes: string[];
  mode: AppMode;
  profession?: string;
  company?: string;
}

export interface DiscoveryFilters {
  mode: AppMode;
  maxDistance: number;
  ageRange: { min: number; max: number };
  genderPreference: string[];
  vibes?: string[];
}

export interface SwipeAction {
  targetUserId: string;
  action: 'like' | 'pass';
  mode: AppMode;
}

export interface SwipeResult {
  matched: boolean;
  matchId?: string;
  matchedUser?: DiscoveryProfile;
}

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const MOCK_PROFILES: DiscoveryProfile[] = [
  {
    id: 'mock-user-1',
    displayName: 'Alex',
    bio: 'Coffee enthusiast ☕ | Love hiking and photography. Always up for an adventure!',
    age: 26,
    gender: 'female',
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/women/45.jpg',
    ],
    distance: 300,
    compatibilityScore: 92,
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel'],
    vibes: ['Adventurous', 'Creative'],
    mode: 'social',
  },
  {
    id: 'mock-user-2',
    displayName: 'Jordan',
    bio: 'Tech geek & foodie 🍕 | Building cool things by day, exploring restaurants by night.',
    age: 28,
    gender: 'male',
    profilePhotos: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/men/33.jpg',
    ],
    distance: 500,
    compatibilityScore: 87,
    interests: ['Technology', 'Food', 'Gaming', 'Music'],
    vibes: ['Chill', 'Nerdy'],
    mode: 'social',
  },
  {
    id: 'mock-user-3',
    displayName: 'Sam',
    bio: 'Yoga instructor & plant parent 🌿 | Seeking meaningful connections.',
    age: 25,
    gender: 'non_binary',
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://randomuser.me/api/portraits/women/69.jpg',
    ],
    distance: 800,
    compatibilityScore: 79,
    interests: ['Yoga', 'Plants', 'Meditation', 'Art'],
    vibes: ['Mindful', 'Creative'],
    mode: 'social',
  },
  {
    id: 'mock-user-4',
    displayName: 'Taylor',
    bio: 'Product Manager @ TechCo | Passionate about startups and innovation.',
    age: 30,
    gender: 'female',
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/50.jpg',
      'https://randomuser.me/api/portraits/women/51.jpg',
    ],
    distance: 1200,
    compatibilityScore: 85,
    interests: ['Startups', 'Product Design', 'AI', 'Networking'],
    vibes: ['Ambitious', 'Innovative'],
    mode: 'professional',
    profession: 'Product Manager',
    company: 'TechCo',
  },
  {
    id: 'mock-user-5',
    displayName: 'Riley',
    bio: 'UX Designer | Looking for mentorship opportunities and creative collaborations.',
    age: 24,
    gender: 'male',
    profilePhotos: [
      'https://randomuser.me/api/portraits/men/22.jpg',
      'https://randomuser.me/api/portraits/men/23.jpg',
    ],
    distance: 400,
    compatibilityScore: 91,
    interests: ['Design', 'Typography', 'Branding', 'Illustration'],
    vibes: ['Creative', 'Collaborative'],
    mode: 'professional',
    profession: 'UX Designer',
    company: 'DesignStudio',
  },
];

const MOCK_SOCIAL_VIBES = [
  'Adventurous', 'Chill', 'Creative', 'Energetic', 'Foodie',
  'Intellectual', 'Mindful', 'Musical', 'Outdoorsy', 'Sporty',
];

const MOCK_PROFESSIONAL_VIBES = [
  'Ambitious', 'Collaborative', 'Innovative', 'Leader', 'Mentor',
  'Networker', 'Startup-minded', 'Technical', 'Visionary', 'Strategic',
];

// Track swipes for mock match logic
let swipeCount = 0;

export const discoveryApi = {
  async getFeed(
    filters: DiscoveryFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ profiles: DiscoveryProfile[]; hasMore: boolean }> {
    try {
      const response = await apiClient.get('/discovery/feed', {
        params: {
          ...filters,
          page,
          limit,
          genderPreference: filters.genderPreference.join(','),
        },
      });
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock discovery feed');
        const filtered = MOCK_PROFILES.filter((p) =>
          filters.mode === 'professional'
            ? p.mode === 'professional'
            : p.mode === 'social',
        );
        return { profiles: filtered, hasMore: false };
      }
      throw error;
    }
  },

  async swipe(data: SwipeAction): Promise<SwipeResult> {
    try {
      const response = await apiClient.post<SwipeResult>(
        '/discovery/swipe',
        data,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock swipe');
        swipeCount++;
        // Every 3rd like is a match
        if (data.action === 'like' && swipeCount % 3 === 0) {
          const matchedUser = MOCK_PROFILES.find(
            (p) => p.id === data.targetUserId,
          ) || MOCK_PROFILES[0];
          return {
            matched: true,
            matchId: 'mock-match-' + Date.now(),
            matchedUser,
          };
        }
        return { matched: false };
      }
      throw error;
    }
  },

  async getVibes(mode: AppMode): Promise<string[]> {
    try {
      const response = await apiClient.get<{ vibes: string[] }>(
        '/discovery/vibes',
        { params: { mode } },
      );
      return response.data.vibes;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock vibes');
        return mode === 'professional'
          ? MOCK_PROFESSIONAL_VIBES
          : MOCK_SOCIAL_VIBES;
      }
      throw error;
    }
  },

  async setActiveVibes(
    vibes: string[],
    mode: AppMode,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/discovery/vibes',
        { vibes, mode },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Vibes updated successfully' };
      }
      throw error;
    }
  },

  async reportUser(
    userId: string,
    reason: string,
    details?: string,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/discovery/report/${userId}`,
        { reason, details },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'User reported successfully' };
      }
      throw error;
    }
  },

  async blockUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/discovery/block/${userId}`,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'User blocked successfully' };
      }
      throw error;
    }
  },
};
