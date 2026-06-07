'use client';

import AdminLayout from '../(admin)/layout';
import { DollarSign, TrendingUp } from 'lucide-react';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/api-client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function FinancesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    datePreset: '30d',
    channelId: '',
  });

  // Fetch channels for dropdown
  useEffect(() => {
    apiClient.get('/super-admin/channels').then(res => {
      const chs = (res.data.data?.data || res.data.data || res.data || []);
      setChannels(chs.map((c: any) => ({ value: c.id, label: c.companyName || 'Unknown' })));
    }).catch(() => {});
  }, []);

  // Compute date range from preset
  const dateRange = useMemo(() => {
    const preset = filterValues.datePreset || '30d';
    if (preset === 'custom' && filterValues.dateRange) {
      return filterValues.dateRange;
    }
    const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [filterValues.datePreset, filterValues.dateRange]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange?.from) params.set('from', dateRange.from);
    if (dateRange?.to) params.set('to', dateRange.to);
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    apiClient.get(`/super-admin/finances/revenue?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load financial data'))
      .finally(() => setLoading(false));
  }, [filterValues.datePreset, filterValues.channelId, dateRange?.from, dateRange?.to]);

  const filters: FilterConfig[] = [
    { key: 'datePreset', type: 'datePresets', label: 'Period', defaultValue: '30d' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
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

  const summary = data?.summary || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Revenue Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Financial overview and revenue metrics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={`Rs. ${(summary.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign size="20" />} color="green" />
          <KPICard title="Today" value={`Rs. ${(summary.today || 0).toLocaleString()}`} color="blue" />
          <KPICard title="This Week" value={`Rs. ${(summary.thisWeek || 0).toLocaleString()}`} color="indigo" />
          <KPICard title="This Month" value={`Rs. ${(summary.thisMonth || 0).toLocaleString()}`} icon={<TrendingUp size="20" />} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend" subtitle="Over time" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Breakdown by Payment Method" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.byPaymentMethod || [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="method"
                  label={({ method, percent }) => `${method} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {(data?.byPaymentMethod || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
