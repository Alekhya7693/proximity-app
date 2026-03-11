"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Calendar,
  Heart,
  MessageSquare,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Ban,
  UserX,
  Undo2,
} from "lucide-react";
import { getUserById, getUserModerationHistory, getReports } from "@/lib/api";
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatEnumLabel,
  getStatusColor,
  getInitials,
  formatDuration,
} from "@/lib/utils";
import ReportActions from "@/components/ReportActions";
import type { ModerationActionType } from "@/types";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "moderation", label: "Moderation History" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const verificationIcons: Record<string, React.ElementType> = {
  verified: ShieldCheck,
  pending: Shield,
  unverified: ShieldAlert,
  rejected: ShieldX,
};

const moderationActionIcons: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  suspension: Clock,
  ban: Ban,
  content_removal: UserX,
  unban: Undo2,
  unsuspend: Undo2,
};

const moderationActionColors: Record<string, string> = {
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  suspension: "text-orange-600 bg-orange-50 border-orange-200",
  ban: "text-red-600 bg-red-50 border-red-200",
  content_removal: "text-gray-600 bg-gray-50 border-gray-200",
  unban: "text-emerald-600 bg-emerald-50 border-emerald-200",
  unsuspend: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
  });

  const { data: moderationHistory } = useQuery({
    queryKey: ["user-moderation", userId],
    queryFn: () => getUserModerationHistory(userId),
    enabled: activeTab === "moderation",
  });

  const { data: userReports } = useQuery({
    queryKey: ["user-reports", userId],
    queryFn: () => getReports(),
    enabled: activeTab === "reports",
    select: (data) => ({
      ...data,
      data: data.data.filter(
        (r) => r.reportedUserId === userId || r.reporterId === userId
      ),
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  const VerifIcon = verificationIcons[user.verificationStatus] || Shield;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </button>

      {/* User Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary text-2xl font-bold flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  getStatusColor(user.status)
                )}
              >
                {formatEnumLabel(user.status)}
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  user.verificationStatus === "verified" && "text-emerald-600",
                  user.verificationStatus === "pending" && "text-amber-600",
                  user.verificationStatus === "unverified" && "text-gray-500",
                  user.verificationStatus === "rejected" && "text-red-600"
                )}
              >
                <VerifIcon className="w-3.5 h-3.5" />
                {formatEnumLabel(user.verificationStatus)}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              @{user.displayName} &middot; {user.age} years old &middot;{" "}
              {formatEnumLabel(user.gender)}
            </p>

            {user.bio && (
              <p className="text-sm mt-2 text-muted-foreground">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {user.location.city}, {user.location.state},{" "}
                {user.location.country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 sm:gap-8 flex-shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-50 text-pink-600 mx-auto mb-1">
                <Heart className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold">
                {formatNumber(user.matchCount)}
              </p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 mx-auto mb-1">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold">
                {formatNumber(user.messageCount)}
              </p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-1",
                  user.reportCount > 0
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-50 text-gray-400"
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold">
                {formatNumber(user.reportCount)}
              </p>
              <p className="text-xs text-muted-foreground">Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Details */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold">Account Details</h3>
              <dl className="space-y-3">
                {[
                  { label: "User ID", value: user.id },
                  { label: "Email", value: user.email },
                  { label: "Display Name", value: user.displayName },
                  { label: "Age", value: `${user.age} years old` },
                  { label: "Gender", value: formatEnumLabel(user.gender) },
                  {
                    label: "Last Active",
                    value: formatRelativeTime(user.lastActive),
                  },
                  { label: "Joined", value: formatDate(user.createdAt) },
                  {
                    label: "Last Updated",
                    value: formatDate(user.updatedAt),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium text-right">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold">Location</h3>
              <dl className="space-y-3">
                {[
                  { label: "City", value: user.location.city },
                  { label: "State", value: user.location.state },
                  { label: "Country", value: user.location.country },
                  {
                    label: "Coordinates",
                    value: `${user.location.lat.toFixed(4)}, ${user.location.lng.toFixed(4)}`,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                Map placeholder
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4">
            {!userReports?.data?.length ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No reports found for this user
                </p>
              </div>
            ) : (
              userReports.data.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            getStatusColor(report.priority)
                          )}
                        >
                          {formatEnumLabel(report.priority)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            getStatusColor(report.status)
                          )}
                        >
                          {formatEnumLabel(report.status)}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium mt-2">
                        {formatEnumLabel(report.reason)}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Reported by{" "}
                        <Link
                          href={`/users/${report.reporterId}`}
                          className="text-primary hover:underline"
                        >
                          {report.reporterName}
                        </Link>{" "}
                        &middot; {formatRelativeTime(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ReportActions report={report} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="space-y-4">
            {!moderationHistory?.length ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No moderation actions found for this user
                </p>
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

                {moderationHistory.map((action, index) => {
                  const Icon =
                    moderationActionIcons[action.action] || AlertTriangle;
                  const colorClass =
                    moderationActionColors[action.action] ||
                    "text-gray-600 bg-gray-50 border-gray-200";

                  return (
                    <div key={action.id} className="relative pb-6 last:pb-0">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute -left-5 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          colorClass
                        )}
                      >
                        <Icon className="w-3 h-3" />
                      </div>

                      <div
                        className={cn(
                          "rounded-lg border p-4",
                          colorClass
                            .split(" ")
                            .filter((c) => c.startsWith("bg-") || c.startsWith("border-"))
                            .join(" ")
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            {formatEnumLabel(action.action)}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(action.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.reason}
                        </p>
                        {action.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Duration: {formatDuration(action.duration * 60)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          By {action.adminName} &middot;{" "}
                          {formatDate(action.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
