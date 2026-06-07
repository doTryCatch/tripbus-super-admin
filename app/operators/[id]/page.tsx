'use client';

import AdminLayout from '../../(admin)/layout';
import { ArrowLeft, UserCheck, UserX, KeyRound, Eye, Building2, Users, Bus, DollarSign, TrendingUp, Crown } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasAction, isSuperAdmin } = usePermissions();
  const canSuspend = isSuperAdmin || hasAction('operators', 'suspend');
  const canUpdate = isSuperAdmin || hasAction('operators', 'update');
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  useEffect(() => {
    if (params.id) {
      apiClient.get(`/super-admin/operators/${params.id}`)
        .then((res) => setOperator(res.data.data || res.data))
        .catch(err => setError(err.response?.data?.message || 'Failed to load operator'))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      if (action === 'activate') {
        await apiClient.patch(`/super-admin/operators/${params.id}/activate`);
        toast.success('Operator activated successfully');
      } else if (action === 'deactivate') {
        await apiClient.patch(`/super-admin/operators/${params.id}/deactivate`);
        toast.success('Operator deactivated successfully');
      } else if (action === 'reset-password') {
        await apiClient.post(`/super-admin/operators/${params.id}/reset-password`);
        toast.success('Password reset email sent');
      } else if (action === 'impersonate') {
        const res = await apiClient.post(`/super-admin/operators/${params.id}/impersonate`);
        const token = res.data?.data?.token || res.data?.token;
        if (token) {
          window.open(`/impersonate?token=${token}`, '_blank');
          toast.success('Impersonation session started');
        }
      }
      // Refresh data
      const res = await apiClient.get(`/super-admin/operators/${params.id}`);
      setOperator(res.data.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // All hooks MUST be called before any early returns
  const name = operator?.name || `${operator?.firstName || ''} ${operator?.lastName || ''}`.trim() || 'Unknown';
  const channels: any[] = operator?.channelsWithStats || operator?.channels || operator?.channelMemberships || [];

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    let result = channels;
    const search = filterValues.search?.toLowerCase() || '';
    if (search) {
      result = result.filter((ch: any) =>
        (ch.companyName || '').toLowerCase().includes(search) ||
        (ch.status || '').toLowerCase().includes(search) ||
        (ch.plan || '').toLowerCase().includes(search)
      );
    }
    const status = filterValues.status;
    if (status) {
      result = result.filter((ch: any) => (ch.status || '').toUpperCase() === status.toUpperCase());
    }
    return result;
  }, [channels, filterValues]);

  const channelFilters: FilterConfig[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search channels...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'All Statuses', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'SUSPENDED', label: 'Suspended' },
      { value: 'TERMINATED', label: 'Terminated' },
      { value: 'TRIAL', label: 'Trial' },
    ]},
  ];

  const getPlanColor = (plan: string) => {
    switch ((plan || '').toUpperCase()) {
      case 'ENTERPRISE': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'PROFESSIONAL': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'STARTER': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  // Early returns AFTER all hooks
  if (loading) return <AdminLayout><LoadingSkeleton /></AdminLayout>;
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
  if (!operator) return <AdminLayout><div className="p-6 text-center text-gray-500 dark:text-gray-400">Operator not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/operators')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400">
            <ArrowLeft size="20" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{operator.email}</p>
          </div>
          <StatusBadge status={operator.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} />
        </div>

        {/* Actions */}
        {(canSuspend || canUpdate) && (
        <div className="flex gap-3">
          {canSuspend && (operator.isActive !== false ? (
            <button
              onClick={() => handleAction('deactivate')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
            >
              <UserX size="16" /> Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleAction('activate')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
            >
              <UserCheck size="16" /> Activate
            </button>
          ))}
          {canUpdate && (
            <button
              onClick={() => handleAction('reset-password')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
            >
              <KeyRound size="16" /> Reset Password
            </button>
          )}
          {canUpdate && (
            <button
              onClick={() => handleAction('impersonate')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50"
            >
              <Eye size="16" /> Impersonate
            </button>
          )}
        </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Information</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-gray-500 dark:text-gray-400">Full Name</dt><dd className="font-medium mt-1">{name}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Email</dt><dd className="font-medium mt-1">{operator.email}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Phone</dt><dd className="font-medium mt-1">{operator.phone || 'N/A'}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Role</dt><dd className="font-medium mt-1">{operator.role || 'OPERATOR'}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="mt-1"><StatusBadge status={operator.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} /></dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Last Login</dt><dd className="font-medium mt-1">{operator.lastLoginAt ? new Date(operator.lastLoginAt).toLocaleString() : 'Never'}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Channels</dt><dd className="font-medium mt-1">{channels.length}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Created</dt><dd className="font-medium mt-1">{new Date(operator.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </div>

        {/* Channel Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Associated Channels</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{channels.length} channel(s)</span>
          </div>

          <div className="mb-4">
            <FilterBar
              filters={channelFilters}
              values={filterValues}
              onChange={setFilterValues}
            />
          </div>

          {filteredChannels.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Building2 size="40" className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No channels associated with this operator</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map((ch: any) => {
                const stats = ch.stats || {};
                return (
                  <div
                    key={ch.id}
                    onClick={() => router.push(`/operators/${params.id}/channels/${ch.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {ch.companyName || 'Unnamed Channel'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPlanColor(ch.plan)}`}>
                          {ch.plan || 'FREE'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <StatusBadge status={ch.status || 'ACTIVE'} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Users size="14" className="text-gray-400 dark:text-gray-500" />
                        <span>{stats.operatorsCount || 0} operators</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Bus size="14" className="text-gray-400 dark:text-gray-500" />
                        <span>{stats.busesCount || 0} buses</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <DollarSign size="14" className="text-gray-400 dark:text-gray-500" />
                        <span>Rs. {(stats.revenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <TrendingUp size="14" className="text-gray-400 dark:text-gray-500" />
                        <span>{stats.tripsCount || 0} trips</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                      Created {ch.createdAt ? new Date(ch.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
