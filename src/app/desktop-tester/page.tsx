'use client';

import dynamic from 'next/dynamic';

const XeroxQPrintDialog = dynamic(
  () => import('@/components/desktop/xeroxq-print-dialog'),
  { ssr: false }
);

export default function DesktopTesterPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] p-8 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Desktop Native Print Tester</h1>
        <p className="text-[#525252] dark:text-[#A1A1A6]">
          This simulates what the Shop Keeper sees when they click &quot;Print&quot; on an order.
        </p>
      </div>

      <XeroxQPrintDialog documentPath="C:\\example-path\\mock-document.pdf" />
    </div>
  );
}
