'use client';

import AdminLayout from '../(admin)/layout';
import { UserCheck } from 'lucide-react';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function PassengersPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
  });
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterValues.search) params.set('search', filterValues.search);
    if (filterValues.status) params.set('status', filterValues.status);

    setLoading(true);
    apiClient.get(`/super-admin/passengers?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load passengers'))
      .finally(() => setLoading(false));
  }, [filterValues.search, filterValues.status]);

  const passengers = data.data || data || [];

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

  const passengerFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search passengers...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
    ]},
  ];

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => (
      <span className="font-medium text-indigo-600 dark:text-indigo-400">{row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email}</span>
    )},
    { key: 'email', label: 'Email', render: (row: any) => row.email || '-' },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '-' },
    { key: 'bookings', label: 'Bookings', render: (row: any) => row.totalBookings || row.bookingsCount || 0 },
    { key: 'totalSpent', label: 'Total Spent', render: (row: any) => `Rs. ${(row.totalSpent || 0).toLocaleString()}` },
    { key: 'registered', label: 'Registered', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Passengers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All registered passengers on the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Passengers" value={data.total || passengers.length} icon={<UserCheck size="20" />} color="green" />
          <KPICard title="Total Bookings" value={passengers.reduce((sum: number, p: any) => sum + (p.totalBookings || p.bookingsCount || 0), 0)} color="blue" />
          <KPICard title="Total Revenue" value={`Rs. ${passengers.reduce((sum: number, p: any) => sum + (p.totalSpent || 0), 0).toLocaleString()}`} color="indigo" />
        </div>

        <FilterBar filters={passengerFilters} values={filterValues} onChange={setFilterValues} />

        {loading ? <LoadingSkeleton /> : (
          <DataTable
            columns={columns}
            data={passengers}
            onRowClick={(row) => router.push(`/passengers/${row.id}`)}
            emptyMessage="No passengers found"
          />
        )}
      </div>
    </AdminLayout>
  );
}
