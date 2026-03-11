import apiClient from './client';
import { User } from '../store/authStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// Check if we're in dev mode (no __DEV__ on web, so also check API reachability)
const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

/**
 * Create a mock user from registration or login data
 */
function createMockUser(data: { email: string; firstName?: string; lastName?: string; dateOfBirth?: string; gender?: string }): User {
  return {
    id: 'dev-user',
    email: data.email,
    firstName: data.firstName || 'Dev',
    lastName: data.lastName || 'User',
    displayName: data.firstName || 'DevUser',
    bio: '',
    gender: (data.gender as User['gender']) || 'prefer_not_to_say',
    dateOfBirth: data.dateOfBirth || '2000-01-01',
    profilePhotos: [],
    socialInterests: [],
    professionalInterests: [],
    vibes: [],
    isVerified: false,
    isOnboardingComplete: false,
    createdAt: new Date().toISOString(),
  };
}

function createMockAuthResponse(user: User): AuthResponse {
  return {
    user,
    accessToken: 'dev_access_token_' + Date.now(),
    refreshToken: 'dev_refresh_token_' + Date.now(),
  };
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock login');
        const user = createMockUser({ email: data.email });
        user.isVerified = true;
        user.isOnboardingComplete = false;
        return createMockAuthResponse(user);
      }
      throw error;
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, using mock registration');
        const user = createMockUser({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
        });
        return createMockAuthResponse(user);
      }
      throw error;
    }
  },

  async verifyEmail(_data: VerifyEmailRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/verify-email',
        _data,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, mock email verification success');
        return { message: 'Email verified successfully' };
      }
      throw error;
    }
  },

  async resendVerification(
    email: string,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/resend-verification',
        { email },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Verification code resent' };
      }
      throw error;
    }
  },

  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/forgot-password',
        data,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Password reset email sent' };
      }
      throw error;
    }
  },

  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/reset-password',
        data,
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Password reset successfully' };
      }
      throw error;
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return createMockUser({ email: 'dev@proximity.app' });
      }
      throw error;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<User>('/auth/profile', data);
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        const base = createMockUser({ email: 'dev@proximity.app' });
        return { ...base, ...data } as User;
      }
      throw error;
    }
  },

  async uploadProfilePhoto(
    formData: FormData,
  ): Promise<{ url: string }> {
    try {
      const response = await apiClient.post<{ url: string }>(
        '/auth/profile/photo',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { url: 'https://randomuser.me/api/portraits/lego/2.jpg' };
      }
      throw error;
    }
  },

  async deleteAccount(): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        '/auth/account',
      );
      return response.data;
    } catch (error) {
      if (IS_DEV) {
        return { message: 'Account deleted' };
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      if (IS_DEV) {
        console.log('[DEV] Backend unavailable, mock logout');
        return;
      }
      throw error;
    }
  },
};
