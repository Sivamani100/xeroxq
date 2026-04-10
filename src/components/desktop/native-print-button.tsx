'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function NativePrintButton({ documentPath }: { documentPath?: string }) {
  const [isElectron, setIsElectron] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Ready');

  useEffect(() => {
    // Check if we are running inside Electron (our preload script exposes window.electronAPI)
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsElectron(true);
      
      // Load available printers
      (window as any).electronAPI.getPrinters()
        .then((res: any) => {
          if (res.success) {
            setPrinters(res.printers.map((p: any) => p.name || p.deviceId || p));
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleNativePrint = async () => {
    if (!isElectron) {
      // Fallback for normal web browser
      window.print();
      return;
    }

    try {
      setStatus('Printing...');
      const res = await (window as any).electronAPI.printNative({
        filePath: documentPath || 'test-document-path',
        options: {
          // You can pass specific options supported by pdf-to-printer here
          // e.g., printer: "My Canon Printer", scale: "noscale"
        }
      });

      if (res.success) {
        setStatus('Print Sent Natively!');
      } else {
        setStatus(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setStatus(`Failed: ${err.message}`);
    }
  };

  if (!isElectron) {
    return (
      <Button onClick={handleNativePrint} variant="outline" className="flex items-center gap-2">
        <Printer className="w-4 h-4" />
        Print (Browser Dialog)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Printer className="w-4 h-4 text-primary" />
        Desktop Native Print Enabled
      </h3>
      
      {printers.length > 0 && (
        <select className="text-sm p-1 border rounded bg-white dark:bg-black">
          <option value="">-- Default Printer --</option>
          {printers.map((p, i) => (
            <option key={i} value={p}>{p}</option>
          ))}
        </select>
      )}

      <Button onClick={handleNativePrint}>
        Send Job Direct to Hardware
      </Button>
      <p className="text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
