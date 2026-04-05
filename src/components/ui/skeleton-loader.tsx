import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-black/5", className)}
      {...props}
    />
  );
}

export function SkeletonLoader({ type }: { type: 'card' | 'text' | 'hero' }) {
  if (type === 'card') {
    return (
      <div className="p-8 border border-gray-100 rounded-2xl bg-white space-y-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto text-center">
        <Skeleton className="h-6 w-48 mx-auto rounded-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-2/3 mx-auto" />
      </div>
    );
  }

  return <Skeleton className="h-4 w-full" />;
}
