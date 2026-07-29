"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordLegacy() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = params ? `/auth/update-password?${params}` : "/auth/update-password";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Redirecting to password update form...</p>
      </div>
    </main>
  );
}
