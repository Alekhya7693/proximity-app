"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  AlertTriangle,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import DataTable from "@/components/DataTable";
import ReportActions from "@/components/ReportActions";
import { getReports } from "@/lib/api";
import {
  cn,
  formatRelativeTime,
  formatEnumLabel,
  getStatusColor,
  truncate,
} from "@/lib/utils";
import type { Report, ReportStatus, ReportPriority } from "@/types";

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | "">("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "reports",
      statusFilter,
      priorityFilter,
    ],
    queryFn: () =>
      getReports({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
  });

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "priority",
      header: "Priority",
      size: 100,
      sortingFn: (a, b) => {
        const aOrder = priorityOrder[a.original.priority] ?? 99;
        const bOrder = priorityOrder[b.original.priority] ?? 99;
        return aOrder - bOrder;
      },
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              getStatusColor(priority)
            )}
          >
            {priority === "critical" && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
            )}
            {formatEnumLabel(priority)}
          </span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {formatEnumLabel(row.original.reason)}
        </span>
      ),
    },
    {
      accessorKey: "reportedUserName",
      header: "Reported User",
      cell: ({ row }) => (
        <Link
          href={`/users/${row.original.reportedUserId}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {row.original.reportedUserName}
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      accessorKey: "reporterName",
      header: "Reporter",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.reporterName}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
      cell: ({ row }) => (
        <span
          className="text-sm text-muted-foreground"
          title={row.original.description}
        >
          {truncate(row.original.description, 60)}
        </span>
      ),
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
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 280,
      cell: ({ row }) => (
        <ReportActions
          report={row.original}
          compact
          onActionComplete={() => refetch()}
        />
      ),
    },
  ];

  const reports = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user reports
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "")}
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value as ReportPriority | "")
          }
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");
            }}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {reports.length} report{reports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          searchColumn="reportedUserName"
          searchPlaceholder="Search by reported user..."
        />
      )}
    </div>
  );
}
