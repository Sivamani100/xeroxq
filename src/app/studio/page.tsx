'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const XeroxQPrintDialog = dynamic(
  () => import('@/components/desktop/xeroxq-print-dialog'),
  { ssr: false }
);

function StudioContent() {
  const searchParams = useSearchParams();
  const documentPath = searchParams.get('documentPath') || '';
  const jobId = searchParams.get('jobId') || undefined;
  const shopId = searchParams.get('shopId') || undefined;

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI?.closeWindow) {
        (window as any).electronAPI.closeWindow();
      } else {
        window.close();
      }
    }
  };

  if (!documentPath) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-black font-sans">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No document path provided</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black font-sans">
      <XeroxQPrintDialog
        documentPath={documentPath}
        jobId={jobId}
        shopId={shopId}
        onClose={handleClose}
      />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#F8FAFC]" />}>
      <StudioContent />
    </Suspense>
  );
}
