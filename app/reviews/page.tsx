'use client';

import AdminLayout from '../(admin)/layout';
import { Star } from 'lucide-react';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReviewsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    rating: '',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterValues.rating) params.set('minRating', filterValues.rating);

    setLoading(true);
    apiClient.get(`/super-admin/reviews/analytics?${params.toString()}`)
      .then((res) => setAnalytics(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load review analytics'))
      .finally(() => setLoading(false));
  }, [filterValues.rating]);

  const reviewFilters: FilterConfig[] = [
    { key: 'rating', type: 'select', label: 'Min Rating', placeholder: 'All Ratings', options: [
      { value: '5', label: '5 Stars' },
      { value: '4', label: '4+ Stars' },
      { value: '3', label: '3+ Stars' },
      { value: '2', label: '2+ Stars' },
      { value: '1', label: '1+ Stars' },
    ]},
  ];

  if (loading) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

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

  const summary = analytics?.summary || {};
  const distribution = analytics?.ratingDistribution || [
    { rating: 5, count: 0 },
    { rating: 4, count: 0 },
    { rating: 3, count: 0 },
    { rating: 2, count: 0 },
    { rating: 1, count: 0 },
  ];
  const channelComparison = analytics?.channelComparison || [];

  const channelColumns = [
    { key: 'name', label: 'Channel', render: (row: any) => <span className="font-medium">{row.name || '-'}</span> },
    { key: 'avgRating', label: 'Avg Rating', render: (row: any) => `⭐ ${(row.avgRating || 0).toFixed(1)}` },
    { key: 'totalReviews', label: 'Total Reviews', render: (row: any) => (row.totalReviews || 0).toLocaleString() },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customer feedback and ratings overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Reviews" value={summary.total || 0} icon={<Star size="20" />} color="amber" />
          <KPICard title="Avg Rating" value={(summary.averageRating || 0).toFixed(1)} color="indigo" />
          <KPICard title="Avg Driver Rating" value={(summary.avgDriverRating || 0).toFixed(1)} color="blue" />
          <KPICard title="Avg Staff Rating" value={(summary.avgStaffRating || 0).toFixed(1)} color="green" />
        </div>

        <FilterBar filters={reviewFilters} values={filterValues} onChange={setFilterValues} />

        <ChartCard title="Rating Distribution" subtitle="1-5 stars" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="#94a3b8" label={{ value: 'Stars', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Channel-wise Comparison</h3>
          <DataTable columns={channelColumns} data={channelComparison} emptyMessage="No channel review data" />
        </div>
      </div>
    </AdminLayout>
  );
}
