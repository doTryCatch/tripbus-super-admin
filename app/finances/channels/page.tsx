'use client';

import AdminLayout from '../../(admin)/layout';
import { Building2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function ChannelFinancialsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    sortBy: '',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.sortBy) params.set('sortBy', filterValues.sortBy);
    apiClient.get(`/super-admin/finances/revenue/by-channel?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load channel financials'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.sortBy]);

  const channels = data.data || data || (Array.isArray(data) ? data : []);
  const summary = data.summary || {};

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'sortBy', type: 'select', label: 'Sort By', placeholder: 'Default', options: [
      { value: 'revenue', label: 'Revenue' },
      { value: 'bookings', label: 'Bookings' },
      { value: 'avgFare', label: 'Avg Fare' },
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

  const columns = [
    { key: 'channelName', label: 'Channel Name', render: (row: any) => (
      <span className="font-medium">{row.channelName || row.channel?.companyName || '-'}</span>
    )},
    { key: 'revenue', label: 'Revenue', render: (row: any) => `Rs. ${(row.revenue || row.totalRevenue || 0).toLocaleString()}` },
    { key: 'bookings', label: 'Bookings', render: (row: any) => (row.bookings || row.totalBookings || 0).toLocaleString() },
    { key: 'avgFare', label: 'Avg Fare', render: (row: any) => {
      const avg = row.avgFare || (row.revenue && row.bookings ? row.revenue / row.bookings : 0);
      return `Rs. ${Math.round(avg).toLocaleString()}`;
    }},
  ];

  const totalRevenue = channels.reduce((sum: number, c: any) => sum + (c.revenue || c.totalRevenue || 0), 0);
  const totalBookings = channels.reduce((sum: number, c: any) => sum + (c.bookings || c.totalBookings || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Channel Financials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revenue breakdown by channel</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Revenue" value={`Rs. ${(summary.totalRevenue || totalRevenue).toLocaleString()}`} icon={<Building2 size="20" />} color="green" />
          <KPICard title="Total Bookings" value={(summary.totalBookings || totalBookings).toLocaleString()} color="blue" />
          <KPICard title="Channels" value={channels.length} color="indigo" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={channels} emptyMessage="No channel financial data" />
        )}
      </div>
    </AdminLayout>
  );
}
