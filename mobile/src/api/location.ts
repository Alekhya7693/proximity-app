import apiClient from './client';
import { Coordinates } from '../store/locationStore';

export interface NearbyUser {
  userId: string;
  displayName: string;
  profilePhoto: string;
  distance: number;
  compatibilityScore: number;
}

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const MOCK_NEARBY_USERS: NearbyUser[] = [
  {
    userId: 'user-101',
    displayName: 'Alex',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/women/44.jpg',
    distance: 300,
    compatibilityScore: 92,
  },
  {
    userId: 'user-102',
    displayName: 'Jordan',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/men/32.jpg',
    distance: 500,
    compatibilityScore: 87,
  },
  {
    userId: 'user-105',
    displayName: 'Riley',
    profilePhoto: 'https://randomuser.me/api/portraits/thumb/men/22.jpg',
    distance: 400,
    compatibilityScore: 91,
  },
];

export const locationApi = {
  async updateLocation(coords: Coordinates): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/location/update',
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, mock location update');
        return { message: 'Location updated' };
      }
      throw error;
    }
  },

  async getNearbyUsers(
    radius: number = 5000,
  ): Promise<NearbyUser[]> {
    try {
      const response = await apiClient.get<{ users: NearbyUser[] }>(
        '/location/nearby',
        { params: { radius } },
      );
      return response.data.users;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock nearby users');
        return MOCK_NEARBY_USERS;
      }
      throw error;
    }
  },

  async setLocationVisibility(
    visible: boolean,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/location/visibility',
        { visible },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: `Location visibility set to ${visible}` };
      }
      throw error;
    }
  },
};
