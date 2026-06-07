'use client';

import AdminLayout from '../../(admin)/layout';
import { Bus } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function TripExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/super-admin/reports/trips')
      .then(() => {})
      .catch(err => setError(err.response?.data?.message || 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingSkeleton rows={6} /></AdminLayout>;

  if (error) return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Explorer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse and explore all trips</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <Bus size="40" className="mx-auto text-amber-500 mb-3" />
          <p className="text-amber-700 font-medium">Trip listing coming soon</p>
          <p className="text-sm text-amber-600 mt-1">The trip explorer endpoint is not yet available. Please check back later.</p>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Explorer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse and explore all trips</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <Bus size="40" className="mx-auto text-amber-500 mb-3" />
          <p className="text-amber-700 font-medium">Trip listing coming soon</p>
          <p className="text-sm text-amber-600 mt-1">The trip explorer feature is under development.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
