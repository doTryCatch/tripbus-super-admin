'use client';

import dynamic from 'next/dynamic';
import AdminLayout from '../(admin)/layout';
import { Truck, Activity, Wifi, WifiOff } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

// Dynamically import the map component with SSR disabled (Leaflet needs window)
const SuperAdminFleetMap = dynamic(
  () => import('@/components/SuperAdminFleetMap').then(mod => ({ default: mod.default || mod })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function FleetPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    channelId: '',
    status: '',
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
    if (filterValues.status) params.set('status', filterValues.status);
    apiClient.get(`/super-admin/fleet/locations?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load fleet data'))
      .finally(() => setLoading(false));
  }, [filterValues.channelId, filterValues.status]);

  const filters: FilterConfig[] = [
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ON_TRIP', label: 'On Trip' },
      { value: 'IDLE', label: 'Idle' },
      { value: 'OFFLINE', label: 'Offline' },
    ]},
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

  const buses = data?.buses || [];
  const summary = data?.summary || {};

  const onTrip = buses.filter((b: any) => b.status === 'ON_TRIP' || b.status === 'ACTIVE' || b.status === 'started');
  const idle = buses.filter((b: any) => b.status === 'IDLE' || b.status === 'idle');
  const offline = buses.filter((b: any) => b.status === 'OFFLINE' || b.status === 'INACTIVE');

  const columns = [
    { key: 'name', label: 'Bus Name', render: (row: any) => <span className="font-medium">{row.name || '-'}</span> },
    { key: 'channel', label: 'Channel', render: (row: any) => (
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-400" />
        <span>{row.channel || '-'}</span>
      </span>
    )},
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'IDLE'} /> },
    { key: 'route', label: 'Route', render: (row: any) => row.route || '-' },
    { key: 'driver', label: 'Driver', render: (row: any) => row.driver || '-' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fleet Map</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time fleet locations and status</p>
          </div>
          {buses.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live · {buses.length} buses tracked
            </div>
          )}
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Buses" value={summary.total || buses.length} icon={<Truck size="20" />} color="indigo" />
          <KPICard title="On Trip" value={onTrip.length} icon={<Activity size="20" />} color="green" />
          <KPICard title="Idle" value={idle.length} icon={<Wifi size="20" />} color="amber" />
          <KPICard title="Offline" value={offline.length} icon={<WifiOff size="20" />} color="red" />
        </div>

        {/* Fleet Map */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Live Fleet Map</h3>
              <p className="text-xs text-gray-500 mt-0.5">Auto-refreshing every 10 seconds</p>
            </div>
          </div>
          <div className="h-[500px]">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <LoadingSkeleton rows={3} />
              </div>
            ) : (
              <SuperAdminFleetMap />
            )}
          </div>
        </div>

        {/* Bus List Table */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Bus List</h3>
          {loading ? <LoadingSkeleton /> : (
            <DataTable columns={columns} data={buses} emptyMessage="No fleet data available" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
