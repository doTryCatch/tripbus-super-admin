'use client';

import AdminLayout from '../../(admin)/layout';
import {
  ArrowLeft, UserX, Trash2, Pencil, Copy, Download,
  CheckCircle, XCircle, Clock, CreditCard, RotateCcw,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import KPICard from '@/components/KPICard';
import TabLayout from '@/components/TabLayout';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function PassengerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canSuspend = isSuperAdmin || hasAction('passengers', 'suspend');
  const canDelete = isSuperAdmin || hasAction('passengers', 'delete');
  const canUpdate = isSuperAdmin || hasAction('passengers', 'update');

  // Booking logs state
  const [activeTab, setActiveTab] = useState('profile');
  const [logsData, setLogsData] = useState<any>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [channels, setChannels] = useState<{ value: string; label: string }[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // All hooks are before any early returns
  useEffect(() => {
    if (params.id) {
      apiClient.get(`/super-admin/passengers/${params.id}`)
        .then((res) => setPassenger(res.data.data || res.data))
        .catch(err => setError(err.response?.data?.message || 'Failed to load passenger'))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  // Fetch channels for filter
  useEffect(() => {
    apiClient.get('/super-admin/channels')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const list = Array.isArray(data) ? data : data?.data || [];
        setChannels(list.map((ch: any) => ({ value: ch.id, label: ch.companyName || ch.name || ch.id })));
      })
      .catch(() => {});
  }, []);

  // Fetch booking logs
  const fetchLogs = useCallback(async (filters?: Record<string, any>) => {
    if (!params.id) return;
    setLogsLoading(true);
    try {
      const paramsObj: Record<string, string> = {};
      const f = filters || filterValues;
      if (f.status) paramsObj.status = f.status;
      if (f.paymentStatus) paramsObj.paymentStatus = f.paymentStatus;
      if (f.channelId) paramsObj.channelId = f.channelId;
      if (f.dateRange?.from) paramsObj.dateFrom = f.dateRange.from;
      if (f.dateRange?.to) paramsObj.dateTo = f.dateRange.to;

      const res = await apiClient.get(`/super-admin/passengers/${params.id}/booking-logs`, { params: paramsObj });
      setLogsData(res.data?.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load booking logs');
    } finally {
      setLogsLoading(false);
    }
  }, [params.id, filterValues]);

  useEffect(() => {
    if (activeTab === 'logs' && params.id) {
      fetchLogs();
    }
  }, [activeTab, params.id, fetchLogs]);

  const handleAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} this passenger?`)) return;
    setActionLoading(true);
    try {
      if (action === 'suspend') {
        await apiClient.patch(`/super-admin/passengers/${params.id}/suspend`);
        toast.success('Passenger suspended');
      } else if (action === 'delete') {
        await apiClient.delete(`/super-admin/passengers/${params.id}`);
        toast.success('Passenger deleted (GDPR)');
        router.push('/passengers');
        return;
      }
      const res = await apiClient.get(`/super-admin/passengers/${params.id}`);
      setPassenger(res.data.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({
      firstName: passenger.firstName || '',
      lastName: passenger.lastName || '',
      phone: passenger.phone || '',
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/super-admin/passengers/${params.id}`, editForm);
      toast.success('Passenger updated successfully');
      setEditing(false);
      const res = await apiClient.get(`/super-admin/passengers/${params.id}`);
      setPassenger(res.data.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update passenger');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (passenger?.id) {
      navigator.clipboard.writeText(passenger.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    if (!logsData?.logs?.length) return;
    const headers = ['Date/Time', 'Booking ID', 'Route', 'Trip Date', 'Channel', 'Amount', 'Payment Method', 'Payment Status', 'Booking Status', 'Seat Numbers'];
    const rows = logsData.logs.map((log: any) => [
      log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
      log.bookingId || '',
      log.route || '',
      log.tripDate || '',
      log.channelName || '',
      log.amount || 0,
      log.paymentMethod || '',
      log.paymentStatus || '',
      log.bookingStatus || '',
      log.seatNumbers || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passenger-${passenger?.id?.substring(0, 8)}-booking-logs.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleFilterChange = (values: Record<string, any>) => {
    setFilterValues(values);
    fetchLogs(values);
  };

  // ─── Early returns (after all hooks) ──────────────────────────
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
  if (!passenger) return <AdminLayout><div className="p-6 text-center text-gray-500 dark:text-gray-400">Passenger not found</div></AdminLayout>;

  const name = passenger.name || `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.email || 'Unknown';
  const summary = logsData?.summary || {};
  const logs = logsData?.logs || [];

  // Filter configs for booking logs
  const logFilters: FilterConfig[] = [
    {
      key: 'dateRange',
      type: 'dateRange',
      label: 'Date Range',
      placeholder: 'Select dates',
    },
    {
      key: 'paymentStatus',
      type: 'select',
      label: 'Payment Status',
      placeholder: 'All Payment',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
    {
      key: 'status',
      type: 'select',
      label: 'Booking Status',
      placeholder: 'All Status',
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'channelId',
      type: 'select',
      label: 'Channel',
      placeholder: 'All Channels',
      options: channels,
    },
  ];

  // ─── Profile Tab Content ──────────────────────────────────────
  const profileContent = (
    <div className="space-y-6">
      {/* Actions */}
      {(canSuspend || canDelete || canUpdate) && (
        <div className="flex gap-3">
          {canSuspend && (
            <button
              onClick={() => handleAction('suspend')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
            >
              <UserX size="16" /> Suspend
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleAction('delete')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
            >
              <Trash2 size="16" /> Delete (GDPR)
            </button>
          )}
          {canUpdate && (
            <button
              onClick={startEdit}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50"
            >
              <Pencil size="16" /> Edit
            </button>
          )}
        </div>
      )}

      {/* Profile Card */}
      {editing ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Information</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-gray-500 dark:text-gray-400">Name</dt><dd className="font-medium mt-1">{name}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Email</dt><dd className="font-medium mt-1">{passenger.email}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Phone</dt><dd className="font-medium mt-1">{passenger.phone || 'N/A'}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Registered</dt><dd className="font-medium mt-1">{new Date(passenger.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </div>
      )}

      {/* Spending Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Bookings" value={passenger.totalBookings || 0} color="blue" />
        <KPICard title="Total Spent" value={`Rs. ${(passenger.totalSpent || 0).toLocaleString()}`} color="green" />
        <KPICard title="Avg Booking Value" value={`Rs. ${passenger.totalSpent && passenger.totalBookings ? Math.round(passenger.totalSpent / passenger.totalBookings).toLocaleString() : 0}`} color="indigo" />
      </div>
    </div>
  );

  // ─── Booking Logs Tab Content ─────────────────────────────────
  const logsContent = (
    <div className="space-y-6">
      {/* Quick Info Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger ID</span>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
              <code className="text-sm font-mono text-gray-800">{passenger.id?.substring(0, 8)}...</code>
              <button
                onClick={handleCopyId}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title="Copy full ID"
              >
                {copied ? <CheckCircle size="14" className="text-green-500" /> : <Copy size="14" className="text-gray-400" />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Age</span>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{summary.accountAge || '-'}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</span>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{summary.totalBookings ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Booking</span>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{summary.lastBookingDate || '-'}</p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Bookings"
          value={summary.totalBookings ?? 0}
          color="indigo"
          icon={<CreditCard size="20" />}
        />
        <KPICard
          title="Successful"
          value={summary.successfulPayments ?? 0}
          color="green"
          icon={<CheckCircle size="20" />}
        />
        <KPICard
          title="Failed"
          value={summary.failedPayments ?? 0}
          color="red"
          icon={<XCircle size="20" />}
        />
        <KPICard
          title="Pending"
          value={summary.pendingPayments ?? 0}
          color="amber"
          icon={<Clock size="20" />}
        />
        <KPICard
          title="Total Paid"
          value={`Rs. ${(summary.totalAmountPaid ?? 0).toLocaleString()}`}
          color="green"
          icon={<CreditCard size="20" />}
        />
        <KPICard
          title="Total Refunded"
          value={`Rs. ${(summary.totalRefunded ?? 0).toLocaleString()}`}
          color="red"
          icon={<RotateCcw size="20" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FilterBar
          filters={logFilters}
          values={filterValues}
          onChange={handleFilterChange}
        />
      </div>

      {/* Export + Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {logsLoading ? 'Loading...' : `${logsData?.total ?? logs.length} log entries`}
        </p>
        <button
          onClick={handleExportCSV}
          disabled={!logs.length}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size="16" /> Export Logs
        </button>
      </div>

      {/* Logs Table */}
      {logsLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No booking logs found</td>
                  </tr>
                ) : (
                  logs.map((log: any) => {
                    const isExpanded = expandedRows.has(log.id);
                    const hasError = log.errorMessage || (log.paymentStatus === 'FAILED' || log.bookingStatus === 'CANCELLED');
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {log.bookingId?.length > 12 ? log.bookingId.substring(0, 12) + '...' : log.bookingId || '-'}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                          {log.route || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {log.tripDate || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.channelName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          Rs. {(log.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <PaymentMethodBadge method={log.paymentMethod} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={log.paymentStatus || 'UNKNOWN'} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={log.bookingStatus || 'UNKNOWN'} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {hasError ? (
                            <button
                              onClick={() => toggleRow(log.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              {isExpanded ? 'Collapse' : 'Details'}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Expandable details */}
          {logs.filter((log: any) => expandedRows.has(log.id)).map((log: any) => (
            <div key={`${log.id}-detail`} className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                {log.seatNumbers && (
                  <div><span className="text-gray-500">Seats:</span> <span className="font-medium">{log.seatNumbers}</span></div>
                )}
                {log.busName && (
                  <div><span className="text-gray-500">Bus:</span> <span className="font-medium">{log.busName}</span></div>
                )}
                {log.refundAmount != null && (
                  <div><span className="text-gray-500">Refund:</span> <span className="font-medium text-red-600">Rs. {log.refundAmount.toLocaleString()}</span></div>
                )}
                {log.isManualBooking && (
                  <div><span className="text-gray-500">Manual Booking:</span> <span className="font-medium text-amber-600">Yes</span></div>
                )}
              </div>
              {log.errorMessage && (
                <div className="mb-3">
                  <span className="text-red-600 text-sm font-medium">Error: </span>
                  <span className="text-red-500 text-sm">{log.errorMessage}</span>
                </div>
              )}
              {log.metadata && Object.keys(log.metadata).some((k) => log.metadata[k] !== null) && (
                <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto max-h-40">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Tabs ─────────────────────────────────────────────────────
  const tabs = [
    { key: 'profile', label: 'Profile', content: profileContent },
    { key: 'logs', label: 'Booking & Payment Logs', content: logsContent },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/passengers')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400">
            <ArrowLeft size="20" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{passenger.email}</p>
          </div>
          <StatusBadge status={passenger.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} />
        </div>

        {/* Tabbed Content */}
        <TabLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdminLayout>
  );
}

// ─── Payment Method Badge ───────────────────────────────────────
function PaymentMethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-gray-400 text-xs">-</span>;

  const styles: Record<string, string> = {
    esewa: 'bg-green-50 text-green-700 border-green-200',
    khalti: 'bg-purple-50 text-purple-700 border-purple-200',
    cash: 'bg-amber-50 text-amber-700 border-amber-200',
    bank: 'bg-blue-50 text-blue-700 border-blue-200',
    card: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    online: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  const s = styles[method.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s}`}>
      {method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}
    </span>
  );
}
