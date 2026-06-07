'use client';

import AdminLayout from '../../(admin)/layout';
import { ToggleLeft, Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function FeatureFlagsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', type: 'boolean', description: '' });
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('features', 'create');
  const canToggle = isSuperAdmin || hasAction('features', 'update');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    status: '',
    type: '',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.type) params.set('type', filterValues.type);
    apiClient.get(`/super-admin/feature-flags?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load feature flags'))
      .finally(() => setLoading(false));
  }, [filterValues.status, filterValues.type]);

  const flags = data.data || data || (Array.isArray(data) ? data : []);

  const filters: FilterConfig[] = [
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ]},
    { key: 'type', type: 'select', label: 'Type', placeholder: 'All Types', options: [
      { value: 'boolean', label: 'Boolean' },
      { value: 'string', label: 'String' },
      { value: 'number', label: 'Number' },
      { value: 'json', label: 'JSON' },
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

  const handleToggle = async (flagId: string, currentActive: boolean) => {
    try {
      await apiClient.patch(`/super-admin/feature-flags/${flagId}/toggle`);
      toast.success(`Flag ${!currentActive ? 'enabled' : 'disabled'}`);
      setData((prev: any) => ({
        ...prev,
        data: (prev.data || prev).map((f: any) =>
          f.id === flagId ? { ...f, isActive: !currentActive } : f
        ),
      }));
    } catch (err: any) {
      toast.error('Failed to toggle flag');
    }
  };

  const handleCreate = async () => {
    try {
      await apiClient.post('/super-admin/feature-flags', newFlag);
      toast.success('Feature flag created');
      setShowCreateModal(false);
      setNewFlag({ key: '', name: '', type: 'boolean', description: '' });
      const res = await apiClient.get('/super-admin/feature-flags');
      setData(res.data.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create flag');
    }
  };

  const columns = [
    { key: 'key', label: 'Key', render: (row: any) => <span className="font-mono text-xs">{row.key || '-'}</span> },
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name || '-'}</span> },
    { key: 'type', label: 'Type', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{row.type || 'boolean'}</span>
    )},
    { key: 'scope', label: 'Scope', render: (row: any) => (
      <span className="text-xs">{row.isGlobal ? 'Global' : row.channelId ? 'Channel' : 'Global'}</span>
    )},
    { key: 'active', label: 'Active', render: (row: any) => canToggle ? (
      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(row.id, row.isActive); }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row.isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${row.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
      </button>
    ) : (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feature Flags</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage feature toggles and rollouts</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Create Flag
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Flags" value={data.total || flags.length} icon={<ToggleLeft size="20" />} color="indigo" />
          <KPICard title="Active" value={flags.filter((f: any) => f.isActive).length} color="green" />
          <KPICard title="Inactive" value={flags.filter((f: any) => !f.isActive).length} color="red" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={flags} emptyMessage="No feature flags" />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-semibold text-lg">Create Feature Flag</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key *</label>
                <input value={newFlag.key} onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="e.g. new_booking_flow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={newFlag.name} onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="e.g. New Booking Flow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select value={newFlag.type} onChange={(e) => setNewFlag({ ...newFlag, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={newFlag.description} onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
