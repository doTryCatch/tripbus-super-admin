'use client';

import AdminLayout from '../../(admin)/layout';
import { ArrowLeft, Key, Globe, FileText, Shield } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import TabLayout from '@/components/TabLayout';
import DataTable from '@/components/DataTable';
import KPICard from '@/components/KPICard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      apiClient.get(`/super-admin/integrations/${params.id}`)
        .then((res) => setIntegration(res.data.data || res.data))
        .catch(err => setError(err.response?.data?.message || 'Failed to load integration'))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleRegenerateKey = async () => {
    if (!confirm('Regenerate API key? The current key will stop working.')) return;
    try {
      await apiClient.post(`/super-admin/integrations/${params.id}/regenerate-key`);
      toast.success('API key regenerated');
      const res = await apiClient.get(`/super-admin/integrations/${params.id}`);
      setIntegration(res.data.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to regenerate key');
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
  if (!integration) return <AdminLayout><div className="p-6 text-center text-gray-500 dark:text-gray-400">Integration not found</div></AdminLayout>;

  const apiKeys = integration.apiKeys || [];
  const webhooks = integration.webhooks || [];
  const bookings = integration.bookings || [];
  const auditLogs = integration.auditLogs || [];

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Partner Information</h3>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><dt className="text-gray-500 dark:text-gray-400">Name</dt><dd className="font-medium mt-1">{integration.name || integration.partnerName}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Channel</dt><dd className="font-medium mt-1">{integration.channel?.companyName || integration.channelName || '-'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="mt-1"><StatusBadge status={integration.status || 'ACTIVE'} /></dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">API Calls</dt><dd className="font-medium mt-1">{(integration.apiCalls || 0).toLocaleString()}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Bookings</dt><dd className="font-medium mt-1">{(integration.bookings?.length || integration.totalBookings || 0).toLocaleString()}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Revenue</dt><dd className="font-medium mt-1">Rs. {(integration.revenue || 0).toLocaleString()}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">Created</dt><dd className="font-medium mt-1">{new Date(integration.createdAt).toLocaleDateString()}</dd></div>
            </dl>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="API Calls" value={(integration.apiCalls || 0).toLocaleString()} icon={<Globe size="20" />} color="blue" />
            <KPICard title="Bookings" value={(integration.totalBookings || 0).toLocaleString()} icon={<FileText size="20" />} color="green" />
            <KPICard title="Revenue" value={`Rs. ${(integration.revenue || 0).toLocaleString()}`} color="indigo" />
          </div>
        </div>
      ),
    },
    {
      key: 'api-keys',
      label: 'API Keys',
      content: (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">API Keys</h3>
            <button onClick={handleRegenerateKey} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
              <Key size="14" /> Regenerate Key
            </button>
          </div>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-gray-500">No API keys configured</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-mono">{key.key || key.token || '••••••••'}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {new Date(key.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={key.active !== false ? 'ACTIVE' : 'EXPIRED'} />
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'webhooks',
      label: 'Webhooks',
      content: (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Webhook Configuration</h3>
          {webhooks.length === 0 ? (
            <p className="text-sm text-gray-500">No webhooks configured</p>
          ) : (
            <DataTable
              columns={[
                { key: 'url', label: 'URL', render: (row: any) => <span className="font-mono text-xs">{row.url}</span> },
                { key: 'events', label: 'Events', render: (row: any) => (row.events || []).join(', ') },
                { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} /> },
              ]}
              data={webhooks}
              emptyMessage="No webhooks"
            />
          )}
        </div>
      ),
    },
    {
      key: 'bookings',
      label: 'Bookings',
      content: (
        <DataTable
          columns={[
            { key: 'id', label: 'ID', render: (row: any) => row.id?.substring(0, 8) + '...' },
            { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'CONFIRMED'} /> },
            { key: 'amount', label: 'Amount', render: (row: any) => `Rs. ${(row.amount || 0).toLocaleString()}` },
            { key: 'date', label: 'Date', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
          ]}
          data={bookings}
          emptyMessage="No bookings from this integration"
        />
      ),
    },
    {
      key: 'audit',
      label: 'Audit',
      content: (
        <DataTable
          columns={[
            { key: 'action', label: 'Action', render: (row: any) => row.action || '-' },
            { key: 'ip', label: 'IP', render: (row: any) => row.ip || '-' },
            { key: 'timestamp', label: 'Time', render: (row: any) => new Date(row.createdAt || Date.now()).toLocaleString() },
          ]}
          data={auditLogs}
          emptyMessage="No audit logs"
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/integrations')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400">
            <ArrowLeft size="20" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{integration.name || integration.partnerName || 'Integration'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Partner details and configuration</p>
          </div>
          <StatusBadge status={integration.status || 'ACTIVE'} />
        </div>
        <TabLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdminLayout>
  );
}
