'use client';

import AdminLayout from '../../(admin)/layout';
import { LogIn } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function LoginHistoryPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    userType: '',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const dateRange = filterValues.dateRange || {};
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);
    if (filterValues.userType) params.set('userType', filterValues.userType);
    apiClient.get(`/super-admin/audit-logs/login-history?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load login history'))
      .finally(() => setLoading(false));
  }, [filterValues.dateRange, filterValues.userType]);

  const logins = data.data || data || (Array.isArray(data) ? data : []);

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'userType', type: 'select', label: 'User Type', placeholder: 'All Types', options: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'OPERATOR', label: 'Operator' },
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
    { key: 'user', label: 'User', render: (row: any) => (
      <span className="font-medium">{row.user?.name || row.userName || row.admin?.name || '-'}</span>
    )},
    { key: 'type', label: 'Type', render: (row: any) => (
      <StatusBadge status={row.userType || row.type || 'ADMIN'} variant={row.type === 'OPERATOR' ? 'info' : 'default'} />
    )},
    { key: 'ip', label: 'IP Address', render: (row: any) => <span className="font-mono text-xs">{row.ipAddress || row.ip || '-'}</span> },
    { key: 'userAgent', label: 'Device', render: (row: any) => {
      const ua = row.userAgent || '';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      return 'Other';
    }},
    { key: 'timestamp', label: 'Timestamp', render: (row: any) => new Date(row.createdAt || row.timestamp).toLocaleString() },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Login History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all login events</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Logins" value={data.total || logins.length} icon={<LogIn size="20" />} color="indigo" />
          <KPICard title="Today" value={logins.filter((l: any) => {
            const d = new Date(l.createdAt || l.timestamp);
            return d.toDateString() === new Date().toDateString();
          }).length} color="blue" />
          <KPICard title="Unique Users" value={[...new Set(logins.map((l: any) => l.userId || l.user?.id))].filter(Boolean).length} color="green" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={logins} emptyMessage="No login history" />
        )}
      </div>
    </AdminLayout>
  );
}
