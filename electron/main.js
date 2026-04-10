const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const pdfToPrinter = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');

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
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`; // Assuming Next.js static export for production

  mainWindow.loadURL(startUrl);

  // Removed DevTools to give it a native app feel

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handler for printing natively
ipcMain.handle('print-native', async (event, { filePath, base64Data, options }) => {
  try {
    let targetPath = filePath;

    // Handle incoming Base64 payload or Remote URL
    if (base64Data) {
      // Decode the base64 string
      const base64Content = base64Data.split(';base64,').pop();
      const ext = filePath.endsWith('.png') ? '.png' : '.pdf';
      targetPath = path.join(os.tmpdir(), `xeroxq-print-${Date.now()}${ext}`);
      fs.writeFileSync(targetPath, base64Content, { encoding: 'base64' });
    } else if (filePath.startsWith('http')) {
      // Download remote file to temp directory
      const https = require('https');
      const ext = filePath.split('?')[0].endsWith('.png') ? '.png' : '.pdf';
      targetPath = path.join(os.tmpdir(), `xeroxq-remote-${Date.now()}${ext}`);
      
      console.log(`[XeroxQ] Fetching remote mesh: ${filePath}`);
      
      const file = fs.createWriteStream(targetPath);
      await new Promise((resolve, reject) => {
        https.get(filePath, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Server returned ${response.statusCode}`));
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

    // Map Studio options to pdf-to-printer options (Enhanced mapping)
    const printOptions = {
      printer: options.printer,
      copies: options.copies || 1,
      monochrome: options.monochrome === true,
      side: options.side === 'duplex' ? 'duplex' : 'simplex',
      orientation: options.orientation || 'portrait',
      // Map 'Tray X' to 'bin' and use standard 'paperSize' if applicable
      paperSize: options.paperSupply?.toLowerCase().includes('tray') ? undefined : options.paperSupply,
      bin: options.paperSupply?.toLowerCase().includes('tray') ? options.paperSupply : undefined
    };

    console.log(`[XeroxQ] Spooling Protocol Initiated:`, { targetPath, printOptions });
    
    try {
      await pdfToPrinter.print(targetPath, printOptions);
    } catch (err) {
      console.error("[XeroxQ] pdf-to-printer Error:", err);
      // If spooler fails, return a more descriptive error than just "Spool failure"
      return { success: false, error: err.message || `Native command failed for ${options.printer}` };
    }
    
    // Clean up temporary file
    if (base64Data && fs.existsSync(targetPath)) {
      setTimeout(() => { try { fs.unlinkSync(targetPath); } catch(e) {} }, 60000);
    }

    return { success: true };
  } catch (error) {
    console.error("[XeroxQ] Critical Protocol Error:", error);
    return { success: false, error: error.message || "Unknown Native Exception" };
  }
});

// Get available printers
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await pdfToPrinter.getPrinters();
    return { success: true, printers };
  } catch (error) {
    console.error("Get Printers Error:", error);
    return { success: false, error: error.message };
  }
});
