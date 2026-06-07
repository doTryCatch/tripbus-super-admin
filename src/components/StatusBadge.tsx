interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  default: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

function getVariant(status: string): string {
  const s = status?.toUpperCase();
  if (['ACTIVE', 'CONFIRMED', 'COMPLETED', 'PAID', 'LIVE'].includes(s)) return 'success';
  if (['SUSPENDED', 'PENDING', 'TRIAL', 'HELD'].includes(s)) return 'warning';
  if (['TERMINATED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'FAILED'].includes(s)) return 'danger';
  if (['STARTED', 'SCHEDULED', 'OPEN'].includes(s)) return 'info';
  return 'default';
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const v = variant || getVariant(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[v]}`}>
      {status}
    </span>
  );
}
