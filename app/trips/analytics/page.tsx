'use client';

import AdminLayout from '../../(admin)/layout';
import { Bus, TrendingUp } from 'lucide-react';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function TripAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    channelId: '',
    state: '',
  });

  // Fetch channels for dropdown
  useEffect(() => {
    apiClient.get('/super-admin/channels').then(res => {
      const chs = (res.data.data?.data || res.data.data || res.data || []);
      setChannels(chs.map((c: any) => ({ value: c.id, label: c.companyName || 'Unknown' })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    if (filterValues.state) params.set('state', filterValues.state);
    apiClient.get(`/super-admin/trips/analytics?${params.toString()}`)
      .then((res) => setAnalytics(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load trip analytics'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.channelId, filterValues.state]);

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
    { key: 'state', type: 'select', label: 'State', placeholder: 'All States', options: [
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'SCHEDULED', label: 'Scheduled' },
      { value: 'STARTED', label: 'Started' },
    ]},
  ];

  if (loading && !analytics) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

  if (error && !analytics) return (
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

  const summary = analytics?.summary || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive trip performance metrics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Trips" value={summary.total || 0} icon={<Bus size="20" />} color="indigo" />
          <KPICard title="Completed" value={summary.completed || 0} color="green" />
          <KPICard title="Cancelled" value={summary.cancelled || 0} color="red" />
          <KPICard title="Avg Occupancy" value={`${summary.avgOccupancy || 0}%`} icon={<TrendingUp size="20" />} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Trips by State" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.byState || [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {(analytics?.byState || [{ name: 'No Data', value: 1 }]).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Trips by Shift" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.byShift || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Trip Trend" subtitle="Over time" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trips" stroke="#4f46e5" strokeWidth={2} dot={false} name="Trips" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminLayout>
  );
}
