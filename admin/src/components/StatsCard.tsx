"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-emerald-600";
    if (trend.value < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const TrendIcon = getTrendIcon();

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && TrendIcon && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                getTrendColor()
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {Math.abs(trend.value)}%
            </span>
          )}
          {(description || trend?.label) && (
            <span className="text-xs text-muted-foreground">
              {description || trend?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
