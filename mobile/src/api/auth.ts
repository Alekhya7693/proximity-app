import apiClient from './client';
import { User } from '../store/authStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
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

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// Mock user for demo/development when backend is unavailable
const createMockUser = (data: Partial<RegisterRequest & LoginRequest>): User => ({
  id: 'demo-user-' + Date.now(),
  email: data.email || 'demo@myko.app',
  firstName: (data as RegisterRequest).firstName || 'Demo',
  lastName: (data as RegisterRequest).lastName || 'User',
  displayName: (data as RegisterRequest).username || (data as RegisterRequest).firstName || 'DemoUser',
  bio: 'Night owl who loves exploring hidden coffee shops and street art. Always up for a spontaneous adventure or deep conversation over pour-over coffee.',
  gender: 'prefer_not_to_say',
  dateOfBirth: '1996-05-15',
  profilePhotos: [],
  socialInterests: ['Photography', 'Coffee Culture', 'Street Art', 'Live Music', 'Hiking', 'Film'],
  professionalInterests: ['UX Design', 'Startups', 'Product Management'],
  vibes: ['Coffee Chat', 'Adventure', 'Creative'],
  isVerified: true,
  isOnboardingComplete: true,
  createdAt: new Date().toISOString(),
});

const createMockAuthResponse = (data: Partial<RegisterRequest & LoginRequest>): AuthResponse => ({
  user: createMockUser(data),
  tokens: {
    accessToken: 'demo_access_token_' + Date.now(),
    refreshToken: 'demo_refresh_token_' + Date.now(),
    expiresIn: 86400,
  },
});

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, using mock login');
        await new Promise(r => setTimeout(r, 800)); // Simulate network delay
        return createMockAuthResponse(data);
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
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, using mock register');
        await new Promise(r => setTimeout(r, 800));
        return createMockAuthResponse(data);
      }
      throw error;
    }
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/verify-email',
        data,
      );
      return response.data;
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock email verified');
        await new Promise(r => setTimeout(r, 600));
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
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock resend verification');
        await new Promise(r => setTimeout(r, 500));
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
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock forgot password');
        await new Promise(r => setTimeout(r, 600));
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
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock reset password');
        await new Promise(r => setTimeout(r, 600));
        return { message: 'Password reset successfully' };
      }
      throw error;
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/profile/me');
      return response.data;
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, using mock profile');
        return createMockUser({});
      }
      throw error;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/profile', data);
      return response.data;
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock profile update');
        return createMockUser({}) ;
      }
      throw error;
    }
  },

  async uploadProfilePhoto(
    formData: FormData,
  ): Promise<{ url: string }> {
    try {
      const response = await apiClient.post<{ url: string }>(
        '/profile/photo',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data;
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock photo upload');
        return { url: 'https://randomuser.me/api/portraits/lego/1.jpg' };
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
    } catch (error: any) {
      if (IS_DEV && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || !error?.response)) {
        console.log('[DEV] Backend unavailable, mock account deletion');
        return { message: 'Account deleted' };
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout should always succeed client-side even if server is unreachable
    }
  },
};
