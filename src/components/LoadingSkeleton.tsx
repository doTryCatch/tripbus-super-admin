export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
