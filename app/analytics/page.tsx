'use client';

import AdminLayout from '../(admin)/layout';
import { useState, useMemo } from 'react';
import { ExternalLink, Maximize2, Minimize2, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Dashboard {
  uid: string;
  title: string;
  icon: string;
}

const DASHBOARDS: Dashboard[] = [
  { uid: 'tripbus-revenue-overview', title: 'Revenue', icon: '💰' },
  { uid: 'tripbus-bookings-analytics', title: 'Bookings', icon: '📋' },
  { uid: 'tripbus-fleet-operations', title: 'Fleet', icon: '🚌' },
];

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeDashboard, setActiveDashboard] = useState(DASHBOARDS[0].uid);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('super_admin_token') : null;

  const iframeSrc = useMemo(() => {
    if (!token) return '';
    return `${API_URL}/super-admin/analytics-proxy/d/${activeDashboard}?kiosk=tv&theme=${isDark ? 'dark' : 'light'}&token=${token}`;
  }, [token, activeDashboard, isDark]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Full-screen mode: no AdminLayout wrapper, just the iframe
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
        {/* Full-screen toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {DASHBOARDS.map((dash) => (
              <button
                key={dash.uid}
                onClick={() => {
                  setActiveDashboard(dash.uid);
                  setIframeLoading(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeDashboard === dash.uid
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-1.5">{dash.icon}</span>
                {dash.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${API_URL}/super-admin/analytics-proxy/d/${activeDashboard}?kiosk=tv&theme=${isDark ? 'dark' : 'light'}&token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size="14" />
              New Tab
            </a>
            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Minimize2 size="14" />
              Exit Full Screen
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 pt-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="mt-3 text-sm text-gray-400">Loading analytics...</p>
            </div>
          </div>
        )}

        {iframeError ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md">
              <AlertCircle size="48" className="mx-auto text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-200">Analytics service unavailable</h3>
              <p className="text-sm text-gray-400 mt-2">
                Make sure the TripBus Analytics service is running:
              </p>
              <code className="block mt-3 px-4 py-2 bg-gray-900 rounded-lg text-sm font-mono text-indigo-400">
                cd tripbus-analytics && docker compose up -d
              </code>
            </div>
          </div>
        ) : (
          <iframe
            src={iframeSrc}
            className="flex-1 w-full border-0"
            title="TripBus Analytics"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Negative margin cancels parent's p-6 padding; p-2.5 adds 10px edge breathing room */}
      <div className="-m-6 flex flex-col p-2.5" style={{ height: 'calc(100vh - 59px)' }}>
        {/* Compact header bar */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            {/* Dashboard Tabs — inline with header */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {DASHBOARDS.map((dash) => (
                <button
                  key={dash.uid}
                  onClick={() => {
                    setActiveDashboard(dash.uid);
                    setIframeLoading(true);
                    setIframeError(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeDashboard === dash.uid
                      ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <span>{dash.icon}</span>
                  {dash.title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${API_URL}/super-admin/analytics-proxy/d/${activeDashboard}?kiosk=tv&theme=${isDark ? 'dark' : 'light'}&token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size="14" />
              New Tab
            </a>
            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              <Maximize2 size="14" />
              Full Screen
            </button>
          </div>
        </div>

        {/* Iframe fills ALL remaining vertical space */}
        {iframeError ? (
          <div className="flex-1 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="text-center">
              <AlertCircle size="40" className="mx-auto text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Analytics service unavailable</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Start it with:</p>
              <code className="block mt-3 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-sm font-mono text-amber-800 dark:text-amber-300">
                cd tripbus-analytics && docker compose up -d
              </code>
              <button
                onClick={() => { setIframeError(false); setIframeLoading(true); }}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            {/* Loading overlay */}
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto" />
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
                </div>
              </div>
            )}
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0"
              title={`TripBus Analytics — ${DASHBOARDS.find(d => d.uid === activeDashboard)?.title}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
