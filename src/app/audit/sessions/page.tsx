'use client';

import AdminLayout from '../../(admin)/layout';
import { Monitor, Smartphone } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function SessionsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasAction, isSuperAdmin } = usePermissions();
  const canDelete = isSuperAdmin || hasAction('sessions', 'delete');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    status: '',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterValues.status) params.set('status', filterValues.status);
    apiClient.get(`/super-admin/audit-logs/sessions?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [filterValues.status]);

  const sessions = data.data || data || (Array.isArray(data) ? data : []);

  const filters: FilterConfig[] = [
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'EXPIRED', label: 'Expired' },
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

  const activeSessions = sessions.filter((s: any) => s.isActive !== false);
  const stats = data.stats || {};

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Revoke this session?')) return;
    try {
      await apiClient.delete(`/super-admin/audit-logs/sessions/${sessionId}`);
      toast.success('Session revoked');
      setData((prev: any) => ({
        ...prev,
        data: (prev.data || prev).filter((s: any) => s.id !== sessionId),
      }));
    } catch (err: any) {
      toast.error('Failed to revoke session');
    }
  };

  const columns = [
    { key: 'user', label: 'User', render: (row: any) => <span className="font-medium">{row.user?.name || row.userName || '-'}</span> },
    { key: 'device', label: 'Device', render: (row: any) => {
      const ua = row.userAgent || '';
      const isMobile = ua.includes('Mobile') || ua.includes('Android');
      return (
        <div className="flex items-center gap-2">
          {isMobile ? <Smartphone size="14" /> : <Monitor size="14" />}
          <span className="text-xs">{isMobile ? 'Mobile' : 'Desktop'}</span>
        </div>
      );
    }},
    { key: 'ip', label: 'IP', render: (row: any) => <span className="font-mono text-xs">{row.ipAddress || row.ip || '-'}</span> },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'EXPIRED'} /> },
    { key: 'lastActivity', label: 'Last Activity', render: (row: any) => new Date(row.lastActivity || row.updatedAt || row.createdAt).toLocaleString() },
    { key: 'actions', label: '', render: (row: any) => (row.isActive !== false && canDelete) ? (
      <button
        onClick={(e) => { e.stopPropagation(); handleRevoke(row.id); }}
        className="text-xs text-red-600 hover:underline"
      >
        Revoke
      </button>
    ) : null },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sessions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active sessions management</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Active Sessions" value={activeSessions.length} icon={<Monitor size="20" />} color="indigo" />
          <KPICard title="Total Sessions" value={data.total || sessions.length} color="blue" />
          <KPICard title="Unique Users" value={[...new Set(sessions.map((s: any) => s.userId || s.user?.id))].filter(Boolean).length} color="green" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={sessions} emptyMessage="No sessions found" />
        )}
      </div>
    </AdminLayout>
  );
}
