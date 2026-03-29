import apiClient from './client';
import { AppMode } from '../store/modeStore';
import { useAuthStore } from '../store/authStore';

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

// Helper: extract display name from user entity
function extractDisplayName(user: any): string {
  if (!user) return 'User';
  if (user.firstName) return `${user.firstName} ${user.lastName || ''}`.trim();
  if (user.username) return user.username;
  return 'User';
}

// Helper: compute a rough compatibility from match data
function estimateCompatibility(match: any): number {
  // If backend provides a score, use it
  if (match.compatibilityScore) return Math.min(match.compatibilityScore, 100);
  // Estimate based on distance — closer = higher compatibility
  const dist = match.distanceAtMatchKm ?? 5;
  if (dist <= 0.3) return 95;
  if (dist <= 1) return 88;
  if (dist <= 5) return 78;
  if (dist <= 10) return 65;
  return 55;
}

// Helper: check if user was recently active
function isRecentlyActive(user: any): boolean {
  if (!user?.lastActiveAt) return false;
  const diff = Date.now() - new Date(user.lastActiveAt).getTime();
  return diff < 15 * 60 * 1000; // active within 15 minutes
}

export const matchesApi = {
  async getMatches(
    mode: AppMode,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ matches: Match[]; hasMore: boolean }> {
    const response = await apiClient.get('/match', {
      params: { mode, page, limit },
    });

    const matchList = Array.isArray(response.data) ? response.data : response.data.matches || [];
    const currentUserId = useAuthStore.getState().user?.id;

    const matches: Match[] = matchList.map((match: any) => {
      const otherUser = match.user1Id === currentUserId ? match.user2 : match.user1;
      const photos = otherUser?.profile?.photos || otherUser?.photos || [];
      return {
        id: match.id,
        userId: otherUser?.id || '',
        displayName: extractDisplayName(otherUser),
        profilePhoto: Array.isArray(photos) && photos.length > 0 ? photos[0] : '',
        compatibilityScore: estimateCompatibility(match),
        mode: match.mode || mode,
        matchedAt: match.matchedAt || match.createdAt,
        lastMessage: match.lastMessage || undefined,
        isOnline: isRecentlyActive(otherUser),
        distance: match.distanceAtMatchKm ? Math.round(match.distanceAtMatchKm * 1000) : undefined,
      };
    });

    return { matches, hasMore: matchList.length >= limit };
  },

  async getMatchDetail(matchId: string): Promise<MatchDetail> {
    const response = await apiClient.get(`/match/${matchId}`);
    const match = response.data;
    const currentUserId = useAuthStore.getState().user?.id;
    const otherUser = match.user1Id === currentUserId ? match.user2 : match.user1;
    const photos = otherUser?.profile?.photos || otherUser?.photos || [];

    return {
      id: match.id,
      userId: otherUser?.id || '',
      displayName: extractDisplayName(otherUser),
      bio: otherUser?.profile?.bio || otherUser?.bio || '',
      age: otherUser?.profile?.age || otherUser?.age || 0,
      profilePhotos: Array.isArray(photos) ? photos : [],
      interests: otherUser?.profile?.interests || otherUser?.interests || [],
      vibes: otherUser?.profile?.vibes || otherUser?.vibes || [],
      compatibilityScore: estimateCompatibility(match),
      mode: match.mode || 'social',
      matchedAt: match.matchedAt || match.createdAt,
      profession: otherUser?.profile?.occupation || otherUser?.profession,
      company: otherUser?.profile?.company || otherUser?.company,
    };
  },

  async unmatch(matchId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/match/${matchId}`);
    return response.data;
  },

  async sendHi(matchId: string, message?: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>(`/chat/match/${matchId}/messages`, {
      content: message || 'Hi! 👋',
    });
    return { message: response.data?.content || 'Hi sent!' };
  },
};
