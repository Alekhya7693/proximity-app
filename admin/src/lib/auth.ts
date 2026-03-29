import type { AdminUser, AuthResponse, LoginCredentials } from "@/types";

const TOKEN_KEY = "myko_admin_token";
const USER_KEY = "myko_admin_user";

/**
 * Store auth data after successful login
 */
export function setAuthData(authResponse: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
}

/**
 * Get the stored auth token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the stored admin user
 */
export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as AdminUser;
  } catch {
    return null;
  }
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Clear auth data (logout)
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login with credentials
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // If a real API URL is configured, try the backend first
  if (apiUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(error.message || "Invalid credentials");
      }

      const data: AuthResponse = await response.json();
      setAuthData(data);
      return data;
    } catch (error) {
      // If API is unreachable, fall through to mock login in dev
      if (process.env.NODE_ENV !== "development") {
        throw error;
      }
    }
  }

  // Development mock login — accepts any email/password
  if (process.env.NODE_ENV === "development") {
    const mockResponse: AuthResponse = {
      token: "dev_mock_token_" + Date.now(),
      user: {
        id: "admin-001",
        email: credentials.email,
        name: "Admin User",
        role: "super_admin",
        lastLogin: new Date().toISOString(),
        createdAt: "2024-01-01T00:00:00Z",
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    setAuthData(mockResponse);
    return mockResponse;
  }

  throw new Error("Unable to connect to the server. Please try again later.");
}

/**
 * Logout and redirect to login
 */
export function logout(): void {
  clearAuthData();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Check if user has a specific role level
 */
export function hasRole(requiredRole: string): boolean {
  const user = getAdminUser();
  if (!user) return false;

  const roleHierarchy: Record<string, number> = {
    viewer: 0,
    moderator: 1,
    admin: 2,
    super_admin: 3,
  };

  const userLevel = roleHierarchy[user.role] ?? -1;
  const requiredLevel = roleHierarchy[requiredRole] ?? 99;
  return userLevel >= requiredLevel;
}
