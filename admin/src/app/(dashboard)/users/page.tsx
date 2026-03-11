"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import DataTable from "@/components/DataTable";
import { getUsers } from "@/lib/api";
import {
  cn,
  formatRelativeTime,
  formatNumber,
  formatEnumLabel,
  getStatusColor,
  getInitials,
} from "@/lib/utils";
import type { User, UserStatus, VerificationStatus } from "@/types";

const verificationIcons: Record<string, React.ElementType> = {
  verified: ShieldCheck,
  pending: Shield,
  unverified: ShieldAlert,
  rejected: ShieldX,
};

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [verificationFilter, setVerificationFilter] = useState<
    VerificationStatus | ""
  >("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", searchQuery, statusFilter, verificationFilter],
    queryFn: () =>
      getUsers({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        verificationStatus: verificationFilter || undefined,
      }),
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      size: 250,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
            getStatusColor(row.original.status)
          )}
        >
          {formatEnumLabel(row.original.status)}
        </span>
      ),
    },
    {
      accessorKey: "verificationStatus",
      header: "Verification",
      cell: ({ row }) => {
        const status = row.original.verificationStatus;
        const Icon = verificationIcons[status] || Shield;
        return (
          <div className="flex items-center gap-1.5">
            <Icon
              className={cn(
                "w-4 h-4",
                status === "verified" && "text-emerald-500",
                status === "pending" && "text-amber-500",
                status === "unverified" && "text-gray-400",
                status === "rejected" && "text-red-500"
              )}
            />
            <span className="text-sm">{formatEnumLabel(status)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.location.city}, {row.original.location.state}
        </span>
      ),
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.age}</span>
      ),
    },
    {
      accessorKey: "matchCount",
      header: "Matches",
      cell: ({ row }) => (
        <span className="text-sm">{formatNumber(row.original.matchCount)}</span>
      ),
    },
    {
      accessorKey: "reportCount",
      header: "Reports",
      cell: ({ row }) => {
        const count = row.original.reportCount;
        return (
          <span
            className={cn(
              "text-sm font-medium",
              count >= 3
                ? "text-red-600"
                : count > 0
                ? "text-amber-600"
                : "text-muted-foreground"
            )}
          >
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(row.original.lastActive)}
        </span>
      ),
    },
  ];

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Search and manage platform users
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or display name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | "")}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="deactivated">Deactivated</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={verificationFilter}
          onChange={(e) =>
            setVerificationFilter(e.target.value as VerificationStatus | "")
          }
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Verification</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="unverified">Unverified</option>
          <option value="rejected">Rejected</option>
        </select>

        {(statusFilter || verificationFilter || searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setVerificationFilter("");
              setSearchQuery("");
            }}
            className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {users.length} user{users.length !== 1 ? "s" : ""} found
        </span>
        {data?.total !== undefined && data.total > users.length && (
          <span>({formatNumber(data.total)} total)</span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          onRowClick={(user) => router.push(`/users/${user.id}`)}
        />
      )}
    </div>
  );
}
