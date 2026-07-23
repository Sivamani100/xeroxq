const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const pdfToPrinter = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

// Dedicated temp directory for print jobs to ensure isolation during exit cleanup
const printJobsDir = path.join(app.getPath('temp'), 'xeroxq-print-jobs');

// Ensure the print jobs folder exists
if (!fs.existsSync(printJobsDir)) {
  fs.mkdirSync(printJobsDir, { recursive: true });
}

// Self-healing helper: sync cleanup of leftover temp documents
function cleanupTempFolder() {
  try {
    if (fs.existsSync(printJobsDir)) {
      const files = fs.readdirSync(printJobsDir);
      for (const file of files) {
        const filePath = path.join(printJobsDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`[XeroxQ Janitor] Successfully cleaned up leftover file: ${filePath}`);
        } catch (e) {
          console.error(`[XeroxQ Janitor] Failed to delete leftover file ${filePath}:`, e);
        }
      }
    }
  } catch (error) {
    console.error('[XeroxQ Janitor] Error during temp folder cleanup:', error);
  }
}

// Clean up files at startup in case of a previous crash
cleanupTempFolder();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'XeroxQ Print HQ',
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // Hide the default menu bar completely for a clean look
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Explicitly remove the default application menu completely
  Menu.setApplicationMenu(null);

  // Check if we're running in development or production (using app.isPackaged)
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://127.0.0.1:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`; // Assuming Next.js static export for production

  mainWindow.loadURL(startUrl);

  // Open the DevTools to diagnose console errors and startup blank screens.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Register app exit handlers to securely wipe the dedicated temp directory
app.on('before-quit', () => {
  console.log('[XeroxQ] Application is quitting. Initiating temp folder purge...');
  cleanupTempFolder();
});

