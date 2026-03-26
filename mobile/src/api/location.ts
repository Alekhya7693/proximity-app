import apiClient from './client';
import { Coordinates } from '../store/locationStore';

export interface NearbyUser {
  userId: string;
  displayName: string;
  profilePhoto: string;
  distance: number;
  compatibilityScore: number;
}

export const locationApi = {
  async updateLocation(coords: Coordinates): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/location/update', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    return response.data;
  },

  async getNearbyUsers(radius: number = 5000): Promise<NearbyUser[]> {
    try {
      const response = await apiClient.get('/location/nearby', {
        params: { radius },
      });
      const users = response.data?.users || response.data || [];
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  },

  async setLocationVisibility(visible: boolean): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/location/visibility', { visible });
    return response.data;
  },

  async clearLocation(): Promise<void> {
    await apiClient.delete('/location');
  },
};
