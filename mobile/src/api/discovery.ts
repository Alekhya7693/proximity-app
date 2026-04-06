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
  isOnline?: boolean;
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

export const discoveryApi = {
  async getFeed(
    filters: DiscoveryFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ profiles: DiscoveryProfile[]; hasMore: boolean }> {
    const response = await apiClient.get('/discovery/feed', {
      params: {
        page,
        limit,
        radius: filters.maxDistance, // backend expects 'radius' in km
        intention: (filters as any).intention,
      },
    });

    const data = response.data;
    const candidates = data.candidates || [];

    const profiles: DiscoveryProfile[] = candidates.map((candidate: any) => ({
      id: candidate.userId,
      displayName: candidate.profile?.displayName || '',
      bio: candidate.profile?.bio || '',
      age: candidate.profile?.age || 0,
      gender: candidate.profile?.gender || '',
      profilePhotos: candidate.profile?.photos || [],
      distance: candidate.distance,
      compatibilityScore: Math.min(Math.round(candidate.score), 100),
      interests: candidate.profile?.interests || [],
      vibes: candidate.profile?.vibes || [],
      isOnline: candidate.isOnline || false,
      mode: filters.mode,
      profession: candidate.profile?.occupation || candidate.profile?.profession,
      company: candidate.profile?.company || candidate.profile?.city,
    }));

    const hasMore = data.total > page * data.pageSize;

    return { profiles, hasMore };
  },

  async swipe(data: SwipeAction): Promise<SwipeResult> {
    const response = await apiClient.post('/match/swipe', {
      targetUserId: data.targetUserId,
      direction: data.action,
    });

    return {
      matched: response.data.isMatch,
      matchId: response.data.match?.id,
    };
  },

  async getVibes(mode: AppMode): Promise<string[]> {
    try {
      const response = await apiClient.get<{ vibes: string[] }>('/discovery/vibes', {
        params: { mode },
      });
      return response.data.vibes;
    } catch {
      return [];
    }
  },

  async setActiveVibes(
    vibes: string[],
    mode: AppMode,
    durationMinutes?: number,
    customText?: string,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/discovery/vibes', {
        vibes,
        mode,
        durationMinutes: durationMinutes || 60,
        customText,
      });
      return response.data;
    } catch {
      return { message: 'Vibes updated' };
    }
  },

  async reportUser(userId: string, reason: string, details?: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/safety/report', {
      reportedUserId: userId,
      reason,
      description: details,
    });
    return response.data;
  },

  async blockUser(userId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/safety/block', {
      blockedUserId: userId,
    });
    return response.data;
  },
};
