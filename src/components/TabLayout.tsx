'use client';

import { ReactNode } from 'react';

interface TabLayoutProps {
  tabs: { key: string; label: string; content: ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabLayout({ tabs, activeTab, onTabChange }: TabLayoutProps) {
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {tabs.find((t) => t.key === activeTab)?.content}
      </div>
    </div>
  );
}
