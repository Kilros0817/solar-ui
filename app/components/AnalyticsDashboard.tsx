'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { URLs } from '@/utils/constants';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Activity, Users, BarChart2, RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StageDuration { stage: string; duration: number | null }
interface Bottleneck { stage: string; duration?: number | null; average_duration?: number | null }

interface ClauseResult {
  clause_id: string; member: string | null;
  stage_durations: StageDuration[]; bottleneck: Bottleneck;
  reject_count: number; reassign_count: number;
}
interface SectionResult {
  section_id: string; division: string; leader: string | null;
  stage_durations: StageDuration[]; bottleneck: Bottleneck;
  reject_count: number; reassign_count: number; clauses: ClauseResult[];
}
interface DocumentResult {
  document_id: string; cycle_time: number | null;
  stage_durations: StageDuration[]; bottleneck: Bottleneck;
  reject_count: number; sections: SectionResult[];
}
interface DivisionStats {
  section_count: number; avg_assign_to_request: number | null;
  avg_request_to_approve: number | null; total_rejects: number;
  total_reassigns: number; bottleneck_stage: string | null;
}
interface AnalysisReport {
  summary: {
    total_workflows: number; completed_workflows: number;
    completion_rate_percent: number; average_cycle_time: number | null;
    time_unit: string;
  };
  throughput_by_week: Record<string, number>;
  division_rollup: Record<string, DivisionStats>;
  documents: DocumentResult[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    pending_to_request: 'Pending → Request',
    request_to_approved: 'Request → Approved',
    approved_to_esigned: 'Approved → Signed',
    assign_to_request: 'Assign → Request',
    request_to_approve: 'Request → Approve',
  };
  return map[stage] ?? stage;
}

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'hsl(var(--foreground))',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5 mb-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: AnalysisReport['summary'] }) {
  const cards = [
    {
      title: 'Total Workflows',
      value: summary.total_workflows,
      sub: 'All contracts tracked',
      icon: Activity,
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#818cf8',
    },
    {
      title: 'Completed',
      value: summary.completed_workflows,
      sub: 'Fully e-signed',
      icon: CheckCircle,
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#4ade80',
    },
    {
      title: 'Completion Rate',
      value: `${summary.completion_rate_percent}%`,
      sub: 'Of all workflows',
      icon: TrendingUp,
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#a5b4fc',
    },
    {
      title: 'Avg Cycle Time',
      value: formatDuration(summary.average_cycle_time),
      sub: 'Per completed workflow',
      icon: Clock,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#fbbf24',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.title} className="border border-border" style={{ background: 'hsl(var(--card))', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.title}</p>
                <p className="text-3xl font-semibold tracking-tight">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <div className="p-2.5 rounded-lg shrink-0 mt-1" style={{ background: c.iconBg }}>
                <c.icon className="h-4 w-4" style={{ color: c.iconColor }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Throughput chart ─────────────────────────────────────────────────────────

function weekLabel(isoWeek: string): string {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return isoWeek;
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function ThroughputChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week: weekLabel(week), count }));

  if (chartData.length === 0) return (
    <Card className="flex items-center justify-center h-64">
      <p className="text-sm text-muted-foreground">No throughput data yet</p>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{label}</p>
        <p style={{ fontWeight: 600 }}>{payload[0].value} completed</p>
      </div>
    );
  };

  // Use bar chart for sparse data, area chart for richer datasets
  const useArea = chartData.length > 3;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Weekly Throughput</CardTitle>
        <CardDescription className="text-xs">Completed workflows per week</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          {useArea ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#throughputGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48}
                label={{ position: 'top', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Bottleneck distribution ──────────────────────────────────────────────────

function BottleneckDistribution({ documents }: { documents: DocumentResult[] }) {
  const stageCounts: Record<string, number> = {};
  for (const doc of documents) {
    const s = doc.bottleneck?.stage;
    if (s) stageCounts[s] = (stageCounts[s] ?? 0) + 1;
  }
  const chartData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stageLabel(stage), count,
  }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Bottleneck Distribution</CardTitle>
        <CardDescription className="text-xs">Which stage slows down documents most</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={140} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" name="Documents" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Division stage durations ─────────────────────────────────────────────────

function DivisionDurationsChart({ data }: { data: Record<string, DivisionStats> }) {
  const chartData = Object.entries(data).map(([division, stats]) => ({
    division: division.replace(/([A-Z])/g, ' $1').trim(),
    assignToRequest: stats.avg_assign_to_request ?? 0,
    requestToApprove: stats.avg_request_to_approve ?? 0,
    assignLabel: formatDuration(stats.avg_assign_to_request),
    approveLabel: formatDuration(stats.avg_request_to_approve),
  }));

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.name === 'assignToRequest' ? '#818cf8' : '#4ade80', marginBottom: 2 }}>
            {p.name === 'assignToRequest' ? 'Assign → Request' : 'Request → Approve'}: {formatDuration(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Division Stage Durations</CardTitle>
        <CardDescription className="text-xs">Average time per stage by division</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 52)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 60, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => formatDuration(v)}
            />
            <YAxis
              type="category" dataKey="division"
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              axisLine={false} tickLine={false} width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar dataKey="assignToRequest" name="assignToRequest" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={14}
              label={{ position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))', formatter: (v: number) => formatDuration(v) }} />
            <Bar dataKey="requestToApprove" name="requestToApprove" fill="#22c55e" radius={[0, 3, 3, 0]} maxBarSize={14}
              label={{ position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))', formatter: (v: number) => formatDuration(v) }} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#6366f1' }} />
            Assign → Request
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#22c55e' }} />
            Request → Approve
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Division quality chart ───────────────────────────────────────────────────

function DivisionQualityChart({ data }: { data: Record<string, DivisionStats> }) {
  const chartData = Object.entries(data)
    .map(([division, stats]) => ({
      division: division.replace(/([A-Z])/g, ' $1').trim(),
      Rejects: stats.total_rejects,
      Reassigns: stats.total_reassigns,
    }))
    .filter((d) => d.Rejects > 0 || d.Reassigns > 0);

  if (chartData.length === 0) return (
    <Card className="flex items-center justify-center h-64">
      <p className="text-sm text-muted-foreground">No rejects or reassigns recorded</p>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill, marginBottom: 2 }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quality Issues by Division</CardTitle>
        <CardDescription className="text-xs">Rejects and reassigns per division</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 48)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number" allowDecimals={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              type="category" dataKey="division" width={110}
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar dataKey="Rejects" fill="#f87171" radius={[0, 3, 3, 0]} maxBarSize={14}
              label={{ position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Bar dataKey="Reassigns" fill="#fbbf24" radius={[0, 3, 3, 0]} maxBarSize={14}
              label={{ position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f87171' }} />
            Rejects
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fbbf24' }} />
            Reassigns
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Division table ───────────────────────────────────────────────────────────

function DivisionTable({ data }: { data: Record<string, DivisionStats> }) {
  const rows = Object.entries(data);
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Division Performance</CardTitle>
        <CardDescription className="text-xs">Aggregated metrics across all sections per division</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {['Division', 'Sections', 'Avg Assign→Request', 'Avg Request→Approve', 'Rejects', 'Reassigns', 'Bottleneck'].map((h) => (
                <th key={h} className="text-left py-2.5 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([division, stats]) => (
              <tr key={division} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4 font-medium text-sm">{division}</td>
                <td className="py-3 pr-4 text-muted-foreground">{stats.section_count}</td>
                <td className="py-3 pr-4 tabular-nums">{formatDuration(stats.avg_assign_to_request)}</td>
                <td className="py-3 pr-4 tabular-nums">{formatDuration(stats.avg_request_to_approve)}</td>
                <td className="py-3 pr-4">
                  <span className={cn('tabular-nums', stats.total_rejects > 0 && 'font-medium')}
                    style={stats.total_rejects > 0 ? { color: '#f87171' } : undefined}>
                    {stats.total_rejects}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={cn('tabular-nums', stats.total_reassigns > 0 && 'font-medium')}
                    style={stats.total_reassigns > 0 ? { color: '#fbbf24' } : undefined}>
                    {stats.total_reassigns}
                  </span>
                </td>
                <td className="py-3">
                  {stats.bottleneck_stage
                    ? <Badge variant="outline" className="text-xs font-normal">{stageLabel(stats.bottleneck_stage)}</Badge>
                    : <span className="text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Document table ───────────────────────────────────────────────────────────

function DocumentTable({ documents }: { documents: DocumentResult[] }) {
  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Document Breakdown</CardTitle>
        <CardDescription className="text-xs">Stage durations and bottleneck per completed document</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {['Doc ID', 'Cycle Time', 'Pending→Request', 'Request→Approved', 'Approved→Signed', 'Bottleneck', 'Rejects', 'Sections'].map((h) => (
                <th key={h} className="text-left py-2.5 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => {
              const p2r = doc.stage_durations.find((s) => s.stage === 'pending_to_request')?.duration;
              const r2a = doc.stage_durations.find((s) => s.stage === 'request_to_approved')?.duration;
              const a2e = doc.stage_durations.find((s) => s.stage === 'approved_to_esigned')?.duration;
              const bn = doc.bottleneck?.stage;
              return (
                <tr key={doc.document_id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{doc.document_id}</td>
                  <td className="py-3 pr-4 font-medium tabular-nums">{formatDuration(doc.cycle_time)}</td>
                  <td className="py-3 pr-4 tabular-nums text-muted-foreground">{formatDuration(p2r)}</td>
                  <td className="py-3 pr-4 tabular-nums text-muted-foreground">{formatDuration(r2a)}</td>
                  <td className="py-3 pr-4 tabular-nums text-muted-foreground">{formatDuration(a2e)}</td>
                  <td className="py-3 pr-4">
                    {bn
                      ? <Badge variant="outline" className="text-xs font-normal">{stageLabel(bn)}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn('tabular-nums', doc.reject_count > 0 && 'font-medium')}
                      style={doc.reject_count > 0 ? { color: '#f87171' } : undefined}>
                      {doc.reject_count}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{doc.sections.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    axios
      .get(`${URLs.AnalysisAPI}/report`)
      .then((res) => {
        if (res.data.isSuccess) setReport(res.data.report);
        else setError('API returned failure');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !report) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 h-64">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">Failed to load analytics</span>
        </div>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchReport}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-brand-primary/10">
              <BarChart2 className="h-4 w-4 text-brand-secondary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-8">
            Workflow performance across {report.summary.total_workflows} contracts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReport} className="shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <SummaryCards summary={report.summary} />

      {/* Trends */}
      <div>
        <SectionHeader title="Trends" description="Throughput and bottleneck patterns over time" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThroughputChart data={report.throughput_by_week} />
          <BottleneckDistribution documents={report.documents} />
        </div>
      </div>

      {/* Division performance */}
      <div>
        <SectionHeader title="Division Performance" description="Stage durations and quality signals per division" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DivisionDurationsChart data={report.division_rollup} />
          <DivisionQualityChart data={report.division_rollup} />
        </div>
        <DivisionTable data={report.division_rollup} />
      </div>

      {/* Document details */}
      <div>
        <SectionHeader
          title="Document Details"
          description={`${report.documents.length} completed workflow${report.documents.length !== 1 ? 's' : ''}`}
        />
        <DocumentTable documents={report.documents} />
      </div>

    </div>
  );
}
