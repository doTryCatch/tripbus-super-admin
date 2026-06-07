'use client';

import AdminLayout from '../../(admin)/layout';
import { Building2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function CreateChannelPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', plan: 'FREE', contactEmail: '', contactPhone: '', address: '', maxBuses: 10, maxTripsPerDay: 50, maxStaff: 20, ownerName: '', ownerEmail: '', ownerPhone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/super-admin/channels', form);
      router.push('/channels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create channel');
    }
    finally { setLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/channels')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-400"><ArrowLeft size="20" /></button>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Channel</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new transport company</p></div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600">{error}</div>
          )}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label><input required value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label><select value={form.plan} onChange={(e) => setForm({...form, plan: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800"><option value="FREE">Free</option><option value="STARTER">Starter</option><option value="PROFESSIONAL">Professional</option><option value="ENTERPRISE">Enterprise</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label><input type="email" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label><input value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label><input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Buses</label><input type="number" value={form.maxBuses} onChange={(e) => setForm({...form, maxBuses: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Trips/Day</label><input type="number" value={form.maxTripsPerDay} onChange={(e) => setForm({...form, maxTripsPerDay: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Staff</label><input type="number" value={form.maxStaff} onChange={(e) => setForm({...form, maxStaff: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Owner Account (Optional)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label><input value={form.ownerName} onChange={(e) => setForm({...form, ownerName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={form.ownerEmail} onChange={(e) => setForm({...form, ownerEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input value={form.ownerPhone} onChange={(e) => setForm({...form, ownerPhone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 dark:bg-gray-800" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/channels')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Channel'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
