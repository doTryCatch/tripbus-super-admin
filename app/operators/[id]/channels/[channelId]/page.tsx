'use client';

import AdminLayout from '../../../../(admin)/layout';
import {
  ArrowLeft, ChevronRight, Users, Bus, UserCheck, Briefcase, Route, DollarSign,
  Ban, CheckCircle2, Pencil, CreditCard, TrendingUp, BarChart3,
  Activity, CalendarDays, X,
} from 'lucide-react';
import Link from 'next/link';
import TabLayout from '@/components/TabLayout';
import StatusBadge from '@/components/StatusBadge';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function OperatorChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canSuspend = isSuperAdmin || hasAction('channels', 'suspend');
  const canUpdate = isSuperAdmin || hasAction('channels', 'update');

  const fetchChannel = useCallback(() => {
    const operatorId = params.id;
    const channelId = params.channelId;
    if (operatorId && channelId) {
      apiClient.get(`/super-admin/operators/${operatorId}/channels/${channelId}/details`)
        .then((res) => setChannel(res.data.data || res.data))
        .catch(err => setError(err.response?.data?.message || 'Failed to load channel'))
        .finally(() => setLoading(false));
    }
  }, [params.id, params.channelId]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  // Lazy-load analytics when the analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && params.channelId && !analyticsData && !analyticsLoading) {
      setAnalyticsLoading(true);
      apiClient.get(`/super-admin/channels/${params.channelId}/analytics`)
        .then((res) => setAnalyticsData(res.data.data || res.data))
        .catch(() => toast.error('Failed to load analytics data'))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab, params.channelId, analyticsData, analyticsLoading]);

  // Channel actions
  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      if (action === 'suspend') {
        const reason = prompt('Enter reason for suspension:');
        if (!reason) { setActionLoading(false); return; }
        await apiClient.patch(`/super-admin/channels/${params.channelId}/suspend`, { reason });
        toast.success('Channel suspended successfully');
      } else if (action === 'activate') {
        await apiClient.patch(`/super-admin/channels/${params.channelId}/activate`);
        toast.success('Channel activated successfully');
      }
      fetchChannel();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({
      companyName: channel.companyName || '',
      plan: channel.plan || 'FREE',
      contactEmail: channel.contactEmail || '',
      contactPhone: channel.contactPhone || '',
      address: channel.address || '',
      maxBuses: channel.maxBuses || 10,
      maxTripsPerDay: channel.maxTripsPerDay || 50,
      maxStaff: channel.maxStaff || 20,
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/super-admin/channels/${params.channelId}`, editForm);
      toast.success('Channel updated successfully');
      setEditing(false);
      fetchChannel();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update channel');
    } finally {
      setSaving(false);
    }
  };

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
  if (!channel) return <AdminLayout><div className="p-6 text-center text-gray-500 dark:text-gray-400">Channel not found</div></AdminLayout>;

  const rc = channel.resourceCounts || {};
  const fs = channel.financialSummary || {};
  const maxBuses = channel.maxBuses || 10;
  const maxTripsPerDay = channel.maxTripsPerDay || 50;
  const maxStaff = channel.maxStaff || 20;
  const opCtx = channel.operatorContext || {};

  // ─── Breadcrumb ────────────────────────────────────────────────
  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link href="/operators" className="hover:text-indigo-600 transition-colors">Operators</Link>
      <ChevronRight size="14" />
      <Link
        href={`/operators/${params.id}`}
        className="hover:text-indigo-600 transition-colors truncate max-w-[200px]"
      >
        {opCtx.operatorName || 'Operator'}
      </Link>
      <ChevronRight size="14" />
      <span className="text-gray-900 font-medium truncate max-w-[200px]">
        {channel.companyName}
      </span>
    </nav>
  );

  // ─── Overview Tab ──────────────────────────────────────────────
  const overviewContent = (
    <div className="space-y-6">
      {/* Channel Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Channel Actions</h3>
        <div className="flex flex-wrap gap-3">
          {canSuspend && (channel.status === 'ACTIVE' ? (
            <button
              onClick={() => handleAction('suspend')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
            >
              <Ban size="16" /> Suspend Channel
            </button>
          ) : (
            <button
              onClick={() => handleAction('activate')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 size="16" /> Activate Channel
            </button>
          ))}
          {canUpdate && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Pencil size="16" /> Edit Channel
            </button>
          )}
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Operators" value={rc.operators || 0} icon={<Users size="20" />} color="indigo" />
        <KPICard title="Buses" value={rc.buses || 0} icon={<Bus size="20" />} color="blue" />
        <KPICard title="Drivers" value={rc.drivers || 0} icon={<UserCheck size="20" />} color="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Staff" value={rc.staff || 0} icon={<Briefcase size="20" />} color="purple" />
        <KPICard title="Routes" value={rc.routes || 0} icon={<Route size="20" />} color="amber" />
        <KPICard title="Total Revenue" value={`Rs. ${(fs.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign size="20" />} color="green" />
      </div>

      {/* Channel Information */}
      {editing ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Channel Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
              <input value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800">
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
              <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
              <input value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Buses</label>
              <input type="number" value={editForm.maxBuses} onChange={(e) => setEditForm({ ...editForm, maxBuses: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Trips/Day</label>
              <input type="number" value={editForm.maxTripsPerDay} onChange={(e) => setEditForm({ ...editForm, maxTripsPerDay: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Staff</label>
              <input type="number" value={editForm.maxStaff} onChange={(e) => setEditForm({ ...editForm, maxStaff: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" />
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
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Channel Information</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-gray-500 dark:text-gray-400">Company Name</dt><dd className="font-medium mt-1">{channel.companyName}</dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="mt-1"><StatusBadge status={channel.status || 'ACTIVE'} /></dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Plan</dt><dd className="mt-1"><StatusBadge status={channel.plan || 'FREE'} /></dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Max Buses</dt><dd className="font-medium mt-1">{maxBuses}</dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Max Trips/Day</dt><dd className="font-medium mt-1">{maxTripsPerDay}</dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Max Staff</dt><dd className="font-medium mt-1">{maxStaff}</dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Contact Email</dt><dd className="font-medium mt-1">{channel.contactEmail || 'N/A'}</dd></div>
          <div><dt className="text-gray-500 dark:text-gray-400">Created</dt><dd className="font-medium mt-1">{new Date(channel.createdAt).toLocaleDateString()}</dd></div>
        </dl>
      </div>
      )}
    </div>
  );

  // ─── Resources Tab ─────────────────────────────────────────────
  const resourceCards = [
    { title: 'Operators', count: rc.operators || 0, quota: null, color: 'indigo' as const, icon: <Users size="20" /> },
    { title: 'Buses', count: rc.buses || 0, quota: maxBuses, color: 'blue' as const, icon: <Bus size="20" /> },
    { title: 'Drivers', count: rc.drivers || 0, quota: null, color: 'green' as const, icon: <UserCheck size="20" /> },
    { title: 'Staff', count: rc.staff || 0, quota: maxStaff, color: 'purple' as const, icon: <Briefcase size="20" /> },
    { title: 'Routes', count: rc.routes || 0, quota: null, color: 'amber' as const, icon: <Route size="20" /> },
  ];

  const resourcesContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resourceCards.map((card) => (
          <div key={card.title} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{card.count.toLocaleString()}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                card.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                card.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                card.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                card.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {card.icon}
              </div>
            </div>
            {card.quota !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{card.count} / {card.quota} used</span>
                  <span>{Math.min(Math.round((card.count / card.quota) * 100), 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (card.count / card.quota) >= 0.9 ? 'bg-red-500' : (card.count / card.quota) >= 0.7 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min((card.count / card.quota) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quota Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quota Usage Summary</h3>
        <div className="space-y-4">
          {[
            { icon: <Bus size="14" />, label: 'Buses', count: rc.buses || 0, max: maxBuses, color: 'bg-blue-500' },
            { icon: <Activity size="14" />, label: 'Trips / Day', count: rc.tripsToday || rc.trips || 0, max: maxTripsPerDay, color: 'bg-indigo-500' },
            { icon: <Briefcase size="14" />, label: 'Staff', count: rc.staff || 0, max: maxStaff, color: 'bg-purple-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 flex items-center gap-2">{item.icon} {item.label}</span>
                <span className="font-medium">{item.count} / {item.max}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    item.count / item.max >= 0.9 ? 'bg-red-500' : item.count / item.max >= 0.7 ? 'bg-amber-500' : item.color
                  }`}
                  style={{ width: `${Math.min((item.count / item.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Financials Tab ─────────────────────────────────────────────
  const financialsContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`Rs. ${(fs.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign size="20" />} color="green" change={fs.revenueGrowth} changeLabel="vs last period" />
        <KPICard title="Today's Revenue" value={`Rs. ${(fs.todayRevenue || 0).toLocaleString()}`} icon={<TrendingUp size="20" />} color="blue" />
        <KPICard title="This Week" value={`Rs. ${(fs.weekRevenue || 0).toLocaleString()}`} icon={<CalendarDays size="20" />} color="indigo" />
        <KPICard title="This Month" value={`Rs. ${(fs.monthRevenue || 0).toLocaleString()}`} icon={<BarChart3 size="20" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Month" subtitle="Monthly revenue trend">
          {(fs.revenueByMonth || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fs.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No revenue data available</div>
          )}
        </ChartCard>

        <ChartCard title="Payment Method Breakdown" subtitle="Revenue by payment type">
          {(fs.paymentBreakdown || []).length > 0 ? (
            <div className="space-y-4 pt-2">
              {(fs.paymentBreakdown || []).map((pm: any, index: number) => {
                const total = (fs.paymentBreakdown || []).reduce((sum: number, p: any) => sum + (p.amount || p.revenue || 0), 0);
                const amount = pm.amount || pm.revenue || 0;
                const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-blue-500', 'bg-purple-500'];
                return (
                  <div key={pm.method || pm.name || index}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <CreditCard size="14" className="text-gray-400" />
                        <span className="font-medium text-gray-700">{pm.method || pm.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{percentage}%</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${colors[index % colors.length]}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No payment data available</div>
          )}
        </ChartCard>
      </div>
    </div>
  );

  // ─── Analytics Tab ─────────────────────────────────────────────
  const an = analyticsData || {};
  const analyticsContent = (
    <div className="space-y-6">
      {analyticsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Trips" value={an.totalTrips || 0} icon={<Activity size="20" />} color="blue" change={an.tripsGrowth} changeLabel="vs last period" />
            <KPICard title="Completion Rate" value={`${an.completionRate || 0}%`} icon={<CheckCircle2 size="20" />} color="green" />
            <KPICard title="Avg Occupancy" value={`${an.avgOccupancy || 0}%`} icon={<Users size="20" />} color="indigo" />
            <KPICard title="Total Bookings" value={an.totalBookings || 0} icon={<BarChart3 size="20" />} color="purple" change={an.bookingsGrowth} changeLabel="vs last period" />
          </div>

          <ChartCard title="Trip Trends" subtitle="Daily trip volume">
            {(an.tripTrends || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={an.tripTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="trips" stroke="#4f46e5" strokeWidth={2} dot={false} name="Trips" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No trip trend data available</div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview', content: overviewContent },
    { key: 'resources', label: 'Resources', content: resourcesContent },
    { key: 'financials', label: 'Financials', content: financialsContent },
    { key: 'analytics', label: 'Analytics', content: analyticsContent },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {breadcrumb}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/operators/${params.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400">
            <ArrowLeft size="20" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{channel.companyName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Channel details &middot; Operator: {opCtx.operatorName || 'Unknown'}</p>
          </div>
          <div className="flex items-center gap-3">
            {canSuspend && (channel.status === 'ACTIVE' ? (
              <button onClick={() => handleAction('suspend')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors">
                <Ban size="14" /> Suspend
              </button>
            ) : (
              <button onClick={() => handleAction('activate')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition-colors">
                <CheckCircle2 size="14" /> Activate
              </button>
            ))}
            <StatusBadge status={channel.status || 'ACTIVE'} />
          </div>
        </div>

        <TabLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdminLayout>
  );
}
