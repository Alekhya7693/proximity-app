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
      return {
        id: match.id,
        userId: otherUser?.id || '',
        displayName: otherUser?.firstName
          ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
          : otherUser?.username || 'User',
        profilePhoto: '',
        compatibilityScore: 0,
        mode: mode,
        matchedAt: match.matchedAt,
        isOnline: false,
        distance: match.distanceAtMatchKm ? Math.round(match.distanceAtMatchKm * 1000) : undefined,
      };
    });

    return { matches, hasMore: false };
  },

  async getMatchDetail(matchId: string): Promise<MatchDetail> {
    const response = await apiClient.get(`/match/${matchId}`);
    const match = response.data;
    const currentUserId = useAuthStore.getState().user?.id;
    const otherUser = match.user1Id === currentUserId ? match.user2 : match.user1;

    return {
      id: match.id,
      userId: otherUser?.id || '',
      displayName: otherUser?.firstName
        ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
        : otherUser?.username || 'User',
      bio: otherUser?.bio || '',
      age: otherUser?.age || 0,
      profilePhotos: otherUser?.photos || [],
      interests: otherUser?.interests || [],
      vibes: otherUser?.vibes || [],
      compatibilityScore: 0,
      mode: match.mode || 'social',
      matchedAt: match.matchedAt,
      profession: otherUser?.profession,
      company: otherUser?.company,
    };
  },

  async unmatch(matchId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/match/${matchId}`);
    return response.data;
  },

  async sendHi(matchId: string, message?: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>(`/chat/match/${matchId}/messages`, {
      content: message || 'Hi!',
    });
    return { message: response.data?.content || 'Hi sent!' };
  },
};
