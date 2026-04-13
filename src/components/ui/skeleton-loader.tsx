import { Skeleton } from "./skeleton";

export function SkeletonLoader({ type }: { type: 'card' | 'text' | 'hero' | 'queue-row' | 'dashboard-header' | 'stat-card' | 'form' }) {
  if (type === 'card') {
    return (
      <div className="p-8 border border-gray-100 rounded-2xl bg-white space-y-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (type === 'queue-row') {
    return (
      <div className="flex items-center gap-6 px-6 py-6 border-b border-gray-50">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-[30%] h-4" />
          <Skeleton className="w-[20%] h-3" />
        </div>
        <Skeleton className="w-[10%] h-6 rounded-lg" />
        <Skeleton className="w-[15%] h-8 rounded-lg" />
        <Skeleton className="w-[10%] h-8 rounded-lg" />
      </div>
    );
  }

  if (type === 'dashboard-header') {
    return (
      <div className="flex items-center justify-between px-6 py-4 lg:px-[82px] bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-24 h-9 rounded-lg" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </div>
    );
  }

  if (type === 'stat-card') {
    return (
      <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="w-full space-y-10 p-10 bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[70%]" />
          <Skeleton className="h-4 w-[40%]" />
        </div>
        <div className="space-y-8 mt-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl mt-4" />
        </div>
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
