"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Heart,
  MessageSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { getDashboardMetrics, getAnalytics } from "@/lib/api";
import {
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatDuration,
} from "@/lib/utils";

export default function DashboardPage() {
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", "7d"],
    queryFn: () => getAnalytics("7d"),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your Proximity platform
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={metrics ? formatNumber(metrics.totalUsers) : "--"}
          icon={Users}
          trend={{ value: 12.5, label: "from last month" }}
        />
        <StatsCard
          title="New Users Today"
          value={metrics ? formatNumber(metrics.newUsersToday) : "--"}
          icon={UserPlus}
          trend={{ value: 8.2, label: "from yesterday" }}
        />
        <StatsCard
          title="Matches Today"
          value={metrics ? formatCompactNumber(metrics.matchesToday) : "--"}
          icon={Heart}
          trend={{ value: -3.1, label: "from yesterday" }}
        />
        <StatsCard
          title="Messages Today"
          value={metrics ? formatCompactNumber(metrics.messagesToday) : "--"}
          icon={MessageSquare}
          trend={{ value: 15.7, label: "from yesterday" }}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Users"
          value={metrics ? formatCompactNumber(metrics.activeUsers) : "--"}
          icon={Activity}
          description="Currently online"
        />
        <StatsCard
          title="Pending Reports"
          value={metrics ? formatNumber(metrics.pendingReports) : "--"}
          icon={AlertTriangle}
          description="Awaiting review"
        />
        <StatsCard
          title="Avg Response Time"
          value={metrics ? formatDuration(metrics.averageResponseTime) : "--"}
          icon={Clock}
          description="Report resolution"
        />
        <StatsCard
          title="Retention Rate"
          value={
            metrics ? formatPercent(metrics.userRetentionRate) : "--"
          }
          icon={TrendingUp}
          trend={{ value: 2.3, label: "from last month" }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold mb-1">User Growth</h3>
          <p className="text-xs text-muted-foreground mb-4">
            New user registrations over the past 30 days
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics?.userGrowth || []}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="userGrowthGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(262, 83%, 58%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(262, 83%, 58%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  fill="url(#userGrowthGradient)"
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Active Users Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold mb-1">Daily Active Users</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Active users per day over the past 30 days
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.dailyActiveUsers || []}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    formatNumber(value),
                    "Active Users",
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(262, 83%, 58%)"
                  radius={[4, 4, 0, 0]}
                  name="Active Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold mb-1">Matches & Messages</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Daily matches and messages over the past 30 days
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              data={
                analytics?.matchesByDay?.map((m, i) => ({
                  date: m.date,
                  matches: m.value,
                  messages: analytics.messagesByDay?.[i]?.value || 0,
                })) || []
              }
            >
              <defs>
                <linearGradient
                  id="matchesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="messagesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => formatNumber(value)}
              />
              <Area
                type="monotone"
                dataKey="matches"
                stroke="#ec4899"
                strokeWidth={2}
                fill="url(#matchesGradient)"
                name="Matches"
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#messagesGradient)"
                name="Messages"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
