'use client';

import AdminLayout from '../(admin)/layout';
import { Users, Search, Plus, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function OperatorsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    channelId: '',
    role: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOperator, setNewOperator] = useState({ name: '', email: '', phone: '', password: '', role: 'OPERATOR' });
  const router = useRouter();
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('operators', 'create');

  // Fetch channels for filter dropdown
  useEffect(() => {
    apiClient.get('/super-admin/channels?limit=100')
      .then((res) => {
        const ch = res.data.data?.data || res.data.data || [];
        setChannels(ch);
      })
      .catch(() => {});
  }, []);

  const fetchData = () => {
    const params = new URLSearchParams();
    if (filterValues.search) params.set('search', filterValues.search);
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    if (filterValues.role) params.set('role', filterValues.role);

    setLoading(true);
    apiClient.get(`/super-admin/operators?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load operators'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterValues.search, filterValues.status, filterValues.channelId, filterValues.role]);

  const handleCreateOperator = async () => {
    if (!newOperator.name || !newOperator.email || !newOperator.phone || !newOperator.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await apiClient.post('/super-admin/operators', newOperator);
      toast.success('Operator created successfully');
      setShowCreateModal(false);
      setNewOperator({ name: '', email: '', phone: '', password: '', role: 'OPERATOR' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create operator');
    } finally {
      setCreating(false);
    }
  };

  const operators = data.data || data || [];

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

  const channelOptions = channels.map((c: any) => ({
    value: c.id,
    label: c.companyName,
  }));

  const operatorFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search operators...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Suspended' },
    ]},
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channelOptions },
    { key: 'role', type: 'select', label: 'Role', placeholder: 'All Roles', options: [
      { value: 'OPERATOR', label: 'Operator' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'STAFF', label: 'Staff' },
    ]},
  ];

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => (
      <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">{row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim()}</span>
    )},
    { key: 'email', label: 'Email', render: (row: any) => row.email },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '-' },
    { key: 'role', label: 'Role', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{row.role || 'OPERATOR'}</span>
    )},
    { key: 'channels', label: 'Channels', render: (row: any) => {
      const ch = row.channels || row.channelMemberships || [];
      return ch.length > 0
        ? ch.map((c: any) => c.channel?.companyName || c.companyName || c.name || 'N/A').join(', ')
        : '-';
    }},
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} /> },
    { key: 'lastLogin', label: 'Last Login', render: (row: any) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Operators</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All operator accounts across the platform</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Add Operator
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Operators" value={data.total || operators.length} icon={<Users size="20" />} color="indigo" />
          <KPICard title="Active" value={operators.filter((o: any) => o.isActive !== false).length} color="green" />
          <KPICard title="Suspended" value={operators.filter((o: any) => o.isActive === false).length} color="red" />
        </div>

        <FilterBar
          filters={operatorFilters}
          values={filterValues}
          onChange={setFilterValues}
        />

        {loading ? <LoadingSkeleton /> : (
          <DataTable
            columns={columns}
            data={operators}
            onRowClick={(row) => router.push(`/operators/${row.id}`)}
            emptyMessage="No operators found"
          />
        )}

        {/* Create Operator Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-4 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size="20" />
              </button>
              <h3 className="font-semibold text-lg">Add Operator</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={newOperator.name} onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={newOperator.email} onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                <input value={newOperator.phone} onChange={(e) => setNewOperator({ ...newOperator, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input type="password" value={newOperator.password} onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={newOperator.role} onChange={(e) => setNewOperator({ ...newOperator, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button onClick={handleCreateOperator} disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
