"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordLegacyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = params ? `/auth/update-password?${params}` : "/auth/update-password";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 font-sans">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#FB432C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#525252] dark:text-[#A1A1A6]">Redirecting to password update form...</p>
      </div>
    </main>
  );
}

export default function ResetPasswordLegacy() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] flex items-center justify-center p-6 font-sans">
          <div className="w-8 h-8 border-2 border-[#FB432C] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ResetPasswordLegacyContent />
    </Suspense>
  );
}
