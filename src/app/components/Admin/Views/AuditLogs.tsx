'use client';

import React, { useEffect, useState } from 'react';
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

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError('');

        const email = localStorage.getItem('email') ?? '';
        if (!email) {
          setError('Admin email not found in local storage.');
          return;
        }

        const response = await fetch(`${BASE_URL}/admin/auditLogs?page=0&size=100`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch audit logs: ${response.status}`);
        }

        const data: AuditLog[] = await response.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">API Audit Logs</h2>
        <span className="text-sm text-gray-500">{logs.length} records</span>
      </div>

      {isLoading && <p className="text-gray-600">Loading audit logs...</p>}
      {!isLoading && error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && logs.length === 0 && (
        <p className="text-gray-600">No audit logs found.</p>
      )}

      {!isLoading && !error && logs.length > 0 && (
        <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-semibold text-gray-900">{log.method}</span>
                <span className="text-gray-700">{log.path}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    log.statusCode >= 500
                      ? 'bg-red-100 text-red-700'
                      : log.statusCode >= 400
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {log.statusCode}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>Time: {new Date(log.createdAt).toLocaleString()}</p>
                <p>Actor: {log.actorEmail || 'anonymous'}</p>
                <p>Client IP: {log.clientIp || 'unknown'}</p>
                <p>Duration: {log.durationMs ?? 0} ms</p>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  View payloads
                </summary>
                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Request</p>
                    <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {log.requestBody || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Response</p>
                    <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {log.responseBody || '(empty)'}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
