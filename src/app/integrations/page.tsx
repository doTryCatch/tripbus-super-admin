'use client';

import AdminLayout from '../(admin)/layout';
import { Link2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    channelId: '',
  });
  const router = useRouter();

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
    if (filterValues.search) params.set('search', filterValues.search);
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    apiClient.get(`/super-admin/integrations?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load integrations'))
      .finally(() => setLoading(false));
  }, [filterValues.search, filterValues.status, filterValues.channelId]);

  const integrations = data.data || data || (Array.isArray(data) ? data : []);

  const filters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search integrations...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ]},
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

  const columns = [
    { key: 'name', label: 'Partner Name', render: (row: any) => (
      <span className="font-medium text-indigo-600 dark:text-indigo-400">{row.name || row.partnerName || '-'}</span>
    )},
    { key: 'channel', label: 'Channel', render: (row: any) => row.channel?.companyName || row.channelName || '-' },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'ACTIVE'} /> },
    { key: 'apiCalls', label: 'API Calls', render: (row: any) => (row.apiCalls || row.totalApiCalls || 0).toLocaleString() },
    { key: 'bookings', label: 'Bookings', render: (row: any) => (row.bookings || row.totalBookings || 0).toLocaleString() },
    { key: 'revenue', label: 'Revenue', render: (row: any) => `Rs. ${(row.revenue || 0).toLocaleString()}` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integration Partners</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage API integration partners</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Partners" value={data.total || integrations.length} icon={<Link2 size="20" />} color="indigo" />
          <KPICard title="Active" value={integrations.filter((p: any) => p.status === 'ACTIVE').length} color="green" />
          <KPICard title="Total API Calls" value={integrations.reduce((sum: number, p: any) => sum + (p.apiCalls || p.totalApiCalls || 0), 0).toLocaleString()} color="blue" />
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        {loading ? <LoadingSkeleton /> : (
          <DataTable
            columns={columns}
            data={integrations}
            onRowClick={(row) => router.push(`/integrations/${row.id}`)}
            emptyMessage="No integrations found"
          />
        )}
      </div>
    </AdminLayout>
  );
}
