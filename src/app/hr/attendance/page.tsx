'use client';

import AdminLayout from '../../(admin)/layout';
import { Calendar, UserCheck, UserX, Clock } from 'lucide-react';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

export default function AttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    channelId: '',
    staffType: '',
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
    if (filterValues.staffType) params.set('staffType', filterValues.staffType);
    apiClient.get(`/super-admin/attendance?${params.toString()}`)
      .then((res) => setData(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load attendance data'))
      .finally(() => setLoading(false));
  }, [filterValues.channelId, filterValues.staffType]);

  const handleMonthChange = useCallback((month: number, year: number) => {
    setCalendarMonth(month);
    setCalendarYear(year);
  }, []);

  const filters: FilterConfig[] = [
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
    { key: 'staffType', type: 'select', label: 'Staff Type', placeholder: 'All Types', options: [
      { value: 'DRIVERS', label: 'Drivers' },
      { value: 'STAFF', label: 'Staff' },
    ]},
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

  const summary = data?.summary || {};
  const byChannel = data?.byChannel || [];

  const presentRate = summary.total ? Math.round((summary.present / summary.total) * 100) : 0;
  const absentRate = summary.total ? Math.round((summary.absent / summary.total) * 100) : 0;
  const leaveRate = summary.total ? Math.round((summary.onLeave / summary.total) * 100) : 0;

  const columns = [
    { key: 'channel', label: 'Channel', render: (row: any) => <span className="font-medium">{row.channelName || row.channel?.companyName || '-'}</span> },
    { key: 'total', label: 'Total Staff', render: (row: any) => (row.total || 0).toLocaleString() },
    { key: 'present', label: 'Present', render: (row: any) => (row.present || 0).toLocaleString() },
    { key: 'absent', label: 'Absent', render: (row: any) => (row.absent || 0).toLocaleString() },
    { key: 'onLeave', label: 'On Leave', render: (row: any) => (row.onLeave || 0).toLocaleString() },
    { key: 'rate', label: 'Attendance Rate', render: (row: any) => {
      const rate = row.total ? Math.round((row.present / row.total) * 100) : 0;
      return <span className={`font-medium ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>;
    }},
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Staff attendance tracking and analytics across all channels</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Present Rate" value={`${presentRate}%`} icon={<UserCheck size="20" />} color="green" />
          <KPICard title="Absent Rate" value={`${absentRate}%`} icon={<UserX size="20" />} color="red" />
          <KPICard title="On Leave" value={`${leaveRate}%`} icon={<Clock size="20" />} color="amber" />
          <KPICard title="Total Staff" value={(summary.total || 0).toLocaleString()} icon={<Calendar size="20" />} color="indigo" />
        </div>

        {/* Attendance Calendar */}
        <AttendanceCalendar
          month={calendarMonth}
          year={calendarYear}
          onMonthChange={handleMonthChange}
        />

        {/* Per-Channel Table */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Per-Channel Attendance</h3>
          {loading ? <LoadingSkeleton /> : (
            <DataTable columns={columns} data={byChannel} emptyMessage="No attendance data" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
