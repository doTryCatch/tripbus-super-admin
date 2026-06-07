'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { useRouter } from 'next/navigation';
import {
  LogOut, Search, User, Sun, Moon,
  LayoutDashboard, Map, Building2, Users, UserCheck, UserCog,
  Bus, Ticket, DollarSign, Link2, Star, Truck, Briefcase, Tag,
  Shield, Settings, Megaphone, FileBarChart,
  ArrowRight, Command,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  keywords: string[];
  section: string;
}

const searchIndex: SearchItem[] = [
  // Overview
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, keywords: ['dashboard', 'home', 'overview', 'stats', 'kpi', 'metrics'], section: 'Overview' },
  { label: 'Live Map', href: '/dashboard/live-map', icon: <Map size={16} />, keywords: ['map', 'live', 'fleet', 'tracking', 'gps', 'location', 'bus location'], section: 'Overview' },
  // Management
  { label: 'Channels', href: '/channels', icon: <Building2 size={16} />, keywords: ['channels', 'companies', 'tenants', 'transport', 'operators', 'create channel'], section: 'Management' },
  { label: 'Create Channel', href: '/channels/create', icon: <Building2 size={16} />, keywords: ['create', 'new', 'channel', 'add', 'company'], section: 'Management' },
  { label: 'Operators', href: '/operators', icon: <Users size={16} />, keywords: ['operators', 'users', 'accounts', 'admin'], section: 'Management' },
  { label: 'Passengers', href: '/passengers', icon: <UserCheck size={16} />, keywords: ['passengers', 'customers', 'riders', 'bookers'], section: 'Management' },
  { label: 'Staff', href: '/staff-global', icon: <UserCog size={16} />, keywords: ['staff', 'global', 'drivers', 'conductors', 'helpers', 'employees'], section: 'Management' },
  // Operations
  { label: 'Trips Analytics', href: '/trips/analytics', icon: <Bus size={16} />, keywords: ['trips', 'analytics', 'routes', 'schedule', 'rides'], section: 'Operations' },
  { label: 'Trip Explorer', href: '/trips/explorer', icon: <Bus size={16} />, keywords: ['trips', 'explorer', 'list', 'browse'], section: 'Operations' },
  { label: 'Booking Analytics', href: '/bookings/analytics', icon: <Ticket size={16} />, keywords: ['bookings', 'analytics', 'tickets', 'reservations', 'seats'], section: 'Operations' },
  { label: 'Booking Funnel', href: '/bookings/funnel', icon: <Ticket size={16} />, keywords: ['booking', 'funnel', 'conversion', 'stages'], section: 'Operations' },
  { label: 'Revenue Dashboard', href: '/finances', icon: <DollarSign size={16} />, keywords: ['finances', 'revenue', 'money', 'income', 'earnings', 'payment'], section: 'Operations' },
  { label: 'Channel Financials', href: '/finances/channels', icon: <DollarSign size={16} />, keywords: ['channel', 'financials', 'revenue', 'per channel'], section: 'Operations' },
  { label: 'Integration Revenue', href: '/finances/integrations', icon: <DollarSign size={16} />, keywords: ['integration', 'revenue', 'partner', 'api'], section: 'Operations' },
  { label: 'Payroll', href: '/finances/payroll', icon: <DollarSign size={16} />, keywords: ['payroll', 'salary', 'wages', 'compensation'], section: 'Operations' },
  { label: 'Integrations', href: '/integrations', icon: <Link2 size={16} />, keywords: ['integrations', 'api', 'partners', 'third party', 'webhooks'], section: 'Operations' },
  { label: 'Integration Analytics', href: '/integrations/analytics', icon: <Link2 size={16} />, keywords: ['integration', 'analytics', 'api calls', 'errors', 'latency'], section: 'Operations' },
  { label: 'Reviews', href: '/reviews', icon: <Star size={16} />, keywords: ['reviews', 'ratings', 'feedback', 'stars'], section: 'Operations' },
  // Resources
  { label: 'Fleet Map', href: '/fleet', icon: <Truck size={16} />, keywords: ['fleet', 'map', 'buses', 'vehicles'], section: 'Resources' },
  { label: 'Fleet Analytics', href: '/fleet/analytics', icon: <Truck size={16} />, keywords: ['fleet', 'analytics', 'utilization', 'buses'], section: 'Resources' },
  { label: 'HR - Attendance', href: '/hr/attendance', icon: <Briefcase size={16} />, keywords: ['hr', 'attendance', 'calendar', 'present', 'absent'], section: 'Resources' },
  { label: 'HR - Salary', href: '/hr/salary', icon: <Briefcase size={16} />, keywords: ['hr', 'salary', 'payroll', 'wages', 'staff cost'], section: 'Resources' },
  { label: 'Promotions', href: '/promotions', icon: <Tag size={16} />, keywords: ['promotions', 'coupons', 'discounts', 'offers', 'deals'], section: 'Resources' },
  // Administration
  { label: 'Audit Log', href: '/audit', icon: <Shield size={16} />, keywords: ['audit', 'log', 'history', 'actions', 'track'], section: 'Administration' },
  { label: 'Login History', href: '/audit/logins', icon: <Shield size={16} />, keywords: ['login', 'history', 'sessions', 'access'], section: 'Administration' },
  { label: 'Active Sessions', href: '/audit/sessions', icon: <Shield size={16} />, keywords: ['sessions', 'active', 'revoke', 'tokens'], section: 'Administration' },
  { label: 'System Health', href: '/system/health', icon: <Settings size={16} />, keywords: ['system', 'health', 'database', 'redis', 'monitoring', 'status'], section: 'Administration' },
  { label: 'Feature Flags', href: '/system/features', icon: <Settings size={16} />, keywords: ['feature', 'flags', 'toggles', 'switches', 'config'], section: 'Administration' },
  { label: 'System Config', href: '/system/config', icon: <Settings size={16} />, keywords: ['config', 'configuration', 'settings', 'env', 'variables'], section: 'Administration' },
  { label: 'Announcements', href: '/communications/announcements', icon: <Megaphone size={16} />, keywords: ['announcements', 'notifications', 'broadcast', 'messages'], section: 'Administration' },
  { label: 'Reports', href: '/reports', icon: <FileBarChart size={16} />, keywords: ['reports', 'export', 'csv', 'excel', 'download'], section: 'Administration' },
  // Settings
  { label: 'Profile', href: '/settings/profile', icon: <Users size={16} />, keywords: ['profile', 'account', 'password', 'name', 'email'], section: 'Settings' },
  { label: 'Team Management', href: '/settings/team', icon: <UserCog size={16} />, keywords: ['team', 'members', 'roles', 'invite', 'manage'], section: 'Settings' },
  { label: 'Platform Settings', href: '/settings/platform', icon: <Settings size={16} />, keywords: ['platform', 'settings', 'defaults', 'booking', 'channel'], section: 'Settings' },
];

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { sidebarWidth } = useSidebar();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
        if (!showSearch) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // Filter results
  const results = searchQuery.trim()
    ? searchIndex.filter(item => {
        const q = searchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.keywords.some(k => k.includes(q)) ||
          item.section.toLowerCase().includes(q)
        );
      })
    : searchIndex; // Show all when empty

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSelect = (href: string) => {
    router.push(href);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].href);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  // Group results by section
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  return (
    <>
      <header className="fixed top-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-6 transition-all duration-300" style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }}>
        {/* Search trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-text"
          >
            <Search size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="flex-1 text-left">Search pages, sections...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              <Command size={10} />K
            </kbd>
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
              <User size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{user?.role || 'SUPER_ADMIN'}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={() => { router.push('/settings/profile'); setShowDropdown(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <User size={14} /> Profile Settings
              </button>
              <hr className="my-1 border-gray-100 dark:border-gray-800" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, sections, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none bg-transparent"
                autoComplete="off"
              />
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No results for &quot;{searchQuery}&quot;
                </div>
              ) : (
                Object.entries(groupedResults).map(([section, items]) => (
                  <div key={section}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {section}
                    </div>
                    {items.map((item) => {
                      const globalIndex = results.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={item.href}
                          data-selected={isSelected}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className={`flex-shrink-0 ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                            {item.icon}
                          </span>
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          {isSelected && (
                            <ArrowRight size={14} className="text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono">↵</kbd> Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono">esc</kbd> Close
              </span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
