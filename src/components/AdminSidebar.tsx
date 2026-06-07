'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  UserCheck,
  UserCog,
  Bus,
  Ticket,
  DollarSign,
  Link2,
  Star,
  Truck,
  Briefcase,
  Tag,
  Shield,
  Settings,
  Megaphone,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  KeyRound,
  BarChart3,
} from 'lucide-react';
import { usePermissions } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { href: '/dashboard/live-map', label: 'Live Map', icon: <Map size={20} /> },
      { href: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/operators', label: 'Operators', icon: <Users size={20} /> },
      { href: '/channels', label: 'Channels', icon: <Building2 size={20} /> },
      { href: '/passengers', label: 'Passengers', icon: <UserCheck size={20} /> },
      { href: '/staff-global', label: 'Staff', icon: <UserCog size={20} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/trips/analytics', label: 'Trips', icon: <Bus size={20} /> },
      { href: '/bookings/analytics', label: 'Bookings', icon: <Ticket size={20} /> },
      { href: '/finances', label: 'Finances', icon: <DollarSign size={20} /> },
      { href: '/integrations', label: 'Integrations', icon: <Link2 size={20} /> },
      { href: '/reviews', label: 'Reviews', icon: <Star size={20} /> },
    ],
  },
  {
    label: 'Resources',
    items: [
      { href: '/fleet', label: 'Fleet', icon: <Truck size={20} /> },
      { href: '/hr/attendance', label: 'HR', icon: <Briefcase size={20} /> },
      { href: '/promotions', label: 'Promotions', icon: <Tag size={20} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/audit', label: 'Audit Log', icon: <Shield size={20} /> },
      { href: '/system/health', label: 'System', icon: <Settings size={20} /> },
      { href: '/communications/announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
      { href: '/reports', label: 'Reports', icon: <FileBarChart size={20} /> },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: <Users size={20} /> },
      { href: '/settings/team', label: 'Team', icon: <UserCog size={20} /> },
      { href: '/settings/roles', label: 'Roles & Permissions', icon: <KeyRound size={20} /> },
      { href: '/settings/platform', label: 'Platform Settings', icon: <Settings size={20} /> },
    ],
  },
];

export default function AdminSidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Management: true,
    Operations: true,
    Resources: true,
    Administration: true,
    Settings: true,
  });
  const pathname = usePathname();
  const { hasPageAccess, isSuperAdmin } = usePermissions();

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter navigation items based on permissions
  const filteredNavigation = useMemo(() => {
    if (isSuperAdmin) return navigation;

    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPageAccess(item.href)),
      }))
      .filter((group) => group.items.length > 0);
  }, [isSuperAdmin, hasPageAccess]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1e293b] text-white z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
            SA
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm whitespace-nowrap">
              TripBus Admin
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavigation.map((group) => {
          const isExpanded = expandedGroups[group.label] !== false;
          return (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300"
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
              {(isExpanded || collapsed) && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-700 p-3">
        <button
          onClick={() => toggleCollapsed()}
          className="flex items-center justify-center w-full py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
