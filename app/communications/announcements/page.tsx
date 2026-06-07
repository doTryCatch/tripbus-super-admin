'use client';

import AdminLayout from '../../(admin)/layout';
import { Megaphone, Plus, Pencil, Trash2, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function AnnouncementsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    targetAudience: 'ALL_OPERATORS',
    targetChannelIds: [] as string[],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('announcements', 'create');
  const canUpdate = isSuperAdmin || hasAction('announcements', 'update');
  const canDelete = isSuperAdmin || hasAction('announcements', 'delete');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    status: '',
    published: '',
  });

  // Fetch channels for modal
  useEffect(() => {
    apiClient.get('/super-admin/channels?limit=100')
      .then((res) => {
        const ch = res.data.data?.data || res.data.data || [];
        setChannels(ch);
      })
      .catch(() => {});
  }, []);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.published) params.set('published', filterValues.published);
    apiClient.get(`/super-admin/announcements?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterValues.status, filterValues.published]);

  const announcements = data.data || data || (Array.isArray(data) ? data : []);

  const filters: FilterConfig[] = [
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PENDING', label: 'Pending' },
    ]},
    { key: 'published', type: 'select', label: 'Published', placeholder: 'All', options: [
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'DRAFT', label: 'Draft' },
    ]},
  ];

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ title: '', body: '', targetAudience: 'ALL_OPERATORS', targetChannelIds: [] });
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      body: item.body || '',
      targetAudience: item.targetAudience || 'ALL_OPERATORS',
      targetChannelIds: item.targetChannelIds || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        body: form.body,
        targetAudience: form.targetAudience,
      };
      if (form.targetAudience === 'SPECIFIC_CHANNELS') {
        payload.targetChannelIds = form.targetChannelIds;
      }
      if (editingItem) {
        await apiClient.put(`/super-admin/announcements/${editingItem.id}`, payload);
        toast.success('Announcement updated');
      } else {
        await apiClient.post('/super-admin/announcements', payload);
        toast.success('Announcement created');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/super-admin/announcements/${id}`);
      toast.success('Announcement deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      await apiClient.patch(`/super-admin/announcements/${id}/toggle-publish`);
      toast.success(published ? 'Unpublished' : 'Published');
      fetchData();
    } catch {
      toast.error('Failed to update');
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

  const columns = [
    { key: 'title', label: 'Title', render: (row: any) => <span className="font-medium">{row.title || '-'}</span> },
    { key: 'target', label: 'Target', render: (row: any) => (
      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{row.targetAudience || row.target || 'ALL'}</span>
    )},
    { key: 'published', label: 'Published', render: (row: any) => canUpdate ? (
      <button
        onClick={(e) => { e.stopPropagation(); handleTogglePublish(row.id, row.isPublished); }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row.isPublished ? 'bg-emerald-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${row.isPublished ? 'translate-x-4.5' : 'translate-x-1'}`} />
      </button>
    ) : (
      <StatusBadge status={row.isPublished ? 'ACTIVE' : 'PENDING'} />
    )},
    { key: 'createdAt', label: 'Created', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.isPublished ? 'ACTIVE' : 'PENDING'} /> },
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform announcements</p>
          </div>
          {canCreate && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> New Announcement
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total" value={Array.isArray(announcements) ? announcements.length : 0} icon={<Megaphone size="20" />} color="indigo" />
          <KPICard title="Published" value={announcements.filter((a: any) => a.isPublished).length} color="green" />
          <KPICard title="Drafts" value={announcements.filter((a: any) => !a.isPublished).length} color="amber" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={announcements} emptyMessage="No announcements" />
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg space-y-4 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size="20" />
              </button>
              <h3 className="font-semibold text-lg">{editingItem ? 'Edit Announcement' : 'New Announcement'}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" placeholder="Announcement title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 resize-none" placeholder="Announcement content..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                  <option value="ALL_OPERATORS">All Operators</option>
                  <option value="ALL_PASSENGERS">All Passengers</option>
                  <option value="ALL_STAFF">All Staff</option>
                  <option value="SPECIFIC_CHANNELS">Specific Channels</option>
                </select>
              </div>
              {form.targetAudience === 'SPECIFIC_CHANNELS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Channels</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {channels.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={form.targetChannelIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, targetChannelIds: [...form.targetChannelIds, c.id] });
                            } else {
                              setForm({ ...form, targetChannelIds: form.targetChannelIds.filter((id) => id !== c.id) });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        {c.companyName}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? (editingItem ? 'Saving...' : 'Creating...') : (editingItem ? 'Save Changes' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm space-y-4">
              <h3 className="font-semibold text-lg">Delete Announcement</h3>
              <p className="text-sm text-gray-600">Are you sure you want to delete this announcement? This action cannot be undone.</p>
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
