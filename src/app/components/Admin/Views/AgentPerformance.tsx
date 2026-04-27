'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import BASE_URL from '@/app/config/api/api';

type TimePeriod = 'day' | 'week' | 'month';

interface PriorityDistribution {
  name: string;
  high: number;
  low: number;
  normal: number;
  urgent: number;
}

interface PerformanceDTO {
  agentName: string;
  agentEmail?: string;
  totalTickets?: number;
  openTickets: number;
  closedTickets?: number;
  newTickets?: number;
  oldTickets: number;
  highPriorityTickets?: number;
  urgentTickets?: number;
  repliesCount?: number;
  solvedPast24Hours?: number;
  solvedPastWeek: number;
  solvedPastMonth: number;
  frc: number;
  avgResponseTimeMinutes?: number;
  avgResolutionTimeMinutes?: number;
  resolutionRate?: number;
  slaBreachRate?: number;
}

interface SystemAnalytics {
  totalTickets?: number;
  openTickets: number;
  closedTickets?: number;
  newTickets?: number;
  totalAgents: number;
  dailyTickets: number;
  weeklyTickets?: number;
  monthlyTickets?: number;
  resolvedToday?: number;
  resolvedThisWeek?: number;
  resolvedThisMonth?: number;
  avgResponseTimeMinutes?: number;
  avgResolutionTimeMinutes?: number;
  closureRate?: number;
  frcRate?: number;
  slaBreachRate?: number;
  performance: PerformanceDTO[];
  tickets: PriorityDistribution[];
}

const COLORS = {
  high: '#D65745',
  low: '#4B8F80',
  normal: '#C49545',
  urgent: '#7B5EA7',
  replies: '#3F5C79',
};

const toPercent = (value?: number): string => `${Math.round(value ?? 0)}%`;

const formatMinutes = (value?: number): string => {
  const minutes = Math.max(0, Math.round(value ?? 0));
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
};

const compact = (value?: number): string =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0);

const safeNumber = (value?: number): number => (Number.isFinite(value) ? Number(value) : 0);

const AgentPerformanceDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${BASE_URL}/admin/getAnalytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data: SystemAnalytics = await response.json();
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const sortedAgents = useMemo(() => {
    if (!analyticsData) {
      return [];
    }
    return [...(analyticsData.performance ?? [])].sort(
      (a, b) => safeNumber(b.totalTickets) - safeNumber(a.totalTickets),
    );
  }, [analyticsData]);

  const topResolutionAgents = useMemo(() => {
    return [...sortedAgents]
      .filter((agent) => safeNumber(agent.totalTickets) > 0)
      .sort((a, b) => safeNumber(b.resolutionRate) - safeNumber(a.resolutionRate))
      .slice(0, 5);
  }, [sortedAgents]);

  const topChatAgents = useMemo(() => {
    return [...sortedAgents]
      .sort((a, b) => safeNumber(b.repliesCount) - safeNumber(a.repliesCount))
      .slice(0, 6);
  }, [sortedAgents]);

  const conversationChartData = useMemo(
    () =>
      topChatAgents
        .slice(0, 5)
        .map((agent) => ({
          name: agent.agentName || 'Unknown',
          replies: safeNumber(agent.repliesCount),
        }))
        .reverse(),
    [topChatAgents],
  );

  const teamTotals = useMemo(() => {
    const totals = sortedAgents.reduce(
      (acc, agent) => {
        acc.replies += safeNumber(agent.repliesCount);
        acc.urgent += safeNumber(agent.urgentTickets);
        acc.highPriority += safeNumber(agent.highPriorityTickets);
        acc.open += safeNumber(agent.openTickets);
        acc.newTickets += safeNumber(agent.newTickets);
        acc.solved24h += safeNumber(agent.solvedPast24Hours);
        return acc;
      },
      {
        replies: 0,
        urgent: 0,
        highPriority: 0,
        open: 0,
        newTickets: 0,
        solved24h: 0,
      },
    );

    const activeAgents = sortedAgents.filter((agent) => safeNumber(agent.totalTickets) > 0).length;
    const avgRepliesPerAgent = activeAgents > 0 ? Math.round(totals.replies / activeAgents) : 0;

    return { ...totals, activeAgents, avgRepliesPerAgent };
  }, [sortedAgents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[#3F5C79]" />
          <span className="text-sm font-medium text-slate-700">Loading live agent analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6 shadow-sm max-w-xl text-center">
          <h2 className="text-xl font-semibold text-red-800">Analytics unavailable</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm text-slate-600">No analytics data is available yet.</p>
        </div>
      </div>
    );
  }

  const periodTickets =
    timePeriod === 'day'
      ? safeNumber(analyticsData.dailyTickets)
      : timePeriod === 'week'
      ? safeNumber(analyticsData.weeklyTickets)
      : safeNumber(analyticsData.monthlyTickets);

  const periodResolved =
    timePeriod === 'day'
      ? safeNumber(analyticsData.resolvedToday)
      : timePeriod === 'week'
      ? safeNumber(analyticsData.resolvedThisWeek)
      : safeNumber(analyticsData.resolvedThisMonth);

  const periodResolutionRate = periodTickets > 0 ? (periodResolved / periodTickets) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <div className="max-w-[1450px] mx-auto p-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Agent Statistics</h1>
              <p className="text-sm text-slate-600 mt-1">
                Live operational analytics for agent workload, outcomes, and conversation activity.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Last refresh:{' '}
                {lastUpdated
                  ? lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Not available'}
              </p>
            </div>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Agents"
            value={compact(analyticsData.totalAgents)}
            helper={`${teamTotals.activeAgents} currently handling tickets`}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Tickets"
            value={compact(analyticsData.totalTickets)}
            helper={`${compact(analyticsData.openTickets)} open now`}
            icon={<Ticket className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Response"
            value={formatMinutes(analyticsData.avgResponseTimeMinutes)}
            helper="First meaningful response"
            icon={<Clock3 className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Resolution"
            value={formatMinutes(analyticsData.avgResolutionTimeMinutes)}
            helper="Time to close tickets"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <MetricCard
            title="Closure Rate"
            value={toPercent(analyticsData.closureRate)}
            helper={`FCR ${toPercent(analyticsData.frcRate)}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="SLA Breach"
            value={toPercent(analyticsData.slaBreachRate)}
            helper="Lower is healthier"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Workload Window</h2>
                <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1">
                  {(['day', 'week', 'month'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                        timePeriod === period
                          ? 'bg-[#3F5C79] text-white'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MiniStatCard label={`Created (${timePeriod})`} value={periodTickets} />
                <MiniStatCard label={`Resolved (${timePeriod})`} value={periodResolved} />
                <MiniStatCard label="Resolution Efficiency" value={`${Math.round(periodResolutionRate)}%`} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Priority Distribution by Agent</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.tickets ?? []}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="high" name="High" fill={COLORS.high} radius={[4, 4, 0, 0]}>
                      {(analyticsData.tickets ?? []).map((entry, index) => (
                        <Cell key={`high-${entry.name}-${index}`} fill={COLORS.high} />
                      ))}
                    </Bar>
                    <Bar dataKey="normal" name="Normal" fill={COLORS.normal} radius={[4, 4, 0, 0]}>
                      {(analyticsData.tickets ?? []).map((entry, index) => (
                        <Cell key={`normal-${entry.name}-${index}`} fill={COLORS.normal} />
                      ))}
                    </Bar>
                    <Bar dataKey="low" name="Low" fill={COLORS.low} radius={[4, 4, 0, 0]}>
                      {(analyticsData.tickets ?? []).map((entry, index) => (
                        <Cell key={`low-${entry.name}-${index}`} fill={COLORS.low} />
                      ))}
                    </Bar>
                    <Bar dataKey="urgent" name="Urgent" fill={COLORS.urgent} radius={[4, 4, 0, 0]}>
                      {(analyticsData.tickets ?? []).map((entry, index) => (
                        <Cell key={`urgent-${entry.name}-${index}`} fill={COLORS.urgent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Conversation Activity (Chats)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversationChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                  >
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="replies" name="Chat Replies" fill={COLORS.replies} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Agent Metrics (Live)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left py-3">Agent</th>
                      <th className="text-right py-3">Total</th>
                      <th className="text-right py-3">Open</th>
                      <th className="text-right py-3">Closed</th>
                      <th className="text-right py-3">New</th>
                      <th className="text-right py-3">Urgent</th>
                      <th className="text-right py-3">Chats</th>
                      <th className="text-right py-3">Avg Response</th>
                      <th className="text-right py-3">Resolution</th>
                      <th className="text-right py-3">FCR</th>
                      <th className="text-right py-3">SLA Breach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAgents.map((agent) => (
                      <tr
                        key={agent.agentEmail ?? agent.agentName}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Image
                              width={32}
                              height={32}
                              src="/Images/no-profile.jpg"
                              alt={agent.agentName}
                              className="rounded-full"
                            />
                            <div>
                              <p className="font-medium text-slate-800">{agent.agentName}</p>
                              <p className="text-xs text-slate-500">{agent.agentEmail || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 font-medium text-slate-800">{safeNumber(agent.totalTickets)}</td>
                        <td className="text-right py-3">{safeNumber(agent.openTickets)}</td>
                        <td className="text-right py-3">{safeNumber(agent.closedTickets)}</td>
                        <td className="text-right py-3">{safeNumber(agent.newTickets)}</td>
                        <td className="text-right py-3">{safeNumber(agent.urgentTickets)}</td>
                        <td className="text-right py-3">{safeNumber(agent.repliesCount)}</td>
                        <td className="text-right py-3">{formatMinutes(agent.avgResponseTimeMinutes)}</td>
                        <td className="text-right py-3">{toPercent(agent.resolutionRate)}</td>
                        <td className="text-right py-3">{toPercent(agent.frc)}</td>
                        <td className="text-right py-3">{toPercent(agent.slaBreachRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="xl:col-span-4 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#3F5C79]" />
                Agent Statistics Side Pane
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Snapshot built from current `/admin/getAnalytics` response.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <SideMetric label="Open Backlog" value={teamTotals.open} tone="slate" />
                <SideMetric label="Urgent Tickets" value={teamTotals.urgent} tone="amber" />
                <SideMetric label="High Priority" value={teamTotals.highPriority} tone="rose" />
                <SideMetric label="New Tickets" value={teamTotals.newTickets} tone="blue" />
                <SideMetric label="Solved (24h)" value={teamTotals.solved24h} tone="emerald" />
                <SideMetric label="Total Chats" value={teamTotals.replies} tone="indigo" />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-[#3F5C79]" />
                Chat Leaderboard
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ranked by number of agent replies (conversation activity).
              </p>
              <div className="mt-4 space-y-3">
                {topChatAgents.length === 0 ? (
                  <p className="text-sm text-slate-500">No chat activity found yet.</p>
                ) : (
                  topChatAgents.map((agent, index) => (
                    <div
                      key={`chat-${agent.agentEmail ?? agent.agentName}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {index + 1}. {agent.agentName}
                          </p>
                          <p className="text-xs text-slate-500">Solved 24h: {safeNumber(agent.solvedPast24Hours)}</p>
                        </div>
                        <span className="rounded-lg bg-[#EAF1F8] px-2.5 py-1 text-xs font-semibold text-[#355371]">
                          {safeNumber(agent.repliesCount)} chats
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#3F5C79]" />
                Resolution Leaders
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Top agents by resolution percentage.
              </p>
              <div className="mt-4 space-y-3">
                {topResolutionAgents.length === 0 ? (
                  <p className="text-sm text-slate-500">No resolution performance data yet.</p>
                ) : (
                  topResolutionAgents.map((agent) => (
                    <div key={`resolution-${agent.agentEmail ?? agent.agentName}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{agent.agentName}</span>
                        <span className="text-slate-600">{toPercent(agent.resolutionRate)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-[#3F5C79]"
                          style={{ width: `${Math.max(0, Math.min(100, safeNumber(agent.resolutionRate)))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Conversation Throughput</h3>
              <div className="mt-4 space-y-2 text-sm">
                <ThroughputRow label="Average chats per active agent" value={teamTotals.avgRepliesPerAgent} />
                <ThroughputRow
                  label="Chats per open ticket"
                  value={teamTotals.open > 0 ? Number((teamTotals.replies / teamTotals.open).toFixed(2)) : 0}
                />
                <ThroughputRow
                  label="Resolved per created window"
                  value={periodTickets > 0 ? Number((periodResolved / periodTickets).toFixed(2)) : 0}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <span className="rounded-md bg-slate-100 p-1.5 text-slate-600">{icon}</span>
    </div>
    <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{helper}</p>
  </div>
);

const MiniStatCard = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
  </div>
);

const SideMetric = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'amber' | 'rose' | 'blue' | 'emerald' | 'indigo';
}) => {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-800',
    amber: 'bg-amber-100 text-amber-900',
    rose: 'bg-rose-100 text-rose-900',
    blue: 'bg-blue-100 text-blue-900',
    emerald: 'bg-emerald-100 text-emerald-900',
    indigo: 'bg-indigo-100 text-indigo-900',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
};

const ThroughputRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

export default AgentPerformanceDashboard;
