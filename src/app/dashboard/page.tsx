'use client';

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/lib/api-client';
import AdminLayout from '../(admin)/layout';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import {
  Building2, Users, UserCheck, Briefcase, Bus, DollarSign,
  Activity, BarChart3, TrendingUp, Server, Database, Wifi,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
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
    apiClient.get(`/super-admin/dashboard/stats?${params.toString()}`)
      .then((res) => setStats(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [filterValues.datePreset, filterValues.channelId, dateRange?.from, dateRange?.to]);

  const filters: FilterConfig[] = [
    { key: 'datePreset', type: 'datePresets', label: 'Period', defaultValue: '30d' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
  ];

  if (error) return (
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and key metrics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Channels" value={stats?.channels?.total || 0} icon={<Building2 size="20" />} color="indigo" changeLabel="this month" />
          <KPICard title="Total Operators" value={stats?.operators?.total || 0} icon={<Users size="20" />} color="blue" changeLabel="this month" />
          <KPICard title="Total Passengers" value={stats?.passengers?.total || 0} icon={<UserCheck size="20" />} color="green" changeLabel="this month" />
          <KPICard title="Total Staff" value={stats?.staff?.total || 0} icon={<Briefcase size="20" />} color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Trips Today" value={stats?.trips?.today || 0} icon={<Bus size="20" />} color="blue" />
          <KPICard title="Revenue (All Time)" value={`Rs. ${(stats?.revenue?.allTime || 0).toLocaleString()}`} icon={<DollarSign size="20" />} color="green" />
          <KPICard title="Active Trips" value={stats?.trips?.active || 0} icon={<Activity size="20" />} color="amber" />
          <KPICard title="Occupancy Rate" value={`${stats?.occupancyRate || 0}%`} icon={<BarChart3 size="20" />} color="indigo" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend" subtitle="Last 30 days" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats?.trends?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Trip Volume" subtitle="Last 30 days" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.trends?.tripVolume || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="System Health">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                 <div className="flex items-center gap-3">
                   <Database size="20" className="text-gray-500 dark:text-gray-400" />
                   <span className="text-sm font-medium dark:text-gray-200">Database</span>
                 </div>
                 <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                   stats?.systemHealth?.database === 'connected'
                     ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                     : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                 }`}>
                   {stats?.systemHealth?.database || 'unknown'}
                 </span>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                 <div className="flex items-center gap-3">
                   <Wifi size="20" className="text-gray-500 dark:text-gray-400" />
                   <span className="text-sm font-medium dark:text-gray-200">Redis Cache</span>
                 </div>
                 <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                   stats?.systemHealth?.redis === 'connected'
                     ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                     : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                 }`}>
                   {stats?.systemHealth?.redis || 'unknown'}
                 </span>
               </div>
            </div>
          </ChartCard>

          <ChartCard title="Channel Growth" subtitle="Last 30 days" loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats?.trends?.channelGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
