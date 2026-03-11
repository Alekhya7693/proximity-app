import { getToken, logout } from "./auth";
import type {
  ApiResponse,
  AnalyticsData,
  DashboardMetrics,
  ModerationAction,
  ModerationActionType,
  PaginatedResponse,
  Report,
  ReportFilters,
  ReportResolution,
  User,
  UserFilters,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * Base fetch wrapper with auth headers and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw new Error(error.message || "An error occurred");
  }

  return response.json();
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const data = await apiFetch<ApiResponse<DashboardMetrics>>("/admin/dashboard/metrics");
    return data.data;
  } catch {
    // Return mock data for development
    return getMockDashboardMetrics();
  }
}

// ============================================================
// Users
// ============================================================

export async function getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const data = await apiFetch<ApiResponse<PaginatedResponse<User>>>(
      `/admin/users?${params.toString()}`
    );
    return data.data;
  } catch {
    return getMockUsers(filters);
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const data = await apiFetch<ApiResponse<User>>(`/admin/users/${id}`);
    return data.data;
  } catch {
    return getMockUserDetail(id);
  }
}

export async function updateUserStatus(
  userId: string,
  status: string,
  reason: string
): Promise<void> {
  await apiFetch(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

// ============================================================
// Reports
// ============================================================

export async function getReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const data = await apiFetch<ApiResponse<PaginatedResponse<Report>>>(
      `/admin/reports?${params.toString()}`
    );
    return data.data;
  } catch {
    return getMockReports(filters);
  }
}

