'use client';

import AdminLayout from '../(admin)/layout';
import { FileBarChart, Download, Calendar } from 'lucide-react';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FilterBar, { FilterConfig } from '@/components/FilterBar';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';
import apiClient from '@/lib/api-client';

const reportTemplates = [
  { id: 'revenue', name: 'Revenue Report', description: 'Total revenue, breakdown by channel, payment methods', icon: '💰' },
  { id: 'trips', name: 'Trip Report', description: 'Trips completed, cancelled, occupancy rates', icon: '🚌' },
  { id: 'bookings', name: 'Booking Report', description: 'Bookings volume, conversion rates, funnel analysis', icon: '🎫' },
  { id: 'passengers', name: 'Passenger Report', description: 'Passenger growth, spending patterns, demographics', icon: '👥' },
  { id: 'fleet', name: 'Fleet Utilization Report', description: 'Bus utilization, maintenance schedules, downtime', icon: '🚛' },
  { id: 'staff', name: 'Staff Report', description: 'Attendance, performance, payroll summary', icon: '👔' },
  { id: 'integrations', name: 'Integration Report', description: 'API usage, error rates, partner performance', icon: '🔗' },
  { id: 'audit', name: 'Audit Report', description: 'Admin actions, login history, system changes', icon: '📋' },
];

export default function ReportsPage() {
  const [channels, setChannels] = useState<{value: string, label: string}[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    dateRange: {},
    channelId: '',
  });
  const [exporting, setExporting] = useState<string | null>(null);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canExport = isSuperAdmin || hasAction('reports', 'create');

  // Fetch channels for dropdown
  useEffect(() => {
    apiClient.get('/super-admin/channels').then(res => {
      const chs = (res.data.data?.data || res.data.data || res.data || []);
      setChannels(chs.map((c: any) => ({ value: c.id, label: c.companyName || 'Unknown' })));
    }).catch(() => {});
  }, []);

  const handleExport = async (reportId: string, format: string) => {
    setExporting(reportId);
    try {
      const params = new URLSearchParams();
      const dateRange = filterValues.dateRange || {};
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to) params.set('to', dateRange.to);
      if (filterValues.channelId) params.set('channelId', filterValues.channelId);
      params.set('format', format);
      await new Promise(r => setTimeout(r, 1000)); // Simulate export
      toast.success(`${reportId} report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const filters: FilterConfig[] = [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'channelId', type: 'select', label: 'Channel', placeholder: 'All Channels', options: channels },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Report Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and export platform reports</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} values={filterValues} onChange={setFilterValues} />

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{report.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{report.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                </div>
              </div>
              {canExport && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(report.id, 'csv')}
                  disabled={exporting === report.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                >
                  <Download size="12" /> CSV
                </button>
                <button
                  onClick={() => handleExport(report.id, 'xlsx')}
                  disabled={exporting === report.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                >
                  <Download size="12" /> Excel
                </button>
              </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
