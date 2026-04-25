'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import BASE_URL from '@/app/config/api/api';

type TimePeriod = 'day' | 'week' | 'month';

interface Ticket {
  name: string;
  high: number;
  low: number;
  normal: number;
  urgent: number;
}

interface PerformanceDTO {
  agentName: string;
  agentEmail?: string;
  photo?: string;
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
  tickets: Ticket[];
}

const COLORS = {
  high: '#ef4444',
  low: '#14b8a6',
  normal: '#f59e0b',
  urgent: '#7c3aed',
};

const formatMinutes = (value?: number): string => {
  const minutes = Math.max(0, Math.round(value ?? 0));
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
};

const toPercent = (value?: number): string => `${Math.round(value ?? 0)}%`;

const AgentPerformanceDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
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
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const sortedAgents = useMemo(() => {
    if (!analyticsData) {
      return [];
    }

    return [...analyticsData.performance].sort((a, b) => (b.totalTickets ?? 0) - (a.totalTickets ?? 0));
  }, [analyticsData]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 text-center min-h-screen flex items-center justify-center">
        <p>No analytics data available.</p>
      </div>
    );
  }

  const periodTickets =
    timePeriod === 'day'
      ? analyticsData.dailyTickets ?? 0
      : timePeriod === 'week'
        ? analyticsData.weeklyTickets ?? 0
        : analyticsData.monthlyTickets ?? 0;

  const periodResolved =
    timePeriod === 'day'
      ? analyticsData.resolvedToday ?? 0
      : timePeriod === 'week'
        ? analyticsData.resolvedThisWeek ?? 0
        : analyticsData.resolvedThisMonth ?? 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Performance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Updated {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Agents</p>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.totalAgents}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.totalTickets ?? 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Avg Response Time</p>
            <p className="text-3xl font-bold text-gray-900">{formatMinutes(analyticsData.avgResponseTimeMinutes)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Avg Resolution Time</p>
            <p className="text-3xl font-bold text-gray-900">{formatMinutes(analyticsData.avgResolutionTimeMinutes)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Open / Closed</p>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.openTickets} / {analyticsData.closedTickets ?? 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Closure Rate</p>
            <p className="text-2xl font-bold text-gray-900">{toPercent(analyticsData.closureRate)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">FCR Rate</p>
            <p className="text-2xl font-bold text-gray-900">{toPercent(analyticsData.frcRate)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">SLA Breach Rate</p>
            <p className="text-2xl font-bold text-gray-900">{toPercent(analyticsData.slaBreachRate)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Workload Window</h2>
            <div className="flex items-center gap-2">
              {(['day', 'week', 'month'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    timePeriod === period ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {period[0].toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Tickets Created ({timePeriod})</p>
              <p className="text-3xl font-bold text-gray-900">{periodTickets}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Tickets Resolved ({timePeriod})</p>
              <p className="text-3xl font-bold text-gray-900">{periodResolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Distribution by Agent</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.tickets}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="high" name="High" fill={COLORS.high} radius={[4, 4, 0, 0]}>
                  {analyticsData.tickets.map((entry, index) => (
                    <Cell key={`high-${entry.name}-${index}`} fill={COLORS.high} />
                  ))}
                </Bar>
                <Bar dataKey="normal" name="Normal" fill={COLORS.normal} radius={[4, 4, 0, 0]}>
                  {analyticsData.tickets.map((entry, index) => (
                    <Cell key={`normal-${entry.name}-${index}`} fill={COLORS.normal} />
                  ))}
                </Bar>
                <Bar dataKey="low" name="Low" fill={COLORS.low} radius={[4, 4, 0, 0]}>
                  {analyticsData.tickets.map((entry, index) => (
                    <Cell key={`low-${entry.name}-${index}`} fill={COLORS.low} />
                  ))}
                </Bar>
                <Bar dataKey="urgent" name="Urgent" fill={COLORS.urgent} radius={[4, 4, 0, 0]}>
                  {analyticsData.tickets.map((entry, index) => (
                    <Cell key={`urgent-${entry.name}-${index}`} fill={COLORS.urgent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-left py-3">Agent</th>
                  <th className="text-right py-3">Total</th>
                  <th className="text-right py-3">Open</th>
                  <th className="text-right py-3">Closed</th>
                  <th className="text-right py-3">Avg Response</th>
                  <th className="text-right py-3">Avg Resolution</th>
                  <th className="text-right py-3">Resolution</th>
                  <th className="text-right py-3">FCR</th>
                  <th className="text-right py-3">SLA Breach</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map((agent) => (
                  <tr key={agent.agentEmail ?? agent.agentName} className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          width={30}
                          height={30}
                          src={agent.photo || '/Images/pro pic.jpg'}
                          alt={agent.agentName}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{agent.agentName}</p>
                          <p className="text-xs text-gray-500">{agent.agentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 font-medium text-gray-900">{agent.totalTickets ?? 0}</td>
                    <td className="text-right py-3">{agent.openTickets}</td>
                    <td className="text-right py-3">{agent.closedTickets ?? 0}</td>
                    <td className="text-right py-3">{formatMinutes(agent.avgResponseTimeMinutes)}</td>
                    <td className="text-right py-3">{formatMinutes(agent.avgResolutionTimeMinutes)}</td>
                    <td className="text-right py-3">{toPercent(agent.resolutionRate)}</td>
                    <td className="text-right py-3">{toPercent(agent.frc)}</td>
                    <td className="text-right py-3">{toPercent(agent.slaBreachRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedAgents.map((agent) => (
            <div key={`${agent.agentEmail ?? agent.agentName}-card`} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  width={44}
                  height={44}
                  src={agent.photo || '/Images/pro pic.jpg'}
                  alt={agent.agentName}
                  className="rounded-full"
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{agent.agentName}</h3>
                  <p className="text-xs text-gray-500">{agent.agentEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-gray-50 rounded-md py-2">
                  <p className="text-xs text-gray-500">Open</p>
                  <p className="font-bold text-gray-900">{agent.openTickets}</p>
                </div>
                <div className="bg-gray-50 rounded-md py-2">
                  <p className="text-xs text-gray-500">Old Open</p>
                  <p className="font-bold text-gray-900">{agent.oldTickets}</p>
                </div>
                <div className="bg-gray-50 rounded-md py-2">
                  <p className="text-xs text-gray-500">High Priority</p>
                  <p className="font-bold text-gray-900">{agent.highPriorityTickets ?? 0}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <p>Solved 24h: {agent.solvedPast24Hours ?? 0}</p>
                <p>Solved Week: {agent.solvedPastWeek}</p>
                <p>Solved Month: {agent.solvedPastMonth}</p>
                <p>Avg Response: {formatMinutes(agent.avgResponseTimeMinutes)}</p>
                <p>Avg Resolution: {formatMinutes(agent.avgResolutionTimeMinutes)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentPerformanceDashboard;