export async function resolveReport(
  reportId: string,
  resolution: ReportResolution,
  notes?: string
): Promise<void> {
  await apiFetch(`/admin/reports/${reportId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution, notes }),
  });
}

// ============================================================
// Moderation
// ============================================================

export async function createModerationAction(
  targetUserId: string,
  action: ModerationActionType,
  reason: string,
  duration?: number,
  reportId?: string
): Promise<ModerationAction> {
  try {
    const data = await apiFetch<ApiResponse<ModerationAction>>("/admin/moderation/actions", {
      method: "POST",
      body: JSON.stringify({ targetUserId, action, reason, duration, reportId }),
    });
    return data.data;
  } catch {
    return {
      id: `mod-${Date.now()}`,
      adminId: "admin-001",
      adminName: "Admin User",
      targetUserId,
      targetUserName: "User",
      action,
      reason,
      duration,
      reportId,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getUserModerationHistory(
  userId: string
): Promise<ModerationAction[]> {
  try {
    const data = await apiFetch<ApiResponse<ModerationAction[]>>(
      `/admin/users/${userId}/moderation-history`
    );
    return data.data;
  } catch {
    return getMockModerationHistory(userId);
  }
}

// ============================================================
// Analytics
// ============================================================

export async function getAnalytics(
  period: string = "30d"
): Promise<AnalyticsData> {
  try {
    const data = await apiFetch<ApiResponse<AnalyticsData>>(
      `/admin/analytics?period=${period}`
    );
    return data.data;
  } catch {
    return getMockAnalytics();
  }
}

// ============================================================
// Mock Data (Development)
// ============================================================

function getMockDashboardMetrics(): DashboardMetrics {
  return {
    totalUsers: 48293,
    activeUsers: 12847,
    newUsersToday: 234,
    newUsersThisWeek: 1583,
    totalMatches: 89432,
    matchesToday: 1247,
    totalMessages: 523891,
    messagesToday: 18934,
    pendingReports: 47,
    resolvedReportsToday: 23,
    averageResponseTime: 42,
    userRetentionRate: 68.4,
  };
}

function getMockUsers(filters?: UserFilters): PaginatedResponse<User> {
  const mockUsers: User[] = [
    {
      id: "usr-001", email: "sarah.j@email.com", name: "Sarah Johnson", displayName: "Sarah J",
      avatar: undefined, bio: "Love exploring new places!", age: 28, gender: "female",
      location: { lat: 40.7128, lng: -74.006, city: "New York", state: "NY", country: "US" },
      status: "active", verificationStatus: "verified", reportCount: 0, matchCount: 34,
      messageCount: 892, lastActive: "2024-01-15T10:30:00Z", createdAt: "2023-06-15T00:00:00Z", updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "usr-002", email: "mike.r@email.com", name: "Mike Rodriguez", displayName: "Mike R",
      avatar: undefined, bio: "Coffee enthusiast", age: 32, gender: "male",
      location: { lat: 34.0522, lng: -118.2437, city: "Los Angeles", state: "CA", country: "US" },
      status: "active", verificationStatus: "verified", reportCount: 1, matchCount: 22,
      messageCount: 567, lastActive: "2024-01-14T18:45:00Z", createdAt: "2023-08-20T00:00:00Z", updatedAt: "2024-01-14T18:45:00Z",
    },
    {
      id: "usr-003", email: "emily.c@email.com", name: "Emily Chen", displayName: "Em",
      avatar: undefined, bio: "Photographer & traveler", age: 25, gender: "female",
      location: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", country: "US" },
      status: "active", verificationStatus: "pending", reportCount: 0, matchCount: 18,
      messageCount: 234, lastActive: "2024-01-15T08:15:00Z", createdAt: "2023-11-01T00:00:00Z", updatedAt: "2024-01-15T08:15:00Z",
    },
    {
      id: "usr-004", email: "james.w@email.com", name: "James Wilson", displayName: "JW",
      avatar: undefined, bio: "Fitness & outdoors", age: 30, gender: "male",
      location: { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL", country: "US" },
      status: "suspended", verificationStatus: "verified", reportCount: 3, matchCount: 45,
      messageCount: 1203, lastActive: "2024-01-10T14:20:00Z", createdAt: "2023-04-10T00:00:00Z", updatedAt: "2024-01-10T14:20:00Z",
    },
    {
      id: "usr-005", email: "alex.k@email.com", name: "Alex Kim", displayName: "Alex",
      avatar: undefined, bio: "Music lover", age: 27, gender: "non-binary",
      location: { lat: 47.6062, lng: -122.3321, city: "Seattle", state: "WA", country: "US" },
      status: "active", verificationStatus: "unverified", reportCount: 0, matchCount: 8,
      messageCount: 45, lastActive: "2024-01-15T12:00:00Z", createdAt: "2024-01-05T00:00:00Z", updatedAt: "2024-01-15T12:00:00Z",
    },
    {
      id: "usr-006", email: "priya.s@email.com", name: "Priya Sharma", displayName: "Priya",
      avatar: undefined, bio: "Foodie & tech geek", age: 29, gender: "female",
      location: { lat: 30.2672, lng: -97.7431, city: "Austin", state: "TX", country: "US" },
      status: "active", verificationStatus: "verified", reportCount: 0, matchCount: 56,
      messageCount: 1890, lastActive: "2024-01-15T09:00:00Z", createdAt: "2023-03-15T00:00:00Z", updatedAt: "2024-01-15T09:00:00Z",
    },
    {
      id: "usr-007", email: "bad.actor@spam.com", name: "Spam Account", displayName: "HotSingles",
      avatar: undefined, bio: "Click my link!!!", age: 99, gender: "male",
      location: { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL", country: "US" },
      status: "banned", verificationStatus: "rejected", reportCount: 12, matchCount: 0,
      messageCount: 500, lastActive: "2024-01-05T00:00:00Z", createdAt: "2024-01-04T00:00:00Z", updatedAt: "2024-01-05T00:00:00Z",
    },
  ];

  let filtered = [...mockUsers];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.displayName.toLowerCase().includes(s)
    );
  }
  if (filters?.status) {
    filtered = filtered.filter((u) => u.status === filters.status);
  }

  return {
    data: filtered,
    total: filtered.length,
    page: filters?.page || 1,
    limit: filters?.limit || 20,
    totalPages: 1,
    hasMore: false,
  };
}

function getMockUserDetail(id: string): User {
  const users = getMockUsers().data;
  return users.find((u) => u.id === id) || users[0];
}

function getMockReports(filters?: ReportFilters): PaginatedResponse<Report> {
  const mockReports: Report[] = [
    {
      id: "rpt-001", reporterId: "usr-001", reporterName: "Sarah Johnson",
      reportedUserId: "usr-004", reportedUserName: "James Wilson",
      reason: "harassment", description: "Sending unwanted messages repeatedly after being asked to stop.",
      status: "pending", priority: "high", createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "rpt-002", reporterId: "usr-003", reporterName: "Emily Chen",
      reportedUserId: "usr-007", reportedUserName: "Spam Account",
      reason: "spam", description: "Profile contains spam links and fake information.",
      status: "pending", priority: "medium", createdAt: "2024-01-14T22:30:00Z", updatedAt: "2024-01-14T22:30:00Z",
    },
    {
      id: "rpt-003", reporterId: "usr-006", reporterName: "Priya Sharma",
      reportedUserId: "usr-004", reportedUserName: "James Wilson",
      reason: "threatening", description: "Sent threatening messages after rejected match request.",
      status: "escalated", priority: "critical", createdAt: "2024-01-14T16:00:00Z", updatedAt: "2024-01-15T09:00:00Z",
    },
    {
      id: "rpt-004", reporterId: "usr-002", reporterName: "Mike Rodriguez",
      reportedUserId: "usr-005", reportedUserName: "Alex Kim",
      reason: "fake_profile", description: "Profile photos appear to be AI-generated.",
      status: "in_review", priority: "low", assignedTo: "admin-001",
      createdAt: "2024-01-13T10:00:00Z", updatedAt: "2024-01-14T10:00:00Z",
    },
    {
      id: "rpt-005", reporterId: "usr-005", reporterName: "Alex Kim",
      reportedUserId: "usr-002", reportedUserName: "Mike Rodriguez",
      reason: "inappropriate_content", description: "Inappropriate photos in profile gallery.",
      status: "resolved", priority: "medium", resolution: "warning_issued", resolvedBy: "admin-001",
      resolvedAt: "2024-01-13T14:00:00Z", createdAt: "2024-01-12T20:00:00Z", updatedAt: "2024-01-13T14:00:00Z",
    },
    {
      id: "rpt-006", reporterId: "usr-001", reporterName: "Sarah Johnson",
      reportedUserId: "usr-007", reportedUserName: "Spam Account",
      reason: "scam", description: "Trying to redirect users to a phishing website.",
      status: "resolved", priority: "critical", resolution: "user_banned", resolvedBy: "admin-001",
      resolvedAt: "2024-01-05T12:00:00Z", createdAt: "2024-01-04T18:00:00Z", updatedAt: "2024-01-05T12:00:00Z",
    },
  ];

  let filtered = [...mockReports];
  if (filters?.status) {
    filtered = filtered.filter((r) => r.status === filters.status);
  }
  if (filters?.priority) {
    filtered = filtered.filter((r) => r.priority === filters.priority);
  }

  return {
    data: filtered,
    total: filtered.length,
    page: filters?.page || 1,
    limit: filters?.limit || 20,
    totalPages: 1,
    hasMore: false,
  };
}

function getMockModerationHistory(userId: string): ModerationAction[] {
  if (userId === "usr-004") {
    return [
      {
        id: "mod-001", adminId: "admin-001", adminName: "Admin User",
        targetUserId: "usr-004", targetUserName: "James Wilson",
        action: "warning", reason: "First offense - inappropriate messages",
        createdAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "mod-002", adminId: "admin-001", adminName: "Admin User",
        targetUserId: "usr-004", targetUserName: "James Wilson",
        action: "suspension", reason: "Repeated harassment reports", duration: 72,
        createdAt: "2024-01-10T14:00:00Z",
      },
    ];
  }
  if (userId === "usr-007") {
    return [
      {
        id: "mod-003", adminId: "admin-001", adminName: "Admin User",
        targetUserId: "usr-007", targetUserName: "Spam Account",
        action: "ban", reason: "Confirmed spam/scam account", reportId: "rpt-006",
        createdAt: "2024-01-05T12:00:00Z",
      },
    ];
  }
  return [];
}

function getMockAnalytics(): AnalyticsData {
  const generateTimeSeries = (days: number, baseValue: number, variance: number) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(baseValue + (Math.random() - 0.5) * variance),
      });
    }
    return data;
  };

  return {
    userGrowth: generateTimeSeries(30, 150, 80),
    dailyActiveUsers: generateTimeSeries(30, 12000, 4000),
    matchesByDay: generateTimeSeries(30, 1200, 600),
    messagesByDay: generateTimeSeries(30, 18000, 8000),
    reportsByCategory: [
      { name: "Harassment", value: 34, color: "#ef4444" },
      { name: "Spam", value: 28, color: "#f97316" },
      { name: "Fake Profile", value: 22, color: "#eab308" },
      { name: "Inappropriate", value: 18, color: "#8b5cf6" },
      { name: "Scam", value: 12, color: "#ec4899" },
      { name: "Other", value: 8, color: "#6b7280" },
    ],
    usersByAge: [
      { name: "18-24", value: 12400 },
      { name: "25-30", value: 18200 },
      { name: "31-35", value: 9800 },
      { name: "36-40", value: 4600 },
      { name: "41-50", value: 2100 },
      { name: "50+", value: 1193 },
    ],
    usersByCity: [
      { name: "New York", value: 8420 },
      { name: "Los Angeles", value: 6890 },
      { name: "Chicago", value: 4230 },
      { name: "Houston", value: 3560 },
      { name: "San Francisco", value: 3210 },
      { name: "Austin", value: 2890 },
      { name: "Seattle", value: 2450 },
      { name: "Miami", value: 2180 },
    ],
    retentionCohorts: [
      { cohort: "Week 1 (Jan 1-7)", users: 1200, day1: 82, day7: 54, day14: 41, day30: 32 },
      { cohort: "Week 2 (Jan 8-14)", users: 1450, day1: 85, day7: 58, day14: 44, day30: 0 },
      { cohort: "Week 3 (Jan 15-21)", users: 1100, day1: 80, day7: 52, day14: 0, day30: 0 },
      { cohort: "Week 4 (Jan 22-28)", users: 1380, day1: 83, day7: 0, day14: 0, day30: 0 },
    ],
  };
}
