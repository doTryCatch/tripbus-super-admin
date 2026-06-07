'use client';

import AdminLayout from '../../(admin)/layout';
import { Users, Plus, Shield, KeyRound } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function TeamPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'SUPPORT', customRoleId: '' });
  const [roleType, setRoleType] = useState<'system' | 'custom'>('system');
  const { hasAction, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasAction('team', 'create');
  const canSuspend = isSuperAdmin || hasAction('team', 'suspend');

  const fetchTeam = useCallback(async () => {
    try {
      const res = await apiClient.get('/super-admin/team');
      setData(res.data.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiClient.get('/super-admin/roles');
      setCustomRoles(res.data.data || res.data || []);
    } catch {
      // Roles fetch failure shouldn't block the page
    }
  }, []);

  useEffect(() => {
    fetchTeam();
    fetchRoles();
  }, [fetchTeam, fetchRoles]);

  const team = data.data || data || (Array.isArray(data) ? data : []);

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

  const handleCreate = async () => {
    try {
      const payload: any = {
        name: newMember.name,
        email: newMember.email,
        password: newMember.password,
        role: roleType === 'system' ? newMember.role : 'SUPPORT',
      };
      if (roleType === 'custom' && newMember.customRoleId) {
        payload.customRoleId = newMember.customRoleId;
      }
      await apiClient.post('/super-admin/team', payload);
      toast.success('Team member created');
      setShowCreateModal(false);
      setNewMember({ name: '', email: '', password: '', role: 'SUPPORT', customRoleId: '' });
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create member');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.put(`/super-admin/team/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'Deactivated' : 'Activated');
      fetchTeam();
    } catch {
      toast.error('Failed to update');
    }
  };

  const getRoleDisplay = (row: any) => {
    if (row.role === 'SUPER_ADMIN') return { label: 'Super Admin', color: 'bg-purple-50 text-purple-700' };
    if (row.customRoleId) {
      const cr = customRoles.find((r: any) => r.id === row.customRoleId);
      return { label: cr?.name || 'Custom Role', color: 'bg-blue-50 text-blue-700' };
    }
    if (row.role === 'SUPPORT') return { label: 'Support', color: 'bg-amber-50 text-amber-700' };
    return { label: row.role || 'Member', color: 'bg-gray-50 text-gray-700' };
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name || '-'}</span> },
    { key: 'email', label: 'Email', render: (row: any) => row.email },
    { key: 'role', label: 'Role', render: (row: any) => {
      const rd = getRoleDisplay(row);
      return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rd.color}`}>{rd.label}</span>;
    }},
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} /> },
    { key: 'lastLogin', label: 'Last Login', render: (row: any) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never' },
    { key: 'actions', label: '', render: (row: any) => canSuspend ? (
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id, row.isActive); }}
        className={`text-xs ${row.isActive !== false ? 'text-red-600 hover:underline' : 'text-emerald-600 hover:underline'}`}
      >
        {row.isActive !== false ? 'Deactivate' : 'Activate'}
      </button>
    ) : null },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage super admin team members</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus size="16" /> Add Member
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Members" value={data.total || team.length} icon={<Users size="20" />} color="indigo" />
          <KPICard title="Active" value={team.filter((m: any) => m.isActive !== false).length} color="green" />
          <KPICard title="Admins" value={team.filter((m: any) => m.role === 'SUPER_ADMIN').length} icon={<Shield size="20" />} color="blue" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={team} emptyMessage="No team members" />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-semibold text-lg">Add Team Member</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input type="password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
              </div>

              {/* Role Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role Type</label>
                <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setRoleType('system')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      roleType === 'system' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    System Role
                  </button>
                  <button
                    onClick={() => setRoleType('custom')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      roleType === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Custom Role
                  </button>
                </div>
              </div>

              {roleType === 'system' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Role</label>
                  <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                    <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                    <option value="SUPPORT">Support</option>
                    <option value="READ_ONLY">Read Only</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Role</label>
                  {customRoles.length > 0 ? (
                    <select
                      value={newMember.customRoleId}
                      onChange={(e) => setNewMember({ ...newMember, customRoleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800"
                    >
                      <option value="">Select a role...</option>
                      {customRoles.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.pagesCount || 0} pages)</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
                      <KeyRound size="14" />
                      No custom roles created yet. <a href="/settings/roles" className="underline font-medium">Create one</a>
                    </div>
                  )}
                </div>
              )}

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
