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
    const electronWindow = window as unknown as { electronAPI?: { getPrinters: () => Promise<{ success: boolean; printers: { name?: string; deviceId?: string }[] }>; printNative: (opts: unknown) => Promise<{ success: boolean; error?: string }> } };
    
    if (typeof window !== 'undefined' && electronWindow.electronAPI) {
      setIsElectron(true);
      
      // Load available printers
      electronWindow.electronAPI.getPrinters()
        .then((res) => {
          if (res.success) {
            // @ts-ignore fallback extraction
            setPrinters(res.printers.map((p) => p.name || p.deviceId || String(p)));
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
      const electronWindow = window as unknown as { electronAPI?: { printNative: (opts: unknown) => Promise<{ success: boolean; error?: string }> } };
      
      const res = await electronWindow.electronAPI!.printNative({
        filePath: documentPath || 'test-document-path',
        options: {}
      });

      if (res.success) {
        setStatus('Print Sent Natively!');
      } else {
        setStatus(`Error: ${res.error}`);
      }
    } catch (err) {
      const e = err as Error;
      setStatus(`Failed: ${e.message}`);
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
