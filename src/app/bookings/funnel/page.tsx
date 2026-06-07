'use client';

import AdminLayout from '../../(admin)/layout';
import { TrendingDown } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export default function BookingFunnelPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
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
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    apiClient.get(`/super-admin/bookings/analytics?${params.toString()}`)
      .then((res) => setAnalytics(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load booking analytics'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.channelId]);

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
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

  const funnel = analytics?.funnel;

  // If no funnel data available, show message
  if (!funnel || (!funnel.viewed && !funnel.totalViews)) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking Funnel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Conversion funnel from view to booking</p>
          </div>
          <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <TrendingDown size="40" className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">No funnel data available</p>
            <p className="text-sm text-gray-400 mt-1">Funnel data will appear once booking events are tracked.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stages: FunnelStage[] = [
    { name: 'Viewed', count: funnel.viewed || funnel.totalViews || 0, percentage: 100, color: 'bg-indigo-500' },
    { name: 'Selected', count: funnel.selected || funnel.totalSelected || 0, percentage: 0, color: 'bg-blue-500' },
    { name: 'Held', count: funnel.held || funnel.totalHeld || 0, percentage: 0, color: 'bg-amber-500' },
    { name: 'Payment', count: funnel.payment || funnel.totalPayment || 0, percentage: 0, color: 'bg-purple-500' },
    { name: 'Booked', count: funnel.booked || funnel.confirmed || funnel.totalBooked || 0, percentage: 0, color: 'bg-emerald-500' },
  ];

  // Calculate percentages
  const maxCount = stages[0]?.count || 1;
  stages.forEach((stage) => {
    stage.percentage = Math.round((stage.count / maxCount) * 100);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking Funnel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Conversion funnel from view to booking</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Overall Conversion" value={`${stages.length > 1 ? ((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1) : 0}%`} icon={<TrendingDown size="20" />} color="indigo" />
          <KPICard title="View → Selected" value={stages[1] ? `${((stages[1].count / stages[0].count) * 100).toFixed(1)}%` : '0%'} color="blue" />
          <KPICard title="Selected → Payment" value={stages[3] && stages[1] ? `${((stages[3].count / stages[1].count) * 100).toFixed(1)}%` : '0%'} color="amber" />
          <KPICard title="Payment → Booked" value={stages[4] && stages[3] ? `${((stages[4].count / stages[3].count) * 100).toFixed(1)}%` : '0%'} color="green" />
        </div>

        {/* Visual Funnel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-6">Funnel Visualization</h3>
          <div className="max-w-2xl mx-auto space-y-3">
            {stages.map((stage, i) => {
              const conversionFromPrev = i > 0 && stages[i - 1].count > 0
                ? ((stage.count / stages[i - 1].count) * 100).toFixed(1)
                : '100';

              return (
                <div key={stage.name} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className={`h-14 ${stage.color} rounded-lg flex items-center justify-end px-4 transition-all duration-500`} style={{ width: `${stage.percentage}%` }}>
                        <span className="text-white font-semibold text-sm">{stage.count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-sm text-gray-500">{stage.percentage}%</span>
                    </div>
                  </div>
                  {i > 0 && (
                    <div className="ml-28 mt-1 text-xs text-gray-400">
                      ↓ {conversionFromPrev}% from {stages[i - 1].name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
