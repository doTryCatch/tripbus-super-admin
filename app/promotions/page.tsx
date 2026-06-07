'use client';

import AdminLayout from '../(admin)/layout';
import { Tag, Plus, Pencil, Trash2, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function PromotionsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    discountType: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    channelId: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('promotions', 'create');
  const canUpdate = isSuperAdmin || hasAction('promotions', 'update');
  const canDelete = isSuperAdmin || hasAction('promotions', 'delete');

  // Fetch channels
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
    if (filterValues.discountType) params.set('discountType', filterValues.discountType);

    setLoading(true);
    apiClient.get(`/super-admin/promotions?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load promotions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterValues.search, filterValues.status, filterValues.discountType]);

  const openCreateModal = () => {
    setEditingPromo(null);
    setForm({ code: '', channelId: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' });
    setShowModal(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code || '',
      channelId: promo.channelId || '',
      discountType: promo.discountType || 'percentage',
      discountValue: String(promo.discountValue || promo.value || ''),
      maxUses: String(promo.maxUsageTotal || promo.maxUses || ''),
      expiresAt: promo.validTo ? new Date(promo.validTo).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.channelId || !form.discountValue) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code,
        channelId: form.channelId,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editingPromo) {
        await apiClient.put(`/super-admin/promotions/${editingPromo.id}`, payload);
        toast.success('Promotion updated successfully');
      } else {
        await apiClient.post('/super-admin/promotions', payload);
        toast.success('Promotion created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/super-admin/promotions/${id}`);
      toast.success('Promotion deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete promotion');
    }
  };

  const promotions = data.data || data || (Array.isArray(data) ? data : []);

  const promotionFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search promotions...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'EXPIRED', label: 'Expired' },
      { value: 'USED', label: 'Used' },
    ]},
    { key: 'discountType', type: 'select', label: 'Discount Type', placeholder: 'All Types', options: [
      { value: 'PERCENTAGE', label: 'Percentage' },
      { value: 'FIXED', label: 'Fixed Amount' },
    ]},
  ];

  const columns = [
    { key: 'code', label: 'Code', render: (row: any) => <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{row.code || '-'}</span> },
    { key: 'channel', label: 'Channel', render: (row: any) => row.channel?.companyName || row.channelName || 'Global' },
    { key: 'discountType', label: 'Discount Type', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{(row.discountType || 'percentage').toUpperCase()}</span>
    )},
    { key: 'value', label: 'Value', render: (row: any) => {
      const type = row.discountType || 'percentage';
      const val = row.discountValue || row.value || 0;
      return type === 'fixed' ? `Rs. ${val}` : `${val}%`;
    }},
    { key: 'usedCount', label: 'Used Count', render: (row: any) => (row.usedCount || row.usageCount || 0).toLocaleString() },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'expiresAt', label: 'Expires', render: (row: any) => {
      const d = row.validTo || row.expiresAt;
      return d ? new Date(d).toLocaleDateString() : 'No expiry';
    }},
    { key: 'actions', label: '', render: (row: any) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {canUpdate && (
          <button onClick={() => openEditModal(row)} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
            <Pencil size="14" />
          </button>
        )}
        {canDelete && (
          <button onClick={() => setDeleteConfirm(row.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 size="14" />
          </button>
        )}
      </div>
    )},
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Promotions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage promotional codes and discounts</p>
          </div>
          {canCreate && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Create Promotion
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Promotions" value={Array.isArray(promotions) ? promotions.length : 0} icon={<Tag size="20" />} color="indigo" />
          <KPICard title="Active" value={promotions.filter((p: any) => p.isActive !== false).length} color="green" />
          <KPICard title="Total Uses" value={promotions.reduce((sum: number, p: any) => sum + (p.usedCount || p.usageCount || 0), 0).toLocaleString()} color="blue" />
        </div>

        <FilterBar filters={promotionFilters} values={filterValues} onChange={setFilterValues} />

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={promotions} emptyMessage="No promotions found" />
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg space-y-4 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size="20" />
              </button>
              <h3 className="font-semibold text-lg">{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 font-mono" placeholder="SUMMER2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel *</label>
                <select value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="">Select a channel...</option>
                  {channels.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type *</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value *</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires At</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? (editingPromo ? 'Saving...' : 'Creating...') : (editingPromo ? 'Save Changes' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm space-y-4">
              <h3 className="font-semibold text-lg">Delete Promotion</h3>
              <p className="text-sm text-gray-600">Are you sure you want to delete this promotion? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
