import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SkeletonLoader type="dashboard-header" />

      {/* Skeleton Subheader Chassis */}
      <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6 lg:px-[82px] flex items-center justify-between">
         <div className="space-y-2">
            <Skeleton className="w-[200px] h-[42px] rounded-xl" />
            <Skeleton className="w-[140px] h-[16px]" />
         </div>
         <div className="flex gap-3">
            <Skeleton className="w-[250px] h-[44px] rounded-xl border border-gray-100" />
            <Skeleton className="w-[44px] h-[44px] rounded-xl" />
         </div>
      </div>

      {/* Skeleton Main Work Area */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-[82px] pb-12">
         <div className="bg-white border border-[#E2E8F0] rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
            <div className="divide-y divide-gray-50">
               {[...Array(6)].map((_, i) => (
                 <SkeletonLoader key={i} type="queue-row" />
               ))}
            </div>
         </div>
      </main>
    </div>
  );
}
