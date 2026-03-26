import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading placeholder with pulse animation.
 * Usage:
 *   <Skeleton className="h-9 w-full" />        // Input
 *   <Skeleton className="h-32 w-full" />       // Card
 *   <Skeleton className="h-4 w-3/4" />         // Text line
 *   <Skeleton className="h-8 w-8 rounded-full" /> // Avatar
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-foreground/10',
        className
      )}
    />
  );
}

/** Dashboard skeleton that matches the bento grid layout. */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 4 stat cards */}
      {[...Array(4)].map((_, i) => (
        <Skeleton className="h-28 rounded-lg" key={i} />
      ))}
      {/* Tasks + Habits */}
      <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
      <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
      {/* Cashflow + Budgets */}
      <Skeleton className="lg:col-span-2 h-48 rounded-lg" />
      <Skeleton className="lg:col-span-2 h-48 rounded-lg" />
    </div>
  );
}
