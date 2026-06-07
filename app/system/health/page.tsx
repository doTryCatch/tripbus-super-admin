'use client';

import AdminLayout from '../../(admin)/layout';
import { Database, Wifi, HardDrive, Server } from 'lucide-react';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import ChartCard from '@/components/ChartCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/super-admin/system/health').then(res => res.data.data || res.data).catch(() => null),
      apiClient.get('/super-admin/system/db-stats').then(res => res.data.data || res.data).catch(() => null),
    ]).then(([h, d]) => {
      if (!h && !d) {
        setError('Failed to load system health data');
      } else {
        setHealth(h);
        setDbStats(d);
      }
    }).catch(() => setError('Failed to load system health data'))
    .finally(() => setLoading(false));
  }, []);

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

  const tables = dbStats?.tables || [];

  const tableColumns = [
    { key: 'name', label: 'Table', render: (row: any) => <span className="font-mono font-medium">{row.name || row.tableName || '-'}</span> },
    { key: 'rows', label: 'Rows', render: (row: any) => (row.rows || row.rowCount || 0).toLocaleString() },
    { key: 'size', label: 'Size', render: (row: any) => row.size || row.totalSize || '-' },
    { key: 'indexSize', label: 'Index Size', render: (row: any) => row.indexSize || '-' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Health</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor system infrastructure status</p>
        </div>

        {loading ? <LoadingSkeleton rows={4} /> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Status */}
              <ChartCard title="Database">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database size="20" className="text-gray-500" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      health?.database?.status === 'connected' || health?.database === 'connected'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {health?.database?.status || health?.database || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server size="20" className="text-gray-500" />
                      <span className="text-sm font-medium">Latency</span>
                    </div>
                    <span className="text-sm font-medium">{health?.database?.latency || health?.dbLatency || 'N/A'}ms</span>
                  </div>
                </div>
              </ChartCard>

              {/* Redis Status */}
              <ChartCard title="Redis Cache">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wifi size="20" className="text-gray-500" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      health?.redis?.status === 'connected' || health?.redis === 'connected'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {health?.redis?.status || health?.redis || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HardDrive size="20" className="text-gray-500" />
                      <span className="text-sm font-medium">Memory Used</span>
                    </div>
                    <span className="text-sm font-medium">{health?.redis?.memory || health?.redisMemory || 'N/A'}</span>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Table Sizes */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Database Tables</h3>
              <DataTable columns={tableColumns} data={tables} emptyMessage="No table statistics available" />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
