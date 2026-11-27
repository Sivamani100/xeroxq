'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getPublicOrigin } from '@/lib/site-url';

const XeroxQPrintDialog = dynamic(
  () => import('@/components/desktop/xeroxq-print-dialog'),
  { ssr: false }
);

function isTrustedDocumentPath(rawPath: string): boolean {
  const trimmed = rawPath.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/pdf')) {
    return true;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const configuredOriginHost = new URL(getPublicOrigin()).hostname.toLowerCase();
    if (parsed.protocol === 'https:') {
      return host.endsWith('.supabase.co') || host === configuredOriginHost || host === 'localhost' || host === '127.0.0.1';
    }
    if (parsed.protocol === 'http:') {
      return host === 'localhost' || host === '127.0.0.1';
    }
    return false;
  } catch {
    return false;
  }
}

function StudioContent() {
  const searchParams = useSearchParams();
  const rawDocumentPath = searchParams.get('documentPath') || '';
  const documentPath = isTrustedDocumentPath(rawDocumentPath) ? rawDocumentPath : '';
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
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          {rawDocumentPath ? 'Blocked untrusted document source' : 'No document path provided'}
        </p>
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
