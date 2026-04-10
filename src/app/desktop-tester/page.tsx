import XeroxQPrintDialog from '@/components/desktop/xeroxq-print-dialog';

export default function DesktopTesterPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black p-8 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Desktop Native Print Tester</h1>
        <p className="text-zinc-500">
          This simulates what the Shop Keeper sees when they click "Print" on an order.
        </p>
      </div>

      <XeroxQPrintDialog documentPath="C:\\example-path\\mock-document.pdf" />
    </div>
  );
}
