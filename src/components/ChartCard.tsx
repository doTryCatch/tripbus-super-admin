import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  action?: ReactNode;
}

export default function ChartCard({ title, subtitle, children, loading, action }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {loading ? (
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        children
      )}
    </div>
  );
}
