// ============================================================
// MYKO Admin - TypeScript Type Definitions
// ============================================================

// --- Authentication ---

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  lastLogin: string;
  createdAt: string;
}

export type AdminRole = "super_admin" | "admin" | "moderator" | "viewer";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
  expiresAt: string;
}

// --- Users ---

export interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  age: number;
  gender: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
    country: string;
  };
  status: UserStatus;
  verificationStatus: VerificationStatus;
  reportCount: number;
  matchCount: number;
  messageCount: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = "active" | "suspended" | "banned" | "deactivated" | "pending";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  verificationStatus?: VerificationStatus;
  minAge?: number;
  maxAge?: number;
  city?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// --- Reports ---

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: ReportReason;
  description: string;
  evidence?: ReportEvidence[];
  status: ReportStatus;
  priority: ReportPriority;
  assignedTo?: string;
  resolution?: ReportResolution;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportReason =
  | "harassment"
  | "spam"
  | "fake_profile"
  | "inappropriate_content"
  | "underage"
  | "scam"
  | "hate_speech"
  | "threatening"
  | "impersonation"
  | "other";

export type ReportStatus = "pending" | "in_review" | "resolved" | "escalated" | "dismissed";

export type ReportPriority = "low" | "medium" | "high" | "critical";

export type ReportResolution = "dismissed" | "warning_issued" | "user_suspended" | "user_banned" | "content_removed";

export interface ReportEvidence {
  id: string;
  type: "screenshot" | "message" | "profile";
  url: string;
  caption?: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  priority?: ReportPriority;
  reason?: ReportReason;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// --- Analytics ---

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalMatches: number;
  matchesToday: number;
  totalMessages: number;
  messagesToday: number;
  pendingReports: number;
  resolvedReportsToday: number;
  averageResponseTime: number; // minutes
  userRetentionRate: number; // percentage
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  userGrowth: TimeSeriesDataPoint[];
  dailyActiveUsers: TimeSeriesDataPoint[];
  matchesByDay: TimeSeriesDataPoint[];
  messagesByDay: TimeSeriesDataPoint[];
  reportsByCategory: ChartData[];
  usersByAge: ChartData[];
  usersByCity: ChartData[];
  retentionCohorts: RetentionCohort[];
}

export interface RetentionCohort {
  cohort: string;
  users: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
}

// --- Moderation ---

export interface ModerationAction {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: ModerationActionType;
  reason: string;
  duration?: number; // hours, for suspensions
  reportId?: string;
  createdAt: string;
}

export type ModerationActionType = "warning" | "content_removal" | "suspension" | "ban" | "unban" | "unsuspend";

// --- Pagination ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// --- API ---

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
