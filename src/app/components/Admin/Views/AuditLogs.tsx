'use client';

import React, { useEffect, useMemo, useState } from 'react';
import BASE_URL from '@/app/config/api/api';

type AuditLog = {
  id: number;
  createdAt: string;
  method: string;
  path: string;
  queryString: string | null;
  statusCode: number;
  actorEmail: string;
  clientIp: string;
  userAgent: string;
  durationMs: number;
  requestBody: string;
  responseBody: string;
};

type StatusFilter = 'ALL' | 'SUCCESS' | 'CLIENT_ERROR' | 'SERVER_ERROR';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError('');

      const email = localStorage.getItem('email') ?? '';
      if (!email) {
        setError('Admin email is missing. Please log in again.');
        return;
      }

      const response = await fetch(`${BASE_URL}/admin/auditLogs?page=0&size=400`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs (${response.status}).`);
      }

      const data: AuditLog[] = await response.json();
      setLogs(Array.isArray(data) ? data : []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error while fetching audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const methodOptions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(logs.map((log) => log.method).filter(Boolean)))];
  }, [logs]);

  const actorOptions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(logs.map((log) => log.actorEmail || 'anonymous').filter(Boolean)))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      if (methodFilter !== 'ALL' && log.method !== methodFilter) {
        return false;
      }

      if (actorFilter !== 'ALL' && (log.actorEmail || 'anonymous') !== actorFilter) {
        return false;
      }

      if (statusFilter === 'SUCCESS' && log.statusCode >= 400) {
        return false;
      }
      if (statusFilter === 'CLIENT_ERROR' && (log.statusCode < 400 || log.statusCode >= 500)) {
        return false;
      }
      if (statusFilter === 'SERVER_ERROR' && log.statusCode < 500) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        log.method,
        log.path,
        log.queryString ?? '',
        log.actorEmail ?? '',
        log.clientIp ?? '',
        log.userAgent ?? '',
        String(log.statusCode),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [logs, searchTerm, methodFilter, statusFilter, actorFilter]);

  const metrics = useMemo(() => {
    const total = filteredLogs.length;
    const success = filteredLogs.filter((log) => log.statusCode < 400).length;
    const clientErrors = filteredLogs.filter((log) => log.statusCode >= 400 && log.statusCode < 500).length;
    const serverErrors = filteredLogs.filter((log) => log.statusCode >= 500).length;
    const avgDuration =
      total > 0 ? Math.round(filteredLogs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0) / total) : 0;

    return { total, success, clientErrors, serverErrors, avgDuration };
  }, [filteredLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, methodFilter, statusFilter, actorFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const selectedLog = useMemo(
    () => filteredLogs.find((log) => log.id === selectedLogId) ?? null,
    [filteredLogs, selectedLogId]
  );

  const formatDateTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const getStatusBadge = (statusCode: number): string => {
    if (statusCode >= 500) {
      return 'bg-red-100 text-red-700';
    }
    if (statusCode >= 400) {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500">
            Track API activity, errors, response time, and actor behavior in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : 'Not loaded yet'}
          </span>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isLoading
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Visible Logs</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics.total}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Successful</p>
          <p className="text-2xl font-semibold text-emerald-900">{metrics.success}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">4xx Errors</p>
          <p className="text-2xl font-semibold text-amber-900">{metrics.clientErrors}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">Avg Duration</p>
          <p className="text-2xl font-semibold text-blue-900">{metrics.avgDuration} ms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Search</label>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Path, actor email, IP, status..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Method</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All</option>
            <option value="SUCCESS">Success (&lt; 400)</option>
            <option value="CLIENT_ERROR">Client Error (4xx)</option>
            <option value="SERVER_ERROR">Server Error (5xx)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Actor</label>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {actorOptions.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-600">Loading audit logs...</p>}
      {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
      {!isLoading && !error && filteredLogs.length === 0 && (
        <p className="text-sm text-gray-600">No audit logs found for the selected filters.</p>
      )}

      {!isLoading && !error && filteredLogs.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Request</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Client IP</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                          {log.method}
                        </span>
                        <span className="font-mono text-xs text-gray-700 break-all">{log.path}</span>
                      </div>
                      {log.queryString && <p className="font-mono text-xs text-gray-500 mt-1">?{log.queryString}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.durationMs ?? 0} ms</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.clientIp || 'unknown'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLogId((prev) => (prev === log.id ? null : log.id))}
                        className="text-sm font-medium text-blue-700 hover:text-blue-900"
                      >
                        {selectedLogId === log.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className={`px-3 py-1 rounded border ${
                  safeCurrentPage <= 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className={`px-3 py-1 rounded border ${
                  safeCurrentPage >= totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Payload Details (Log #{selectedLog.id})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Request Body</p>
              <pre className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap break-words">
                {selectedLog.requestBody || '(empty)'}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Response Body</p>
              <pre className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap break-words">
                {selectedLog.responseBody || '(empty)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