app.on('window-all-closed', () => {
  cleanupTempFolder();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Helper for macOS/Linux CUPS-based lp printing
function printUnix(filePath, options) {
  return new Promise((resolve, reject) => {
    const args = [];
    if (options.printer) {
      args.push('-d', options.printer);
    }
    if (options.copies) {
      args.push('-n', String(options.copies));
    }
    if (options.monochrome) {
      // standard CUPS color management options for grayscale
      args.push('-o', 'color-model=gray');
    }
    if (options.side === 'duplex') {
      args.push('-o', 'sides=two-sided-long-edge');
    } else {
      args.push('-o', 'sides=one-sided');
    }
    if (options.orientation === 'landscape') {
      args.push('-o', 'landscape');
    }
    if (options.paperSize && options.paperSize !== 'Automatically Select') {
      args.push('-o', `media=${options.paperSize}`);
    }
    if (options.bin) {
      args.push('-o', `InputSlot=${options.bin}`);
    }
    
    // filePath is appended as the last parameter to print
    args.push(filePath);
    
    console.log(`[XeroxQ Unix Spooler] Spawning lp with arguments:`, args);
    execFile('lp', args, (error, stdout, stderr) => {
      if (error) {
        console.error(`[XeroxQ Unix Spooler] lp error:`, error, stderr);
        // Build a detailed error object to pass back
        const nativeErr = new Error(stderr.trim() || error.message);
        nativeErr.code = error.code;
        nativeErr.stderr = stderr;
        nativeErr.stdout = stdout;
        reject(nativeErr);
      } else {
        console.log(`[XeroxQ Unix Spooler] lp succeeded:`, stdout);
        resolve({ success: true, stdout });
      }
    });
  });
}

// Helper for macOS/Linux CUPS-based printer discovery
function getPrintersUnix() {
  return new Promise((resolve, reject) => {
    execFile('lpstat', ['-p'], (error, stdout, stderr) => {
      if (error) {
        console.error(`[XeroxQ Unix Spooler] lpstat error:`, error, stderr);
        const nativeErr = new Error(stderr.trim() || error.message);
        nativeErr.code = error.code;
        nativeErr.stderr = stderr;
        reject(nativeErr);
        return;
      }
      const printers = [];
      const lines = stdout.split('\n');
      for (const line of lines) {
        // Line typically reads: "printer HP_LaserJet_1020 is idle. enabled since..."
        const match = line.match(/^printer\s+(\S+)/);
        if (match) {
          printers.push({ name: match[1], deviceId: match[1] });
        }
      }
      resolve(printers);
    });
  });
}

// IPC handler for printing natively
ipcMain.handle('print-native', async (event, { filePath, base64Data, options }) => {
  const isTempFile = !!(base64Data || (filePath && filePath.startsWith('http')));
  let targetPath = filePath;

  try {
    // Handle incoming Base64 payload or Remote URL
    if (base64Data) {
      const base64Content = base64Data.split(';base64,').pop();
      const ext = filePath.endsWith('.png') ? '.png' : '.pdf';
      targetPath = path.join(printJobsDir, `xeroxq-print-${Date.now()}${ext}`);
      fs.writeFileSync(targetPath, base64Content, { encoding: 'base64' });
    } else if (filePath && filePath.startsWith('http')) {
      const https = require('https');
      const ext = filePath.split('?')[0].endsWith('.png') ? '.png' : '.pdf';
      targetPath = path.join(printJobsDir, `xeroxq-remote-${Date.now()}${ext}`);
      
      console.log(`[XeroxQ] Fetching remote mesh: ${filePath}`);
      
      const file = fs.createWriteStream(targetPath);
      await new Promise((resolve, reject) => {
        https.get(filePath, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Server returned status code ${response.statusCode}`));
            return;
          }
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      });
    }

    // Map options to printer driver specifications
    const printOptions = {
      printer: options.printer,
      copies: options.copies || 1,
      monochrome: options.monochrome === true,
      side: options.side === 'duplex' ? 'duplex' : 'simplex',
      orientation: options.orientation || 'portrait',
      paperSize: options.paperSupply?.toLowerCase().includes('tray') ? undefined : options.paperSupply,
      bin: options.paperSupply?.toLowerCase().includes('tray') ? options.paperSupply : undefined
    };

    console.log(`[XeroxQ] Spooling Protocol Initiated:`, { targetPath, printOptions });
    
    if (process.platform === 'win32') {
      await pdfToPrinter.print(targetPath, printOptions);
    } else {
      await printUnix(targetPath, printOptions);
    }

    // Return success along with options actually applied (Confirmation Loop)
    return { success: true, appliedOptions: printOptions };

  } catch (error) {
    console.error("[XeroxQ] Critical Spool Exception:", error);
    // Return full serializable details of the native error back to the renderer for DB logs
    return { 
      success: false, 
      error: error.message || "Unknown Spool Exception",
      rawError: {
        message: error.message,
        code: error.code,
        stderr: error.stderr || "",
        stdout: error.stdout || "",
        stack: error.stack || ""
      },
      platform: process.platform
    };
  } finally {
    // Secure Immediate Cleanup: Wipe the document file immediately after the print completes
    if (isTempFile && targetPath && fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
        console.log(`[XeroxQ] Secure immediate cleanup successful: ${targetPath}`);
      } catch(e) {
        console.error(`[XeroxQ] Secure immediate cleanup failed for ${targetPath}:`, e);
      }
    }
  }
});

// Get available printers (cross-platform abstraction)
ipcMain.handle('get-printers', async () => {
  try {
    let printers;
    if (process.platform === 'win32') {
      printers = await pdfToPrinter.getPrinters();
    } else {
      printers = await getPrintersUnix();
    }
    return { success: true, printers };
  } catch (error) {
    console.error("Get Printers Error:", error);
    return { 
      success: false, 
      error: error.message,
      rawError: {
        message: error.message,
        code: error.code,
        stderr: error.stderr || ""
      }
    };
  }
});
