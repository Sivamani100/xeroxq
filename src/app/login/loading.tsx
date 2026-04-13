import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function LoginLoading() {
  return (
    <main className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans relative">
      <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-white">
         <div className="w-full lg:w-[378px]">
            <SkeletonLoader type="form" />
         </div>
      </div>
      <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
         <Skeleton className="absolute inset-0 w-full h-full" />
      </div>
    </main>
  );
}
