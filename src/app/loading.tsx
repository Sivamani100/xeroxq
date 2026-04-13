"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Skeleton Navbar Chassis */}
      <div className="w-full bg-white border-b border-gray-100 h-16 flex items-center px-6 lg:px-[82px] justify-between">
        <Skeleton className="w-32 h-8" />
        <div className="flex gap-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>

      {/* Main Content Skeleton Chassis */}
      <div className="max-w-[1440px] mx-auto px-6 py-12 lg:px-[82px] space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[40%]" />
          <Skeleton className="h-4 w-[25%]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <SkeletonLoader type="card" />
           <SkeletonLoader type="card" />
           <SkeletonLoader type="card" />
        </div>
      </div>
    </div>
  );
}
