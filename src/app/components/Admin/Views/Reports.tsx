'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BASE_URL from '@/app/config/api/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Filter,
  Gauge,
  MessageSquare,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';

type TabKey =
  | 'overview'
  | 'tickets'
  | 'agents'
  | 'customers'
  | 'channels'
  | 'ai'
  | 'resolution'
  | 'feedback';

interface ReportsQuery {
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  channel: string;
  agentEmail: string;
  customerEmail: string;
  category: string;
  resolutionStatus: string;
}

interface CountEntry {
  label: string;
  count: number;
  percentage: number;
}

interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

interface TicketSnapshot {
  ticketId: number;
  subject: string;
  status: string;
  priority: string;
  category: string;
  channel: string;
  agentEmail: string;
  customerEmail: string;
  launchTimestamp: string;
  resolvedTimestamp: string;
  resolutionMinutes: number;
}

interface AgentSummary {
  agentName: string;
  agentEmail: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  resolutionRate: number;
  workloadPercentage: number;
}

interface CustomerSummary {
  customerEmail: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTimeMinutes: number;
}

interface ChannelSummary {
  channel: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  avgResolutionTimeMinutes: number;
}

interface IssueCount {
  issue: string;
  count: number;
}

type ExcelCellValue = string | number | boolean | null | undefined;

interface ExcelSheet {
  name: string;
  headers: string[];
  rows: ExcelCellValue[][];
}

interface ReportsResponse {
  generatedAt: string;
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    pendingTickets: number;
    escalatedTickets: number;
    avgResponseTimeMinutes: number;
    avgResolutionTimeMinutes: number;
    aiHandledConversations: number;
    aiEscalationRate: number;
  };
  ticketReports: {
    byStatus: CountEntry[];
    byPriority: CountEntry[];
    byCategory: CountEntry[];
    trends: TrendPoint[];
    recentTickets: TicketSnapshot[];
  };
  agentPerformance: {
    totalAgents: number;
    activeAgents: number;
    agents: AgentSummary[];
  };
  customerReports: {
    totalCustomers: number;
    topCustomers: CustomerSummary[];
    commonIssues: IssueCount[];
  };
  channelReports: {
    channels: ChannelSummary[];
  };
  aiResponseReports: {
    totalConversations: number;
    aiHandledConversations: number;
    ticketsWithAiParticipation: number;
    aiEscalations: number;
    aiEscalationRate: number;
    aiCommonIssues: IssueCount[];
  };
  resolutionReports: {
    avgResponseTimeMinutes: number;
    avgResolutionTimeMinutes: number;
    slaBreachRate: number;
    firstContactResolutionRate: number;
    resolutionBuckets: CountEntry[];
  };
  feedbackReports: {
    ratedTickets: number;
    averageScore: number;
    ratingCoverageRate: number;
    scoreDistribution: CountEntry[];
  };
  filterOptions: {
    statuses: string[];
    priorities: string[];
    categories: string[];
    channels: string[];
    resolutionStatuses: string[];
    agents: { name: string; email: string }[];
    customers: string[];
  };
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Gauge className="h-4 w-4" /> },
  { key: 'tickets', label: 'Ticket Reports', icon: <Ticket className="h-4 w-4" /> },
  { key: 'agents', label: 'Agent Performance', icon: <Users className="h-4 w-4" /> },
  { key: 'customers', label: 'Customer Reports', icon: <Users className="h-4 w-4" /> },
  { key: 'channels', label: 'Channel Reports', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'ai', label: 'AI Response Reports', icon: <Bot className="h-4 w-4" /> },
  { key: 'resolution', label: 'Resolution Reports', icon: <CheckCircle2 className="h-4 w-4" /> },
  { key: 'feedback', label: 'Feedback Reports', icon: <Activity className="h-4 w-4" /> },
];

const DEFAULT_FILTERS: ReportsQuery = {
  startDate: '',
  endDate: '',
  status: '',
  priority: '',
  channel: '',
  agentEmail: '',
  customerEmail: '',
  category: '',
  resolutionStatus: '',
};

const CHART_COLORS = ['#3F5C79', '#4B8F80', '#C49545', '#D65745', '#7B5EA7', '#2F855A', '#0F766E'];

const safeNum = (value?: number): number => (Number.isFinite(value) ? Number(value) : 0);

const formatPercent = (value?: number): string => `${safeNum(value).toFixed(1)}%`;

