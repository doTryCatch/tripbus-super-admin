'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/AuthContext';
import { ShieldOff } from 'lucide-react';

export function withPageAccess(WrappedComponent: ComponentType<any>, requiredPage?: string) {
  return function PageAccessWrapper(props: any) {
    const { hasPageAccess, isSuperAdmin } = usePermissions();
    const router = useRouter();

    // Determine the page to check from the current path or prop
    const page = requiredPage || (typeof window !== 'undefined' ? window.location.pathname : '');
    const hasAccess = isSuperAdmin || hasPageAccess(page);

    useEffect(() => {
      if (!hasAccess && page) {
        // Show toast and redirect
        router.push('/dashboard?error=access_denied');
      }
    }, [hasAccess, page, router]);

    if (!hasAccess && page && page !== '/dashboard') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <ShieldOff size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
