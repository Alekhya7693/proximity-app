"use client";

import { useState } from "react";
import {
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createModerationAction } from "@/lib/api";
import type { Report, ReportResolution, ModerationActionType } from "@/types";

interface ReportActionsProps {
  report: Report;
  onActionComplete?: (reportId: string, resolution: ReportResolution) => void;
  compact?: boolean;
}

interface ActionConfig {
  label: string;
  icon: React.ElementType;
  resolution: ReportResolution;
  moderationAction?: ModerationActionType;
  variant: "ghost" | "warning" | "danger";
  confirmMessage: string;
  requireDuration?: boolean;
}

const actions: ActionConfig[] = [
  {
    label: "Dismiss",
    icon: XCircle,
    resolution: "dismissed",
    variant: "ghost",
    confirmMessage: "Dismiss this report? No action will be taken against the user.",
  },
  {
    label: "Warn",
    icon: AlertTriangle,
    resolution: "warning_issued",
    moderationAction: "warning",
    variant: "warning",
    confirmMessage: "Send a warning to the reported user?",
  },
  {
    label: "Suspend",
    icon: Clock,
    resolution: "user_suspended",
    moderationAction: "suspension",
    variant: "danger",
    confirmMessage: "Suspend the reported user?",
    requireDuration: true,
  },
  {
    label: "Ban",
    icon: Ban,
    resolution: "user_banned",
    moderationAction: "ban",
    variant: "danger",
    confirmMessage: "Permanently ban the reported user? This action is serious.",
  },
];

const variantStyles = {
  ghost:
    "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  warning:
    "border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100",
  danger:
    "border border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
};

export default function ReportActions({
  report,
  onActionComplete,
  compact = false,
}: ReportActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [duration, setDuration] = useState(24);
  const [reason, setReason] = useState("");
  const [completed, setCompleted] = useState(false);

  if (report.status === "resolved" || report.status === "dismissed") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>
          {report.resolution
            ? report.resolution.replace(/_/g, " ")
            : report.status}
        </span>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle2 className="w-4 h-4" />
        <span>Action completed</span>
      </div>
    );
  }

  const handleAction = async (action: ActionConfig) => {
    if (confirming !== action.resolution) {
      setConfirming(action.resolution);
      return;
    }

    setLoading(action.resolution);
    try {
      if (action.moderationAction) {
        await createModerationAction(
          report.reportedUserId,
          action.moderationAction,
          reason || `Report ${report.id}: ${report.reason}`,
          action.requireDuration ? duration : undefined,
          report.id
        );
      }
      onActionComplete?.(report.id, action.resolution);
      setCompleted(true);
    } catch (error) {
      console.error("Failed to execute action:", error);
    } finally {
      setLoading(null);
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Confirmation panel */}
      {confirming && (
        <div className="p-3 rounded-lg border border-border bg-muted/50 space-y-3 animate-fade-in">
          <p className="text-sm font-medium">
            {actions.find((a) => a.resolution === confirming)?.confirmMessage}
          </p>

          {actions.find((a) => a.resolution === confirming)?.requireDuration && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                Duration:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="px-2 py-1 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>
          )}

          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-1.5 rounded border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleAction(
                  actions.find((a) => a.resolution === confirming)!
                )
              }
              disabled={loading !== null}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Confirm"
              )}
            </button>
            <button
              onClick={() => {
                setConfirming(null);
                setReason("");
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        className={cn(
          "flex gap-2",
          compact ? "flex-row" : "flex-wrap"
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.resolution}
              onClick={() => handleAction(action)}
              disabled={loading !== null}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                variantStyles[action.variant],
                confirming === action.resolution && "ring-2 ring-ring"
              )}
            >
              {loading === action.resolution ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {!compact && action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
