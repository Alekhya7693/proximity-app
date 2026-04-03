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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SupportReportRequest {
  category: string;
  description: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/verify-email', data);
    return response.data;
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/profile/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/profile', data);
      return response.data;
    } catch (error: any) {
      // If profile doesn't exist yet (new user), create it first
      if (error?.response?.status === 404) {
        const response = await apiClient.post<User>('/profile', data);
        return response.data;
      }
      throw error;
    }
  },

  async uploadProfilePhoto(formData: FormData): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  async updatePreferences(preferences: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.put('/profile', { preferences });
    return response.data;
  },

  async submitSupportReport(data: SupportReportRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/safety/support', data);
    return response.data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/auth/account');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout should always succeed client-side even if server is unreachable
    }
  },
};
