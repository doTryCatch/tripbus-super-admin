'use client';

import AdminLayout from '../../(admin)/layout';
import { Briefcase, DollarSign } from 'lucide-react';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalaryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    channelId: '',
    role: '',
  });

  // Fetch channels for dropdown
  useEffect(() => {
    apiClient.get('/super-admin/channels').then(res => {
      const chs = (res.data.data?.data || res.data.data || res.data || []);
      setChannels(chs.map((c: any) => ({ value: c.id, label: c.companyName || 'Unknown' })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterValues.channelId) params.set('channelId', filterValues.channelId);
    if (filterValues.role) params.set('role', filterValues.role);
    apiClient.get(`/super-admin/salary?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load salary data'))
      .finally(() => setLoading(false));
  }, [filterValues.channelId, filterValues.role]);

  const filters: FilterConfig[] = [
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
    { key: 'role', type: 'select', label: 'Role', placeholder: 'All Roles', options: [
      { value: 'DRIVERS', label: 'Drivers' },
      { value: 'STAFF', label: 'Staff' },
    ]},
  ];

  if (error && !data) return (
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

  const summary = data?.summary || {};
  const byChannel = data?.byChannel || [];
  const byRole = data?.byRole || [];

  const totalPayroll = summary.totalPayroll || byChannel.reduce((sum: number, c: any) => sum + (c.totalSalary || 0), 0);
  const totalEmployees = summary.totalEmployees || byChannel.reduce((sum: number, c: any) => sum + (c.employees || 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0;

  const channelColumns = [
    { key: 'channel', label: 'Channel', render: (row: any) => <span className="font-medium">{row.channelName || row.channel?.companyName || '-'}</span> },
    { key: 'employees', label: 'Employees', render: (row: any) => (row.employees || 0).toLocaleString() },
    { key: 'totalSalary', label: 'Total Payroll', render: (row: any) => `Rs. ${(row.totalSalary || 0).toLocaleString()}` },
    { key: 'avgSalary', label: 'Avg Salary', render: (row: any) => `Rs. ${Math.round(row.avgSalary || 0).toLocaleString()}` },
  ];

  const roleColumns = [
    { key: 'role', label: 'Role', render: (row: any) => <span className="font-medium">{row.role || '-'}</span> },
    { key: 'count', label: 'Count', render: (row: any) => (row.count || 0).toLocaleString() },
    { key: 'avgSalary', label: 'Avg Salary', render: (row: any) => `Rs. ${Math.round(row.avgSalary || 0).toLocaleString()}` },
    { key: 'minSalary', label: 'Min', render: (row: any) => `Rs. ${Math.round(row.minSalary || 0).toLocaleString()}` },
    { key: 'maxSalary', label: 'Max', render: (row: any) => `Rs. ${Math.round(row.maxSalary || 0).toLocaleString()}` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Salary Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Salary distribution and payroll insights</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Payroll" value={`Rs. ${totalPayroll.toLocaleString()}`} icon={<DollarSign size="20" />} color="green" />
          <KPICard title="Total Employees" value={totalEmployees.toLocaleString()} icon={<Briefcase size="20" />} color="blue" />
          <KPICard title="Avg Salary" value={`Rs. ${avgSalary.toLocaleString()}`} color="indigo" />
        </div>

        <ChartCard title="Salary by Channel" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="channelName" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSalary" fill="#4f46e5" name="Total Payroll" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Per-Channel Distribution</h3>
          {loading ? <LoadingSkeleton /> : (
            <DataTable columns={channelColumns} data={byChannel} emptyMessage="No salary data" />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Role-wise Comparison</h3>
          {loading ? <LoadingSkeleton /> : (
            <DataTable columns={roleColumns} data={byRole} emptyMessage="No role data" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
