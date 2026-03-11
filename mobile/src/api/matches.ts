import apiClient from './client';
import { AppMode } from '../store/modeStore';

export interface Match {
  id: string;
  userId: string;
  displayName: string;
  profilePhoto: string;
  compatibilityScore: number;
  mode: AppMode;
  matchedAt: string;
  lastMessage?: {
    text: string;
    sentAt: string;
    isRead: boolean;
  };
  isOnline: boolean;
  distance?: number;
}

export interface MatchDetail {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  age: number;
  profilePhotos: string[];
  interests: string[];
  vibes: string[];
  compatibilityScore: number;
  mode: AppMode;
  matchedAt: string;
  profession?: string;
  company?: string;
}

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const MOCK_MATCHES: Match[] = [
  {
    id: 'match-1',
    userId: 'user-101',
    displayName: 'Alex',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/women/44.jpg',
    compatibilityScore: 92,
    mode: 'social',
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      text: 'Hey! Nice to meet you 😊',
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isRead: false,
    },
    isOnline: true,
    distance: 300,
  },
  {
    id: 'match-2',
    userId: 'user-102',
    displayName: 'Jordan',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/men/32.jpg',
    compatibilityScore: 87,
    mode: 'social',
    matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      text: 'Want to grab coffee sometime?',
      sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    isOnline: false,
    distance: 500,
  },
  {
    id: 'match-3',
    userId: 'user-103',
    displayName: 'Taylor',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/women/50.jpg',
    compatibilityScore: 85,
    mode: 'professional',
    matchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isOnline: true,
    distance: 1200,
  },
  {
    id: 'match-4',
    userId: 'user-104',
    displayName: 'Sam',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/women/68.jpg',
    compatibilityScore: 79,
    mode: 'social',
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      text: 'That hiking trail was amazing!',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    isOnline: false,
    distance: 800,
  },
];

const MOCK_MATCH_DETAILS: Record<string, MatchDetail> = {
  'match-1': {
    id: 'match-1',
    userId: 'user-101',
    displayName: 'Alex',
    bio: 'Coffee enthusiast ☕ | Love hiking and photography. Always up for an adventure!',
    age: 26,
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/women/45.jpg',
    ],
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel'],
    vibes: ['Adventurous', 'Creative'],
    compatibilityScore: 92,
    mode: 'social',
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  'match-2': {
    id: 'match-2',
    userId: 'user-102',
    displayName: 'Jordan',
    bio: 'Tech geek & foodie 🍕 | Building cool things by day, exploring restaurants by night.',
    age: 28,
    profilePhotos: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/men/33.jpg',
    ],
    interests: ['Technology', 'Food', 'Gaming', 'Music'],
    vibes: ['Chill', 'Nerdy'],
    compatibilityScore: 87,
    mode: 'social',
    matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  'match-3': {
    id: 'match-3',
    userId: 'user-103',
    displayName: 'Taylor',
    bio: 'Product Manager @ TechCo | Passionate about startups and innovation.',
    age: 30,
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/50.jpg',
      'https://randomuser.me/api/portraits/women/51.jpg',
    ],
    interests: ['Startups', 'Product Design', 'AI', 'Networking'],
    vibes: ['Ambitious', 'Innovative'],
    compatibilityScore: 85,
    mode: 'professional',
    matchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    profession: 'Product Manager',
    company: 'TechCo',
  },
  'match-4': {
    id: 'match-4',
    userId: 'user-104',
    displayName: 'Sam',
    bio: 'Yoga instructor & plant parent 🌿 | Seeking meaningful connections.',
    age: 25,
    profilePhotos: [
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://randomuser.me/api/portraits/women/69.jpg',
    ],
    interests: ['Yoga', 'Plants', 'Meditation', 'Art'],
    vibes: ['Mindful', 'Creative'],
    compatibilityScore: 79,
    mode: 'social',
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const matchesApi = {
  async getMatches(
    mode: AppMode,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ matches: Match[]; hasMore: boolean }> {
    try {
      const response = await apiClient.get('/matches', {
        params: { mode, page, limit },
      });
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock matches');
        const filtered = MOCK_MATCHES.filter((m) => m.mode === mode);
        return { matches: filtered, hasMore: false };
      }
      throw error;
    }
  },

  async getMatchDetail(matchId: string): Promise<MatchDetail> {
    try {
      const response = await apiClient.get<MatchDetail>(
        `/matches/${matchId}`,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock match detail');
        const detail = MOCK_MATCH_DETAILS[matchId];
        if (detail) return detail;
        // Fallback generic detail
        return {
          id: matchId,
          userId: 'user-unknown',
          displayName: 'Unknown User',
          bio: 'No bio available',
          age: 25,
          profilePhotos: ['https://randomuser.me/api/portraits/lego/1.jpg'],
          interests: ['General'],
          vibes: ['Friendly'],
          compatibilityScore: 75,
          mode: 'social',
          matchedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  async unmatch(matchId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/matches/${matchId}`,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Unmatched successfully' };
      }
      throw error;
    }
  },

  async sendHi(
    matchId: string,
    message?: string,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/matches/${matchId}/greet`,
        { message },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: message || 'Hi! 👋' };
      }
      throw error;
    }
  },
};
