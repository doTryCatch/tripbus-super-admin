'use client';

import AdminLayout from '../../(admin)/layout';
import { Activity, AlertTriangle } from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function APIAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    partnerId: '',
  });

  // Fetch partners for dropdown
  useEffect(() => {
    apiClient.get('/super-admin/integrations').then(res => {
      const pts = res.data.data?.data || res.data.data || res.data || [];
      const list = Array.isArray(pts) ? pts : [];
      setPartners(list.map((p: any) => ({ value: p.id, label: p.name || p.partnerName || 'Unknown' })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.partnerId) params.set('partnerId', filterValues.partnerId);
    apiClient.get(`/super-admin/integrations/analytics?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load API analytics'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.partnerId]);

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'partnerId', type: 'select', label: 'Partner', placeholder: 'All Partners', options: partners },
  ];

  if (loading && !data) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

  if (error && !data) return (
    <AdminLayout>
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Retry</button>
        </div>
      </div>
    </AdminLayout>
  );

  const summary = data?.summary || data || {};
  const partnerData = data?.partners || [];
  const callVolume = data?.callVolume || [];
  const errorRate = data?.errorRate || [];
  const latency = data?.latency || [];

  const partnerColumns = [
    { key: 'name', label: 'Partner', render: (row: any) => <span className="font-medium">{row.name || row.partnerName || '-'}</span> },
    { key: 'calls', label: 'API Calls', render: (row: any) => (row.apiCalls || 0).toLocaleString() },
    { key: 'errors', label: 'Errors', render: (row: any) => (row.errors || 0).toLocaleString() },
    { key: 'errorRate', label: 'Error Rate', render: (row: any) => `${(row.errorRate || 0).toFixed(2)}%` },
    { key: 'avgLatency', label: 'Avg Latency', render: (row: any) => `${row.avgLatency || 0}ms` },
    { key: 'p99Latency', label: 'P99 Latency', render: (row: any) => `${row.p99Latency || 0}ms` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Integration API performance metrics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total API Calls" value={(summary.totalCalls || 0).toLocaleString()} icon={<Activity size="20" />} color="blue" />
          <KPICard title="Error Rate" value={`${(summary.errorRate || 0).toFixed(2)}%`} icon={<AlertTriangle size="20" />} color="red" />
          <KPICard title="Avg Latency" value={`${summary.avgLatency || 0}ms`} color="indigo" />
          <KPICard title="P99 Latency" value={`${summary.p99Latency || 0}ms`} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Call Volume" subtitle="Over time" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={callVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Error Rate" subtitle="Over time" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={errorRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Latency Percentiles" loading={loading}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={latency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="p50" fill="#4f46e5" name="P50" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p95" fill="#f59e0b" name="P95" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p99" fill="#ef4444" name="P99" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Per-Partner Comparison</h3>
          {loading ? <LoadingSkeleton /> : (
            <DataTable columns={partnerColumns} data={partnerData} emptyMessage="No partner data" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
