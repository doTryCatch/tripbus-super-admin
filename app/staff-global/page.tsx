'use client';

import AdminLayout from '../(admin)/layout';
import { UserCog, Plus, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import TabLayout from '@/components/TabLayout';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function StaffGlobalPage() {
  const [data, setData] = useState<any>({ drivers: { data: [], total: 0 }, staff: { data: [], total: 0 }, totalAll: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    channelId: '',
    state: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', type: 'staff', channelId: '' });
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('staff', 'create');

  // Fetch channels for filter and modal
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
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    if (filterValues.state) params.set('state', filterValues.state);
    if (activeTab !== 'all') params.set('type', activeTab);

    setLoading(true);
    apiClient.get(`/super-admin/staff-global?${params.toString()}`)
      .then((res) => {
        const raw = res.data.data || res.data;
        setData(raw);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterValues.search, filterValues.channelId, filterValues.state, activeTab]);

  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.channelId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await apiClient.post('/super-admin/staff-global', newStaff);
      toast.success(`${newStaff.type === 'driver' ? 'Driver' : 'Staff'} created successfully`);
      setShowCreateModal(false);
      setNewStaff({ name: '', phone: '', type: 'staff', channelId: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

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

  const drivers = Array.isArray(data?.drivers?.data) ? data.drivers.data : [];
  const staffOnly = Array.isArray(data?.staff?.data) ? data.staff.data : [];
  const allStaff = [...drivers.map((d: any) => ({ ...d, type: 'DRIVER' })), ...staffOnly.map((s: any) => ({ ...s, type: s.staffType || 'STAFF' }))];

  const staffFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search staff...' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels.map((c: any) => ({ value: c.id, label: c.companyName })) },
    { key: 'state', type: 'select', label: 'State', placeholder: 'All States', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'on_leave', label: 'On Leave' },
    ]},
  ];

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => (
      <span className="font-medium">{row.driverName || row.staffName || row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim()}</span>
    )},
    { key: 'type', label: 'Type', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{row.type || row.role || 'STAFF'}</span>
    )},
    { key: 'channel', label: 'Channel', render: (row: any) => row.channel?.companyName || row.channelName || '-' },
    { key: 'state', label: 'State', render: (row: any) => row.driverState || row.staffState || row.state || row.status || '-' },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phoneNumber || row.phone || '-' },
    { key: 'rating', label: 'Rating', render: (row: any) => { const r = Number(row.averageRating || row.rating); return !isNaN(r) && r > 0 ? `⭐ ${r.toFixed(1)}` : '-' }},
  ];

  const tabs = [
    { key: 'all', label: `All (${allStaff.length})`, content: (
      <DataTable columns={columns} data={allStaff} loading={loading} emptyMessage="No staff found" />
    )},
    { key: 'drivers', label: `Drivers (${drivers.length})`, content: (
      <DataTable columns={columns} data={drivers} loading={loading} emptyMessage="No drivers found" />
    )},
    { key: 'staff', label: `Staff (${staffOnly.length})`, content: (
      <DataTable columns={columns} data={staffOnly} loading={loading} emptyMessage="No staff found" />
    )},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff (Global)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All drivers and staff across all channels</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Add Staff
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Staff" value={data.totalAll || allStaff.length} icon={<UserCog size="20" />} color="purple" />
          <KPICard title="Drivers" value={data.drivers?.total || drivers.length} color="blue" />
          <KPICard title="Other Staff" value={data.staff?.total || staffOnly.length} color="green" />
        </div>

        <FilterBar filters={staffFilters} values={filterValues} onChange={setFilterValues} />

        {loading ? <LoadingSkeleton /> : (
          <TabLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Create Staff Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-4 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size="20" />
              </button>
              <h3 className="font-semibold text-lg">Add Staff</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                <input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select value={newStaff.type} onChange={(e) => setNewStaff({ ...newStaff, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="staff">Staff</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel *</label>
                <select value={newStaff.channelId} onChange={(e) => setNewStaff({ ...newStaff, channelId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="">Select a channel...</option>
                  {channels.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button onClick={handleCreateStaff} disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
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
