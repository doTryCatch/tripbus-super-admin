'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

interface Permissions {
  pageAccess: string[];
  actions: Record<string, string[]>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  customRoleId?: string | null;
  permissions?: Permissions;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await apiClient.get('/super-admin/profile');
      setUser(res.data.data || res.data);
    } catch {
      localStorage.removeItem('super_admin_token');
      localStorage.removeItem('super_admin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/super-admin/login', { email, password });
    const data = res.data.data || res.data;
    localStorage.setItem('super_admin_token', data.accessToken);
    localStorage.setItem('super_admin_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiClient.post('/super-admin/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Permissions Hook ───────────────────────────────────────────
const ALL_KNOWN_PAGES = [
  '/dashboard', '/dashboard/live-map', '/analytics',
  '/operators', '/operators/[id]', '/operators/[id]/channels/[channelId]',
  '/channels', '/channels/create', '/channels/[id]',
  '/passengers', '/passengers/[id]',
  '/staff-global',
  '/trips/analytics', '/trips/explorer',
  '/bookings/analytics', '/bookings/funnel',
  '/finances', '/finances/channels', '/finances/integrations', '/finances/payroll',
  '/integrations', '/integrations/[id]', '/integrations/analytics',
  '/reviews',
  '/fleet', '/fleet/analytics',
  '/hr/attendance', '/hr/salary',
  '/promotions',
  '/audit', '/audit/logins', '/audit/sessions',
  '/system/health', '/system/features', '/system/config',
  '/communications/announcements',
  '/reports',
  '/settings/profile', '/settings/team', '/settings/roles', '/settings/platform',
];

function matchPage(pageAccess: string[], route: string): boolean {
  if (pageAccess.includes('*')) return true;
  // Exact match
  if (pageAccess.includes(route)) return true;
  // Dynamic route matching: /operators/[id] matches /operators/abc-123
  for (const pattern of pageAccess) {
    if (pattern.includes('[')) {
      const regexStr = '^' + pattern.replace(/\[[^\]]+\]/g, '[^/]+') + '$';
      if (new RegExp(regexStr).test(route)) return true;
    }
    // Parent route match: if user has /finances, they can access /finances/channels
    if (!pattern.includes('[') && route.startsWith(pattern + '/')) return true;
  }
  return false;
}

export function usePermissions() {
  const { user } = useAuth();
  const pageAccess = user?.permissions?.pageAccess || ['/dashboard'];
  const actions = user?.permissions?.actions || {};
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return {
    hasPageAccess: (route: string) => matchPage(pageAccess, route),
    hasAction: (resource: string, action: string) => {
      if (isSuperAdmin || actions['*']?.includes('*')) return true;
      const resourceActions = actions[resource] || [];
      return resourceActions.includes(action) || resourceActions.includes('*');
    },
    isSuperAdmin,
    accessiblePages: pageAccess.includes('*') ? ALL_KNOWN_PAGES : pageAccess,
  };
}