const formatMinutes = (value?: number): string => {
  const minutes = Math.round(safeNum(value));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
};

const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const escapeXml = (value: ExcelCellValue): string => {
  const raw = value == null ? '' : String(value);
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const sanitizeSheetName = (name: string): string => {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim();
  return (cleaned || 'Sheet').slice(0, 31);
};

const buildExcelWorkbookXml = (sheets: ExcelSheet[]): string => {
  const worksheetXml = sheets
    .map((sheet) => {
      const headerCells = sheet.headers
        .map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
        .join('');

      const rowsXml = sheet.rows
        .map((row) => {
          const cells = row
            .map((cell) => {
              const type = typeof cell === 'number' ? 'Number' : 'String';
              const cellValue = typeof cell === 'number' ? cell : escapeXml(cell);
              return `<Cell><Data ss:Type="${type}">${cellValue}</Data></Cell>`;
            })
            .join('');
          return `<Row>${cells}</Row>`;
        })
        .join('');

      return `
        <Worksheet ss:Name="${escapeXml(sanitizeSheetName(sheet.name))}">
          <Table>
            <Row>${headerCells}</Row>
            ${rowsXml}
          </Table>
        </Worksheet>
      `;
    })
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#DDE7F3" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${worksheetXml}
</Workbook>`;
};

const downloadExcelWorkbook = (sheets: ExcelSheet[], filename: string): void => {
  if (sheets.length === 0) return;
  const xml = buildExcelWorkbookXml(sheets);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [filters, setFilters] = useState<ReportsQuery>(DEFAULT_FILTERS);
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    (Object.keys(filters) as (keyof ReportsQuery)[]).forEach((key) => {
      const value = filters[key];
      if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [filters]);

  const fetchReports = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const url = queryString ? `${BASE_URL}/admin/reports?${queryString}` : `${BASE_URL}/admin/reports`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load reports: ${response.status}`);
        }

        const data: ReportsResponse = await response.json();
        setReportsData(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryString],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchReports]);

  const onFilterChange = (key: keyof ReportsQuery, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const exportReportsToExcel = useCallback(() => {
    if (!reportsData) return;

    const workbookSheets: ExcelSheet[] = [];

    if (activeTab === 'overview') {
      workbookSheets.push(
        {
          name: 'Overview Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Tickets', reportsData.overview.totalTickets],
            ['Open Tickets', reportsData.overview.openTickets],
            ['Resolved Tickets', reportsData.overview.resolvedTickets],
            ['Pending Tickets', reportsData.overview.pendingTickets],
            ['Escalated Tickets', reportsData.overview.escalatedTickets],
            ['Avg Response Minutes', reportsData.overview.avgResponseTimeMinutes],
            ['Avg Resolution Minutes', reportsData.overview.avgResolutionTimeMinutes],
            ['AI Handled Conversations', reportsData.overview.aiHandledConversations],
            ['AI Escalation Rate (%)', reportsData.overview.aiEscalationRate],
          ],
        },
        {
          name: 'Overview Status',
          headers: ['Status', 'Count', 'Percentage'],
          rows: reportsData.ticketReports.byStatus.map((entry) => [entry.label, entry.count, entry.percentage]),
        },
        {
          name: 'Overview Trend',
          headers: ['Date', 'Created', 'Resolved'],
          rows: reportsData.ticketReports.trends.map((trend) => [trend.date, trend.created, trend.resolved]),
        },
      );
    }

    if (activeTab === 'tickets') {
      workbookSheets.push(
        {
          name: 'Tickets Status',
          headers: ['Status', 'Count', 'Percentage'],
          rows: reportsData.ticketReports.byStatus.map((entry) => [entry.label, entry.count, entry.percentage]),
        },
        {
          name: 'Tickets Priority',
          headers: ['Priority', 'Count', 'Percentage'],
          rows: reportsData.ticketReports.byPriority.map((entry) => [entry.label, entry.count, entry.percentage]),
        },
        {
          name: 'Tickets Category',
          headers: ['Category', 'Count', 'Percentage'],
          rows: reportsData.ticketReports.byCategory.map((entry) => [entry.label, entry.count, entry.percentage]),
        },
        {
          name: 'Tickets Trend',
          headers: ['Date', 'Created', 'Resolved'],
          rows: reportsData.ticketReports.trends.map((trend) => [trend.date, trend.created, trend.resolved]),
        },
        {
          name: 'Recent Tickets',
          headers: ['Ticket ID', 'Subject', 'Status', 'Priority', 'Category', 'Channel', 'Agent', 'Customer', 'Created', 'Resolved', 'Resolution Minutes'],
          rows: reportsData.ticketReports.recentTickets.map((ticket) => [
            ticket.ticketId,
            ticket.subject,
            ticket.status,
            ticket.priority,
            ticket.category,
            ticket.channel,
            ticket.agentEmail,
            ticket.customerEmail,
            ticket.launchTimestamp,
            ticket.resolvedTimestamp,
            ticket.resolutionMinutes,
          ]),
        },
      );
    }

    if (activeTab === 'agents') {
      workbookSheets.push({
        name: 'Agent Performance',
        headers: [
          'Agent',
          'Email',
          'Total',
          'Open',
          'Resolved',
          'Pending',
          'Resolution Rate (%)',
          'Avg Response Minutes',
          'Avg Resolution Minutes',
          'Workload (%)',
        ],
        rows: reportsData.agentPerformance.agents.map((agent) => [
          agent.agentName,
          agent.agentEmail,
          agent.totalTickets,
          agent.openTickets,
          agent.resolvedTickets,
          agent.pendingTickets,
          agent.resolutionRate,
          agent.avgResponseTimeMinutes,
          agent.avgResolutionTimeMinutes,
          agent.workloadPercentage,
        ]),
      });
    }

    if (activeTab === 'customers') {
      workbookSheets.push(
        {
          name: 'Top Customers',
          headers: ['Customer', 'Total Tickets', 'Open', 'Resolved', 'Avg Resolution Minutes'],
          rows: reportsData.customerReports.topCustomers.map((customer) => [
            customer.customerEmail,
            customer.totalTickets,
            customer.openTickets,
            customer.resolvedTickets,
            customer.avgResolutionTimeMinutes,
          ]),
        },
        {
          name: 'Common Issues',
          headers: ['Issue', 'Count'],
          rows: reportsData.customerReports.commonIssues.map((issue) => [issue.issue, issue.count]),
        },
      );
    }

    if (activeTab === 'channels') {
      workbookSheets.push({
        name: 'Channel Reports',
        headers: ['Channel', 'Total Tickets', 'Open', 'Resolved', 'Escalated', 'Avg Resolution Minutes'],
        rows: reportsData.channelReports.channels.map((channel) => [
          channel.channel,
          channel.totalTickets,
          channel.openTickets,
          channel.resolvedTickets,
          channel.escalatedTickets,
          channel.avgResolutionTimeMinutes,
        ]),
      });
    }

    if (activeTab === 'ai') {
      workbookSheets.push(
        {
          name: 'AI Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Conversations', reportsData.aiResponseReports.totalConversations],
            ['AI Handled Conversations', reportsData.aiResponseReports.aiHandledConversations],
            ['Tickets with AI', reportsData.aiResponseReports.ticketsWithAiParticipation],
            ['AI Escalations', reportsData.aiResponseReports.aiEscalations],
            ['AI Escalation Rate (%)', reportsData.aiResponseReports.aiEscalationRate],
          ],
        },
        {
          name: 'AI Common Issues',
          headers: ['Issue', 'Count'],
          rows: reportsData.aiResponseReports.aiCommonIssues.map((issue) => [issue.issue, issue.count]),
        },
      );
    }

    if (activeTab === 'resolution') {
      workbookSheets.push(
        {
          name: 'Resolution Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Avg Response Minutes', reportsData.resolutionReports.avgResponseTimeMinutes],
            ['Avg Resolution Minutes', reportsData.resolutionReports.avgResolutionTimeMinutes],
            ['SLA Breach Rate (%)', reportsData.resolutionReports.slaBreachRate],
            ['First Contact Resolution Rate (%)', reportsData.resolutionReports.firstContactResolutionRate],
          ],
        },
        {
          name: 'Resolution Buckets',
          headers: ['Bucket', 'Count', 'Percentage'],
          rows: reportsData.resolutionReports.resolutionBuckets.map((bucket) => [
            bucket.label,
            bucket.count,
            bucket.percentage,
          ]),
        },
      );
    }

    if (activeTab === 'feedback') {
      workbookSheets.push(
        {
          name: 'Feedback Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Rated Tickets', reportsData.feedbackReports.ratedTickets],
            ['Average Score', reportsData.feedbackReports.averageScore],
            ['Rating Coverage (%)', reportsData.feedbackReports.ratingCoverageRate],
          ],
        },
        {
          name: 'Feedback Distribution',
          headers: ['Score', 'Count', 'Percentage'],
          rows: reportsData.feedbackReports.scoreDistribution.map((score) => [
            score.label,
            score.count,
            score.percentage,
          ]),
        },
      );
    }

    const now = new Date();
    const dateSegment = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const tabName = activeTab.replace(/\s+/g, '-').toLowerCase();
    downloadExcelWorkbook(workbookSheets, `joinai-reports-${tabName}-${dateSegment}.xls`);
  }, [activeTab, reportsData]);

  const statusPieData = reportsData?.ticketReports.byStatus ?? [];
  const priorityBarData = reportsData?.ticketReports.byPriority ?? [];
  const trendData = reportsData?.ticketReports.trends ?? [];
  const channelData = reportsData?.channelReports.channels ?? [];
  const issueData = reportsData?.customerReports.commonIssues ?? [];

  if (loading && !reportsData) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[#3F5C79]" />
          <span className="text-sm font-medium text-slate-700">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error && !reportsData) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center p-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 px-8 py-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-800">Reports unavailable</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchReports()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center">
        <p className="text-slate-600">No report data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <div className="max-w-[1450px] mx-auto p-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
              <p className="text-sm text-slate-600 mt-1">
                Management analytics for ticket volume, service quality, channel usage, and AI impact.
              </p>
              <p className="text-xs text-slate-500 mt-2">Last updated: {new Date(reportsData.generatedAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => fetchReports(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportReportsToExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-[#3F5C79] bg-[#3F5C79] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2F455C]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </h2>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-[#3F5C79] hover:text-[#2F455C]"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <FilterField label="Start Date">
              <input type="date" value={filters.startDate} onChange={(e) => onFilterChange('startDate', e.target.value)} className={inputClass} />
            </FilterField>
            <FilterField label="End Date">
              <input type="date" value={filters.endDate} onChange={(e) => onFilterChange('endDate', e.target.value)} className={inputClass} />
            </FilterField>
            <FilterField label="Status">
              <select value={filters.status} onChange={(e) => onFilterChange('status', e.target.value)} className={inputClass}>
                <option value="">All statuses</option>
                {reportsData.filterOptions.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Priority">
              <select value={filters.priority} onChange={(e) => onFilterChange('priority', e.target.value)} className={inputClass}>
                <option value="">All priorities</option>
                {reportsData.filterOptions.priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Channel">
              <select value={filters.channel} onChange={(e) => onFilterChange('channel', e.target.value)} className={inputClass}>
                <option value="">All channels</option>
                {reportsData.filterOptions.channels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Agent">
              <select value={filters.agentEmail} onChange={(e) => onFilterChange('agentEmail', e.target.value)} className={inputClass}>
                <option value="">All agents</option>
                {reportsData.filterOptions.agents.map((agent) => (
                  <option key={agent.email} value={agent.email}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Customer">
              <select value={filters.customerEmail} onChange={(e) => onFilterChange('customerEmail', e.target.value)} className={inputClass}>
                <option value="">All customers</option>
                {reportsData.filterOptions.customers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Category">
              <select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)} className={inputClass}>
                <option value="">All categories</option>
                {reportsData.filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Resolution">
              <select value={filters.resolutionStatus} onChange={(e) => onFilterChange('resolutionStatus', e.target.value)} className={inputClass}>
                <option value="">All resolution states</option>
                {reportsData.filterOptions.resolutionStatuses.map((resolutionStatus) => (
                  <option key={resolutionStatus} value={resolutionStatus}>
                    {resolutionStatus}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-[#3F5C79] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <MetricCard title="Total Tickets" value={reportsData.overview.totalTickets} helper="Tickets matching active filters" icon={<Ticket className="h-4 w-4" />} />
              <MetricCard title="Open" value={reportsData.overview.openTickets} helper="Active support workload" icon={<Clock3 className="h-4 w-4" />} />
              <MetricCard title="Resolved" value={reportsData.overview.resolvedTickets} helper="Successfully closed" icon={<CheckCircle2 className="h-4 w-4" />} />
              <MetricCard title="Escalated" value={reportsData.overview.escalatedTickets} helper="High-priority or follow-up" icon={<AlertTriangle className="h-4 w-4" />} />
              <MetricCard title="AI Escalation" value={formatPercent(reportsData.overview.aiEscalationRate)} helper="AI tickets handed to agents" icon={<Bot className="h-4 w-4" />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Ticket Trend Over Time">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#3F5C79" strokeWidth={2} />
                      <Line type="monotone" dataKey="resolved" stroke="#2F855A" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Tickets by Status">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100}>
                        {statusPieData.map((entry, index) => (
                          <Cell key={`${entry.label}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </section>
        )}

        {activeTab === 'tickets' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Tickets by Priority">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3F5C79" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Tickets by Category">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportsData.ticketReports.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4B8F80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Tickets</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 text-left">Ticket</th>
                    <th className="py-2 text-left">Customer</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Priority</th>
                    <th className="py-2 text-left">Channel</th>
                    <th className="py-2 text-left">Created</th>
                    <th className="py-2 text-left">Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.ticketReports.recentTickets.map((ticket) => (
                    <tr key={ticket.ticketId} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-800">#{ticket.ticketId} {ticket.subject || 'Untitled'}</td>
                      <td className="py-2 text-slate-600">{ticket.customerEmail || '-'}</td>
                      <td className="py-2">{ticket.status}</td>
                      <td className="py-2">{ticket.priority}</td>
                      <td className="py-2 capitalize">{ticket.channel}</td>
                      <td className="py-2">{formatDate(ticket.launchTimestamp)}</td>
                      <td className="py-2">{ticket.resolutionMinutes > 0 ? formatMinutes(ticket.resolutionMinutes) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>
        )}

        {activeTab === 'agents' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard title="Total Agents" value={reportsData.agentPerformance.totalAgents} helper="Registered support agents" icon={<Users className="h-4 w-4" />} />
              <MetricCard title="Active Agents" value={reportsData.agentPerformance.activeAgents} helper="With ticket workload" icon={<Activity className="h-4 w-4" />} />
              <MetricCard title="Avg Response" value={formatMinutes(reportsData.overview.avgResponseTimeMinutes)} helper="Across filtered tickets" icon={<Clock3 className="h-4 w-4" />} />
              <MetricCard title="Avg Resolution" value={formatMinutes(reportsData.overview.avgResolutionTimeMinutes)} helper="Across filtered tickets" icon={<CheckCircle2 className="h-4 w-4" />} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Agent Workload and Outcomes</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 text-left">Agent</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Open</th>
                    <th className="py-2 text-right">Resolved</th>
                    <th className="py-2 text-right">Pending</th>
                    <th className="py-2 text-right">Resolution Rate</th>
                    <th className="py-2 text-right">Avg Response</th>
                    <th className="py-2 text-right">Avg Resolution</th>
                    <th className="py-2 text-right">Workload %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.agentPerformance.agents.map((agent) => (
                    <tr key={agent.agentEmail} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-800">{agent.agentName}</td>
                      <td className="py-2 text-right">{agent.totalTickets}</td>
                      <td className="py-2 text-right">{agent.openTickets}</td>
                      <td className="py-2 text-right">{agent.resolvedTickets}</td>
                      <td className="py-2 text-right">{agent.pendingTickets}</td>
                      <td className="py-2 text-right">{formatPercent(agent.resolutionRate)}</td>
                      <td className="py-2 text-right">{formatMinutes(agent.avgResponseTimeMinutes)}</td>
                      <td className="py-2 text-right">{formatMinutes(agent.avgResolutionTimeMinutes)}</td>
                      <td className="py-2 text-right">{formatPercent(agent.workloadPercentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>
        )}

        {activeTab === 'customers' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <MetricCard title="Total Customers" value={reportsData.customerReports.totalCustomers} helper="Customers in filtered set" icon={<Users className="h-4 w-4" />} />
              <MetricCard title="AI Conversations" value={reportsData.overview.aiHandledConversations} helper="Bot responses recorded" icon={<Bot className="h-4 w-4" />} />
              <MetricCard title="Open Tickets" value={reportsData.overview.openTickets} helper="Customer issues still active" icon={<Clock3 className="h-4 w-4" />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Customers by Ticket Volume</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 text-left">Customer</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">Open</th>
                      <th className="py-2 text-right">Resolved</th>
                      <th className="py-2 text-right">Avg Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.customerReports.topCustomers.map((customer) => (
                      <tr key={customer.customerEmail} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-800">{customer.customerEmail}</td>
                        <td className="py-2 text-right">{customer.totalTickets}</td>
                        <td className="py-2 text-right">{customer.openTickets}</td>
                        <td className="py-2 text-right">{customer.resolvedTickets}</td>
                        <td className="py-2 text-right">{formatMinutes(customer.avgResolutionTimeMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <ChartCard title="Most Common Customer Issues">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={issueData} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="issue" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3F5C79" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </section>
        )}

        {activeTab === 'channels' && (
          <section className="space-y-6">
            <ChartCard title="Ticket Volume by Channel">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalTickets" fill="#3F5C79" name="Total" />
                    <Bar dataKey="resolvedTickets" fill="#2F855A" name="Resolved" />
                    <Bar dataKey="escalatedTickets" fill="#D65745" name="Escalated" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Channel Details</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 text-left">Channel</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Open</th>
                    <th className="py-2 text-right">Resolved</th>
                    <th className="py-2 text-right">Escalated</th>
                    <th className="py-2 text-right">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.map((channel) => (
                    <tr key={channel.channel} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-800 capitalize">{channel.channel}</td>
                      <td className="py-2 text-right">{channel.totalTickets}</td>
                      <td className="py-2 text-right">{channel.openTickets}</td>
                      <td className="py-2 text-right">{channel.resolvedTickets}</td>
                      <td className="py-2 text-right">{channel.escalatedTickets}</td>
                      <td className="py-2 text-right">{formatMinutes(channel.avgResolutionTimeMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <MetricCard title="Total Conversations" value={reportsData.aiResponseReports.totalConversations} helper="All recorded ticket messages" icon={<MessageSquare className="h-4 w-4" />} />
              <MetricCard title="AI Conversations" value={reportsData.aiResponseReports.aiHandledConversations} helper="Messages handled by bot" icon={<Bot className="h-4 w-4" />} />
              <MetricCard title="AI Tickets" value={reportsData.aiResponseReports.ticketsWithAiParticipation} helper="Tickets with AI involvement" icon={<Ticket className="h-4 w-4" />} />
              <MetricCard title="AI Escalations" value={reportsData.aiResponseReports.aiEscalations} helper="AI to human handoff" icon={<TrendingUp className="h-4 w-4" />} />
              <MetricCard title="Escalation Rate" value={formatPercent(reportsData.aiResponseReports.aiEscalationRate)} helper="Of AI-involved tickets" icon={<AlertTriangle className="h-4 w-4" />} />
            </div>

            <ChartCard title="Common AI-Handled Issues">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.aiResponseReports.aiCommonIssues} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="issue" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7B5EA7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === 'resolution' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard title="Avg Response Time" value={formatMinutes(reportsData.resolutionReports.avgResponseTimeMinutes)} helper="From ticket creation" icon={<Clock3 className="h-4 w-4" />} />
              <MetricCard title="Avg Resolution Time" value={formatMinutes(reportsData.resolutionReports.avgResolutionTimeMinutes)} helper="To ticket closure" icon={<CheckCircle2 className="h-4 w-4" />} />
              <MetricCard title="SLA Breach Rate" value={formatPercent(reportsData.resolutionReports.slaBreachRate)} helper="Threshold by priority" icon={<AlertTriangle className="h-4 w-4" />} />
              <MetricCard title="First Contact Resolution" value={formatPercent(reportsData.resolutionReports.firstContactResolutionRate)} helper="Closed in one response" icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            <ChartCard title="Resolution Time Buckets">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.resolutionReports.resolutionBuckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2F855A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === 'feedback' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <MetricCard title="Rated Tickets" value={reportsData.feedbackReports.ratedTickets} helper="Tickets with satisfaction score" icon={<Activity className="h-4 w-4" />} />
              <MetricCard title="Average Rating" value={reportsData.feedbackReports.averageScore.toFixed(2)} helper="Scale 1 to 5" icon={<Gauge className="h-4 w-4" />} />
              <MetricCard title="Rating Coverage" value={formatPercent(reportsData.feedbackReports.ratingCoverageRate)} helper="Coverage on filtered tickets" icon={<Users className="h-4 w-4" />} />
            </div>

            <ChartCard title="Feedback Score Distribution">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.feedbackReports.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C49545" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>
        )}
      </div>
    </div>
  );
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#3F5C79] focus:outline-none focus:ring-2 focus:ring-[#3F5C79]/20';

const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="space-y-1">
    <span className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</span>
    {children}
  </label>
);

const MetricCard = ({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: number | string;
  helper: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <span className="rounded-md bg-slate-100 p-1.5 text-slate-600">{icon}</span>
    </div>
    <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{helper}</p>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
    {children}
  </section>
);

export default Reports;
