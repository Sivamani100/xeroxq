import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center">
      {/* Skeleton App Bar */}
      <div className="sticky top-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 bg-[#FDFDFD]/80 backdrop-blur-md">
         <div className="w-full max-w-[800px] bg-white border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
               <Skeleton className="w-11 h-11 rounded-[10px]" />
               <div className="flex flex-col gap-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-20 h-3" />
               </div>
            </div>
            <div className="flex gap-2">
               <Skeleton className="w-10 h-10 rounded-[10px]" />
               <Skeleton className="w-10 h-10 rounded-[10px]" />
            </div>
         </div>
      </div>

      {/* Skeleton Main Work Area */}
      <div className="w-full max-w-[800px] px-4 sm:px-6 py-12 space-y-12">
          
         {/* Section 1: Interaction Card Skeleton */}
         <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
               <div className="space-y-3">
                  <Skeleton className="w-48 h-10" />
                  <Skeleton className="w-64 h-4" />
               </div>
            </div>
            
            <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm space-y-8">
               <div className="flex flex-col items-center py-16 space-y-6 border-2 border-dashed border-black/5 rounded-[24px]">
                  <Skeleton className="w-20 h-20 rounded-[20px]" />
                  <div className="space-y-3 flex flex-col items-center">
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-32 h-4" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-14 rounded-2xl" />
                  </div>
               </div>
               <Skeleton className="w-full h-16 rounded-2xl" />
            </div>
         </div>

         {/* Section 2: Sidebar/History Skeleton */}
         <div className="space-y-6 px-2">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-40 h-6" />
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-6 bg-white border border-black/5 rounded-[24px] space-y-4">
                     <div className="flex justify-between items-start">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <Skeleton className="w-20 h-5" />
                     </div>
                     <div className="space-y-2">
                        <Skeleton className="w-full h-5" />
                        <Skeleton className="w-[60%] h-3" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
