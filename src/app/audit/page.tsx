'use client';

import AdminLayout from '../(admin)/layout';
import { Shield, Search, Calendar } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function AuditPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);
    if (dateFrom) params.set('startDate', dateFrom);
    if (dateTo) params.set('endDate', dateTo);
    if (entityTypeFilter) params.set('entityType', entityTypeFilter);
    apiClient.get(`/super-admin/audit-logs?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [actionFilter, dateFrom, dateTo, entityTypeFilter]);

  const logs = data.data || data || (Array.isArray(data) ? data : []);

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
    { key: 'timestamp', label: 'Timestamp', render: (row: any) => new Date(row.createdAt || row.timestamp).toLocaleString() },
    { key: 'admin', label: 'Admin', render: (row: any) => row.admin?.name || row.adminName || row.user?.name || '-' },
    { key: 'action', label: 'Action', render: (row: any) => <span className="font-medium">{row.action || '-'}</span> },
    { key: 'entityType', label: 'Entity Type', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{row.entityType || row.resource || '-'}</span>
    )},
    { key: 'ipAddress', label: 'IP Address', render: (row: any) => <span className="font-mono text-xs">{row.ipAddress || row.ip || '-'}</span> },
    { key: 'expand', label: '', render: (row: any) => (
      <button
        onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === row.id ? null : row.id); }}
        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {expandedRow === row.id ? 'Collapse' : 'Details'}
      </button>
    )},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all admin actions and changes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Logs" value={data.total || logs.length} icon={<Shield size="20" />} color="indigo" />
          <KPICard title="Today" value={logs.filter((l: any) => {
            const d = new Date(l.createdAt || l.timestamp);
            return d.toDateString() === new Date().toDateString();
          }).length} color="blue" />
          <KPICard title="Last 7 Days" value={logs.filter((l: any) => {
            const d = new Date(l.createdAt || l.timestamp);
            return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          }).length} color="green" />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-48">
            <Search size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="SUSPEND">Suspend</option>
            <option value="ACTIVATE">Activate</option>
            <option value="TERMINATE">Terminate</option>
            <option value="IMPERSONATE">Impersonate</option>
            <option value="FAILED_LOGIN">Failed Login</option>
            <option value="PASSWORD_CHANGE">Password Change</option>
            <option value="PROFILE_UPDATE">Profile Update</option>
          </select>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Entities</option>
            <option value="SuperAdmin">Super Admin</option>
            <option value="Channel">Channel</option>
            <option value="Account">Account / Operator</option>
            <option value="Passenger">Passenger</option>
            <option value="CustomRole">Custom Role</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="To"
          />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <div className="space-y-2">
            <DataTable columns={columns} data={logs} emptyMessage="No audit logs found" />
            {expandedRow && logs.find((l: any) => l.id === expandedRow) && (
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                 <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Log Details</h4>
                 <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto">
                  {JSON.stringify(logs.find((l: any) => l.id === expandedRow), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
