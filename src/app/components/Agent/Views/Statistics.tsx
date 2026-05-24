'use client';

import React, { useEffect, useState } from 'react';
import BASE_URL from '@/app/config/api/api';
import AgentSessionStatsCard from './AgentSessionProps';

type AgentStatus = 'Available' | 'Busy' | 'Away' | 'Offline';

type StatsByAgent = {
  SOLVED_DAILY?: number;
  SOLVED_WEEKLY?: number;
  SOLVED_MONTHLY?: number;
  DAILY_TICKETS?: number;
  WEEKLY_TICKETS?: number;
  MONTHLY_TICKETS?: number;
  solved_DAILY?: number;
  solved_WEEKLY?: number;
  solved_MONTHLY?: number;
  daily_TICKETS?: number;
  weekly_TICKETS?: number;
  monthly_TICKETS?: number;
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pick = (obj: StatsByAgent, keys: Array<keyof StatsByAgent>): number => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return asNumber(obj[key]);
    }
  }
  return 0;
};

const AgentsStats = () => {
  const [status, setStatus] = useState<AgentStatus>('Offline');
  const [ticketsAssigned, setTicketsAssigned] = useState(0);
  const [ticketsResolved, setTicketsResolved] = useState(0);
  const [ticketsPending, setTicketsPending] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState('--');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('email');
        if (!token) {
          throw new Error('Agent identity not found. Please log in again.');
        }

        const response = await fetch(`${BASE_URL}/ticket/getMyStats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats (${response.status})`);
        }

        const data: StatsByAgent = await response.json();
        const dailyTotal = pick(data, ['DAILY_TICKETS', 'daily_TICKETS']);
        const dailySolved = pick(data, ['SOLVED_DAILY', 'solved_DAILY']);
        const weeklyTotal = pick(data, ['WEEKLY_TICKETS', 'weekly_TICKETS']);

        const pending = Math.max(dailyTotal - dailySolved, 0);
        const derivedStatus: AgentStatus =
          dailyTotal === 0 && weeklyTotal === 0
            ? 'Away'
            : pending >= 3
              ? 'Busy'
              : 'Available';

        // Average response time is not exposed by /ticket/getMyStats yet.
        // We display a derived daily throughput indicator instead of hardcoded text.
        const throughputPercent =
          dailyTotal > 0 ? ((dailySolved / dailyTotal) * 100).toFixed(0) : '0';

        setTicketsAssigned(dailyTotal);
        setTicketsResolved(dailySolved);
        setTicketsPending(pending);
        setStatus(derivedStatus);
        setAvgResponseTime(`${throughputPercent}% solved today`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load agent stats.';
        setError(message);
        setStatus('Offline');
        setTicketsAssigned(0);
        setTicketsResolved(0);
        setTicketsPending(0);
        setAvgResponseTime('--');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-black mb-4">JOINAI Support</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Loading live agent stats...
        </div>
      )}
      <AgentSessionStatsCard
        status={status}
        ticketsAssigned={ticketsAssigned}
        ticketsResolved={ticketsResolved}
        ticketsPending={ticketsPending}
        avgResponseTime={avgResponseTime}
      />
    </div>
  );
};

export default AgentsStats;
