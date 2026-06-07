'use client';

import AdminLayout from '../../(admin)/layout';
import { Truck, Activity, Users } from 'lucide-react';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ChartCard from '@/components/ChartCard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FleetAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    channelId: '',
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
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    apiClient.get(`/super-admin/fleet/analytics?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load fleet analytics'))
      .finally(() => setLoading(false));
  }, [filterValues.channelId]);

  const filters: FilterConfig[] = [
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
  const byChannel = data?.byChannel || [];

  const columns = [
    { key: 'name', label: 'Channel', render: (row: any) => <span className="font-medium">{row.name || '-'}</span> },
    { key: 'buses', label: 'Total Buses', render: (row: any) => (row.buses || 0).toLocaleString() },
    { key: 'drivers', label: 'Drivers', render: (row: any) => (row.drivers || 0).toLocaleString() },
    { key: 'utilization', label: 'Utilization', render: (row: any) => {
      const rate = row.utilization || 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-20">
            <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${rate}%` }} />
          </div>
          <span className="text-xs text-gray-600">{rate}%</span>
        </div>
      );
    }},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fleet Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fleet performance and utilization metrics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Buses" value={summary.totalBuses || 0} icon={<Truck size="20" />} color="indigo" />
          <KPICard title="Total Drivers" value={summary.totalDrivers || 0} icon={<Users size="20" />} color="blue" />
          <KPICard title="Total Staff" value={summary.totalStaff || 0} color="green" />
          <KPICard title="Utilization Rate" value={`${summary.utilizationRate || 0}%`} icon={<Activity size="20" />} color="blue" />
        </div>

        <ChartCard title="Fleet by Channel" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="buses" stackId="a" fill="#4f46e5" name="Buses" />
              <Bar dataKey="drivers" stackId="a" fill="#10b981" name="Drivers" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Per-Channel Fleet</h3>
          <DataTable columns={columns} data={byChannel} emptyMessage="No fleet data" />
        </div>
      </div>
    </AdminLayout>
  );
}
