'use client';

import AdminLayout from '../../(admin)/layout';
import { Briefcase } from 'lucide-react';
import DataTable from '@/components/DataTable';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PayrollPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    channelId: '',
    month: '',
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
    if (filterValues.month) params.set('month', filterValues.month);
    apiClient.get(`/super-admin/salary?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load payroll data'))
      .finally(() => setLoading(false));
  }, [filterValues.channelId, filterValues.month]);

  // Compute current month default for the month input
  const currentMonth = new Date().toISOString().slice(0, 7);

  const filters: FilterConfig[] = [
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
    { key: 'month', type: 'select', label: 'Month', placeholder: 'Select Month', options: (() => {
      const opts: {value: string, label: string}[] = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        opts.push({ value: val, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
      }
      return opts;
    })() },
  ];

  if (loading && !data) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

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

  const byChannel = data?.byChannel || [];
  const summary = data?.summary || {};
  const totalPayroll = summary.totalPayroll || byChannel.reduce((sum: number, c: any) => sum + (c.totalSalary || c.payroll || 0), 0);
  const totalEmployees = summary.totalEmployees || byChannel.reduce((sum: number, c: any) => sum + (c.employees || c.staffCount || 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0;

  const columns = [
    { key: 'channel', label: 'Channel', render: (row: any) => <span className="font-medium">{row.channelName || row.channel?.companyName || '-'}</span> },
    { key: 'employees', label: 'Employees', render: (row: any) => (row.employees || row.staffCount || 0).toLocaleString() },
    { key: 'totalSalary', label: 'Total Payroll', render: (row: any) => `Rs. ${(row.totalSalary || row.payroll || 0).toLocaleString()}` },
    { key: 'avgSalary', label: 'Avg Salary', render: (row: any) => {
      const avg = row.avgSalary || (row.totalSalary && row.employees ? row.totalSalary / row.employees : 0);
      return `Rs. ${Math.round(avg).toLocaleString()}`;
    }},
    { key: 'drivers', label: 'Drivers', render: (row: any) => row.drivers || 0 },
    { key: 'staff', label: 'Other Staff', render: (row: any) => row.staff || row.otherStaff || 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Salary distribution across channels</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Payroll" value={`Rs. ${totalPayroll.toLocaleString()}`} icon={<Briefcase size="20" />} color="indigo" />
          <KPICard title="Total Employees" value={totalEmployees.toLocaleString()} color="blue" />
          <KPICard title="Avg Salary" value={`Rs. ${avgSalary.toLocaleString()}`} color="green" />
        </div>

        <ChartCard title="Payroll by Channel" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="channelName" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="totalSalary" fill="#4f46e5" name="Total Payroll" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {loading ? <LoadingSkeleton /> : (
          <DataTable columns={columns} data={byChannel} emptyMessage="No payroll data available" />
        )}
      </div>
    </AdminLayout>
  );
}
