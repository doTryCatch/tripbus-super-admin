'use client';

import AdminLayout from '../../(admin)/layout';
import { Link2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function IntegrationRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    status: '',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.status) params.set('status', filterValues.status);
    apiClient.get(`/super-admin/integrations/analytics?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load integration revenue'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.status]);

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ]},
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

  const partners = data?.partners || [];
  const summary = data?.summary || {};

  const columns = [
    { key: 'partnerName', label: 'Partner', render: (row: any) => <span className="font-medium">{row.partnerName || row.name || '-'}</span> },
    { key: 'channel', label: 'Channel', render: (row: any) => row.channel?.companyName || row.channelName || '-' },
    { key: 'bookings', label: 'Bookings', render: (row: any) => (row.bookings || 0).toLocaleString() },
    { key: 'revenue', label: 'Revenue', render: (row: any) => `Rs. ${(row.revenue || 0).toLocaleString()}` },
    { key: 'margin', label: 'Margin', render: (row: any) => `${row.margin || row.marginPercent || 0}%` },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'ACTIVE'} /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integration Revenue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revenue from integration partners</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Partner Revenue" value={`Rs. ${(summary.integrationRevenue || 0).toLocaleString()}`} icon={<Link2 size="20" />} color="green" />
          <KPICard title="Active Partners" value={partners.length} color="blue" />
          <KPICard title="Avg Margin" value={`${summary.avgMargin || 0}%`} color="indigo" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={partners} emptyMessage="No integration revenue data" />
        )}
      </div>
    </AdminLayout>
  );
}
