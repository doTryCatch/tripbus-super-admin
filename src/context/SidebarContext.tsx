'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
  sidebarWidth: string; // '68px' or '260px'
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
  sidebarWidth: '260px',
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed(prev => !prev), []);
  const sidebarWidth = collapsed ? '68px' : '260px';

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
