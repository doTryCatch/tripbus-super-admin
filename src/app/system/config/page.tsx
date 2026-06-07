'use client';

import AdminLayout from '../../(admin)/layout';
import { Settings, Save } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { usePermissions } from '@/context/AuthContext';

export default function PlatformConfigPage() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { hasAction, isSuperAdmin } = usePermissions();
  const canUpdate = isSuperAdmin || hasAction('system', 'update');

  useEffect(() => {
    apiClient.get('/super-admin/system/config')
      .then((res) => setConfig(res.data.data || res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load configuration'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/super-admin/system/config', config);
      toast.success('Configuration saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

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

  const entries = Object.entries(config).filter(([_, v]) => typeof v !== 'object' || v === null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Platform Configuration</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform-wide settings</p>
          </div>
          {canUpdate && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size="16" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No configuration keys available</p>
            ) : (
              entries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-64 text-sm font-medium text-gray-700 flex-shrink-0">{key}</label>
                  {typeof value === 'boolean' ? (
                    <button
                      onClick={() => handleChange(key, !value)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </button>
                  ) : (
                    <input
                      type={typeof value === 'number' ? 'number' : 'text'}
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(key, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* JSON Editor for nested config */}
        {Object.entries(config).some(([_, v]) => typeof v === 'object' && v !== null) && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Advanced Configuration</h3>
            <textarea
              value={JSON.stringify(
                Object.fromEntries(Object.entries(config).filter(([_, v]) => typeof v === 'object' && v !== null)),
                null, 2
              )}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig((prev: any) => ({ ...prev, ...parsed }));
                } catch {}
              }}
              className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
