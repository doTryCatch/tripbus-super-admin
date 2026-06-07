'use client';

import AdminLayout from '../(admin)/layout';
import { Building2, Plus, Search, ArrowUpDown } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/AuthContext';

export default function ChannelsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    plan: '',
    sort: '',
  });
  const router = useRouter();
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('channels', 'create');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterValues.search) params.set('search', filterValues.search);
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.plan) params.set('plan', filterValues.plan);
    if (filterValues.sort) params.set('sort', filterValues.sort);

    setLoading(true);
    apiClient.get(`/super-admin/channels?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load channels'))
      .finally(() => setLoading(false));
  }, [filterValues.search, filterValues.status, filterValues.plan, filterValues.sort]);

  const channels = data.data || data || [];

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

  const channelFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search channels...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'SUSPENDED', label: 'Suspended' },
      { value: 'TERMINATED', label: 'Terminated' },
      { value: 'TRIAL', label: 'Trial' },
    ]},
    { key: 'plan', type: 'select', label: 'Plan', placeholder: 'All Plans', options: [
      { value: 'FREE', label: 'Free' },
      { value: 'STARTER', label: 'Starter' },
      { value: 'PROFESSIONAL', label: 'Professional' },
      { value: 'ENTERPRISE', label: 'Enterprise' },
    ]},
    { key: 'sort', type: 'select', label: 'Sort By', placeholder: 'Default', options: [
      { value: 'name', label: 'Name' },
      { value: 'revenue', label: 'Revenue' },
      { value: 'operators', label: 'Operators' },
    ]},
  ];

  const columns = [
    { key: 'companyName', label: 'Company', render: (row: any) => (
      <Link href={`/channels/${row.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">{row.companyName}</Link>
    )},
    { key: 'plan', label: 'Plan', render: (row: any) => <StatusBadge status={row.plan || 'FREE'} /> },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'ACTIVE'} /> },
    { key: 'operators', label: 'Operators', render: (row: any) => {
      const accounts = row.accounts || [];
      if (accounts.length === 0) return <span className="text-gray-400">0</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {accounts.slice(0, 2).map((a: any) => (
            <Link
              key={a.id}
              href={`/operators/${a.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
            >
              {a.name || a.email?.split('@')[0]}
            </Link>
          ))}
          {accounts.length > 2 && (
            <span className="text-xs text-gray-400">+{accounts.length - 2} more</span>
          )}
        </div>
      );
    }},
    { key: 'stats', label: 'Buses', render: (row: any) => row.stats?.busesCount || 0 },
    { key: 'revenue', label: 'Revenue', render: (row: any) => `Rs. ${(row.stats?.revenue || 0).toLocaleString()}` },
    { key: 'createdAt', label: 'Created', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Channels</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all transport companies on the platform</p>
          </div>
          {canCreate && (
            <Link href="/channels/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <Plus size="16" /> Create Channel
            </Link>
          )}
        </div>

        <FilterBar
          filters={channelFilters}
          values={filterValues}
          onChange={setFilterValues}
        />

        {loading ? <LoadingSkeleton /> : (
          <DataTable
            columns={columns}
            data={channels}
            onRowClick={(row) => router.push(`/channels/${row.id}`)}
            emptyMessage="No channels found"
          />
        )}
      </div>
    </AdminLayout>
  );
}
