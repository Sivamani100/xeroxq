const { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell, nativeImage, protocol, net } = require('electron');
const path = require('path');
const pdfToPrinter = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

// Register 'app://' as a privileged scheme before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true
    }
  }
]);

// Suppress dev-only security warnings in Electron console
if (!app.isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// Set Windows App User Model ID so Windows taskbar uses XeroxQ name & custom icon
if (process.platform === 'win32') {
  app.setAppUserModelId('XeroxQ');
}

// ── Single Instance Lock (required for deep-link on Windows) ─────────────────
// Ensures only one instance runs at a time. When the system browser redirects
// to xeroxq://, Windows launches a second instance with the URL as an arg.
// We grab the lock here, and if we're that second instance, quit immediately
// (the 'second-instance' event on the primary instance handles it).
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ── Deep Link / OAuth Protocol ───────────────────────────────────────────────
// Set the display name BEFORE registering the protocol so Chrome/Windows
// shows "Open XeroxQ" instead of "Open Electron" in the protocol prompt.
app.setName('XeroxQ');

// Register 'xeroxq://' as the app's custom URL scheme so the system browser
// can redirect back here after Google OAuth completes.
if (!app.isPackaged) {
  // In dev, use the app's own executable path
  app.setAsDefaultProtocolClient('xeroxq', process.execPath, [
    require('path').resolve(process.argv[1] || '.')
  ]);
} else {
  app.setAsDefaultProtocolClient('xeroxq');
}

// ── Patch Windows registry to show "XeroxQ" instead of "Electron" ────────────
// Chrome reads the (Default) value of HKCU\Software\Classes\xeroxq to build
// the "Open X?" dialog title. Electron sets this to "Electron" (from its exe
// ProductName). We override it immediately after registration.
if (process.platform === 'win32') {
  try {
    const { execSync } = require('child_process');
    // Set the root key default value — this is what Chrome uses as the app name
    execSync('reg add "HKCU\\Software\\Classes\\xeroxq" /ve /d "XeroxQ" /f', {
      windowsHide: true,
      stdio: 'ignore',
    });
    // Also set the friendly name sub-key used by some Windows dialogs
    execSync('reg add "HKCU\\Software\\Classes\\xeroxq" /v "ApplicationName" /d "XeroxQ" /f', {
      windowsHide: true,
      stdio: 'ignore',
    });
    console.log('[XeroxQ] Registry display name set to "XeroxQ"');
  } catch (e) {
    // Non-critical — protocol still works, just shows wrong name
    console.warn('[XeroxQ] Could not patch registry display name:', e.message);
  }
}


// Handle deep link on Windows/Linux (second-instance event)
app.on('second-instance', (_event, argv) => {
  console.log('[XeroxQ OAuth] second-instance argv:', argv);
  // On Windows, the URL may be wrapped in quotes — strip them before matching
  const rawUrl = argv
    .map(arg => arg.replace(/^"|"$/g, '').trim())  // strip surrounding quotes
    .find(arg => arg.startsWith('xeroxq://'));
  if (rawUrl) handleDeepLink(rawUrl);
  // Bring the window to focus
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function handleDeepLink(rawUrl) {
  console.log('[XeroxQ OAuth] Deep link received (raw):', rawUrl);
  try {
    // Decode any URL-encoded characters Windows may have applied
    const url = decodeURIComponent(rawUrl);
    console.log('[XeroxQ OAuth] Deep link decoded:', url);

    const parsed = new URL(url);

    // Case 1: Server forwarded the raw PKCE code for client-side exchange
    const code = parsed.searchParams.get('code');

    // Case 2: Direct tokens (fallback / non-PKCE flows)
    const accessToken  = parsed.searchParams.get('access_token');
    const refreshToken = parsed.searchParams.get('refresh_token');
    const oauthError   = parsed.searchParams.get('error');

    // Also check hash fragment (Supabase implicit flow uses #)
    let hashAccessToken = null, hashRefreshToken = null;
    if (parsed.hash) {
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      hashAccessToken  = hashParams.get('access_token');
      hashRefreshToken = hashParams.get('refresh_token');
    }

    const finalAccessToken  = accessToken  || hashAccessToken;
    const finalRefreshToken = refreshToken || hashRefreshToken;

    console.log('[XeroxQ OAuth] Parsed — code:', code ? 'present' : 'none',
                '| access:', finalAccessToken ? 'present' : 'none',
                '| refresh:', finalRefreshToken ? 'present' : 'none',
                '| error:', oauthError || 'none');

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('oauth-callback', {
        code,
        accessToken:  finalAccessToken,
        refreshToken: finalRefreshToken,
        error: oauthError,
      });
      mainWindow.focus();
    }
  } catch (e) {
    console.error('[XeroxQ OAuth] Failed to parse deep link:', e);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('oauth-callback', { error: 'parse-failed' });
    }
  }
}

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

// Set Windows App User Model ID so Windows taskbar uses XeroxQ name & custom icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.xeroxq.desktop');
}

let mainWindow;

// Returns the correct icon based on platform, system theme, and availability
function getIcon() {
  const isDark = nativeTheme.shouldUseDarkColors;
  const icoPath = path.join(__dirname, '../build/icon.ico');
  const whiteSvgPath = path.join(__dirname, '../public/xeroxq_logo_white.svg');
  const darkSvgPath = path.join(__dirname, '../public/xeroxq_logo_dark.svg');

  const themeSvg = isDark ? whiteSvgPath : darkSvgPath;
  if (fs.existsSync(themeSvg)) {
    const img = nativeImage.createFromPath(themeSvg);
    if (!img.isEmpty()) return img;
  }

  if (process.platform === 'win32' && fs.existsSync(icoPath)) {
    return icoPath;
  }
  return path.join(__dirname, '../public/icon.png');
}

// Update icon dynamically when system theme changes
nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const icon = getIcon();
    mainWindow.setIcon(icon);
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'XeroxQ',
    icon: getIcon(),
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0, 0, 0, 0)',
      symbolColor: '#18181b',
      height: 38,
    },
    autoHideMenuBar: true, // Hide the default menu bar completely for a clean look
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Prevent Next.js page title (SEO metadata) from overwriting the clean app title bar
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  // Explicitly remove the default application menu completely
  Menu.setApplicationMenu(null);

  // Check if we're running in development or production (using app.isPackaged)
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:3000/register'
    : 'app://local/register';

  // Automatically retry loading if cold Next.js dev compilation is slow
  if (isDev) {
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      // Ignore user-initiated aborts (-3)
      if (errorCode === -3) return;
      console.warn(`[XeroxQ Dev] Navigation failed for ${validatedURL} (${errorCode}: ${errorDescription}). Retrying in 1s...`);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(startUrl);
        }
      }, 1000);
    });
  }

  mainWindow.loadURL(startUrl);

  // Open DevTools ONLY during local development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Dynamically swap the taskbar/window icon when the system theme changes
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIcon(getIcon());
    }
  });
}

// ── IPC: Open OAuth in system browser ────────────────────────────────────────
// Called by the renderer when the user clicks "Continue with Google".
// Opens the OAuth URL in the default system browser (Chrome, Edge, etc.)
ipcMain.handle('open-oauth-url', async (_event, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// ── IPC: Open password reset link in system browser ───────────────────────────
ipcMain.handle('open-reset-password-url', async (_event, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// ── IPC: Open dedicated XeroxQ Studio window ──────────────────────────────
ipcMain.handle('open-studio-window', async (_event, params) => {
  try {
    const studioWin = new BrowserWindow({
      title: 'XeroxQ Studio',
      icon: getIcon(),
      width: 1280,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      show: false,
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: 'rgba(0, 0, 0, 0)',
        symbolColor: '#18181b',
        height: 38,
      },
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    studioWin.maximize();
    studioWin.show();

    studioWin.on('page-title-updated', (event) => event.preventDefault());

    const isDev = !app.isPackaged;
    const query = new URLSearchParams(params).toString();
    const studioUrl = isDev
      ? `http://localhost:3000/studio?${query}`
      : `app://local/studio?${query}`;

    if (isDev) {
      studioWin.webContents.openDevTools();
    }

    studioWin.loadURL(studioUrl);
    return { success: true };
  } catch (err) {
    console.error('[XeroxQ Studio Window Exception]:', err);
    return { success: false, error: err.message };
  }
});

// ── IPC: Close focused window ──────────────────────────────────────────────
ipcMain.handle('close-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
  return { success: true };
});

app.whenReady().then(async () => {
  const { session } = require('electron');

  // Automatically grant all application permissions (clipboard, notifications, printing, storage)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => {
    return true;
  });

  // Handle app:// protocol requests for static files from out/
  protocol.handle('app', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let relativePath = parsedUrl.pathname;
      if (relativePath === '/' || relativePath === '') {
        relativePath = '/register';
      }

      let targetPath = path.normalize(path.join(__dirname, '../out', relativePath));

      // Handle routes without file extensions (e.g. /register -> /register.html)
      if (!path.extname(targetPath)) {
        if (fs.existsSync(targetPath + '.html')) {
          targetPath = targetPath + '.html';
        } else if (fs.existsSync(path.join(targetPath, 'index.html'))) {
          targetPath = path.join(targetPath, 'index.html');
        }
      }

      return net.fetch(`file://${targetPath}`);
    } catch (e) {
      console.error('[XeroxQ Protocol Error]:', e);
      return new Response('File not found', { status: 404 });
    }
  });

  if (!app.isPackaged) {
    try {
      const { session } = require('electron');
      await session.defaultSession.clearStorageData({
        storages: ['hsts', 'cookies', 'cache', 'serviceworkers']
      });
      console.log('[XeroxQ Dev] Cleared dev session storage & HSTS policies.');
    } catch (e) {
      console.error('[XeroxQ Dev] Error clearing dev session storage:', e);
    }
  }
  createWindow();
});

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
      let ext = '.pdf';
      if (base64Data.includes('data:image/png')) ext = '.png';
      else if (base64Data.includes('data:image/jpeg') || base64Data.includes('data:image/jpg')) ext = '.jpg';
      else if (base64Data.includes('data:application/pdf')) ext = '.pdf';
      else if (filePath) ext = path.extname(filePath.split('?')[0]) || '.pdf';

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

    // ── Map UI options → pdf-to-printer API (Windows) ────────────────────────
    // IMPORTANT: pdf-to-printer uses:
    //   - `side: 'duplex'|'duplexshort'|'duplexlong'|'simplex'`  (NOT a boolean)
    //   - `pages: '1,3,5'` or `'1-3,5'`  for custom page ranges
    //   - `subset: 'odd'|'even'`  for odd/even page filtering
    //   - `monochrome: true`  for black & white
    //   - `copies: number`  for number of copies
    const printOptions = {
      printer: options.printer,
      copies: options.copies || 1,
      monochrome: options.monochrome === true,                       // B&W toggle
      side: options.side === 'duplex' ? 'duplex' : 'simplex',       // Duplex string
      orientation: options.orientation || 'portrait',
      scale: 'fit',                                                  // Fit content to page
    };

    // Paper size (only pass if explicitly set, not the default A4 fallback)
    if (options.paperSize && options.paperSize !== 'A4') {
      printOptions.paperSize = options.paperSize;
    }

    // ── Page Range mapping ───────────────────────────────────────────────────
    const pageRange = options.pageRange;
    if (pageRange === 'odd') {
      printOptions.subset = 'odd';                                   // Print only odd pages
    } else if (pageRange === 'even') {
      printOptions.subset = 'even';                                  // Print only even pages
    } else if (pageRange && pageRange !== 'all' && pageRange.trim()) {
      // Custom input: user typed "1,3,5" or "1-3,5" — pass directly as `pages`
      // Normalize: remove spaces so "1, 3, 5" becomes "1,3,5"
      printOptions.pages = pageRange.replace(/\s+/g, '');
    }
    // If 'all', don't set pages or subset — SumatraPDF prints everything by default

    console.log(`[XeroxQ] Spooling Protocol Initiated:`, { targetPath, printOptions });

    if (process.platform === 'win32') {
      await pdfToPrinter.print(targetPath, printOptions);
    } else {
      await printUnix(targetPath, {
        printer: options.printer,
        copies: options.copies || 1,
        monochrome: options.monochrome === true,
        side: options.side === 'duplex' ? 'duplex' : 'simplex',
        orientation: options.orientation || 'portrait',
        paperSize: options.paperSize,
      });
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

// Virtual/software printer names to filter out (shown below physical ones, not hidden)
const VIRTUAL_PRINTER_KEYWORDS = [
  'onenote', 'fax', 'xps document writer', 'root print queue',
  'microsoft print to pdf', 'adobe pdf', 'foxit', 'bullzip',
  'dopdf', 'pdf creator', 'cutepdf',
];

function isVirtualPrinter(name) {
  const lower = name.toLowerCase();
  return VIRTUAL_PRINTER_KEYWORDS.some(kw => lower.includes(kw));
}

// Get available printers (cross-platform abstraction)
ipcMain.handle('get-printers', async (event) => {
  try {
    let rawPrinters = [];
    if (process.platform === 'win32') {
      try {
        // Prefer Electron's built-in getPrintersAsync (most accurate on Windows)
        if (event.sender && typeof event.sender.getPrintersAsync === 'function') {
          rawPrinters = await event.sender.getPrintersAsync();
          console.log('[XeroxQ Spooler] getPrintersAsync returned', rawPrinters.length, 'printers');
        } else {
          rawPrinters = await pdfToPrinter.getPrinters();
          console.log('[XeroxQ Spooler] pdfToPrinter.getPrinters returned', rawPrinters.length, 'printers');
        }
      } catch (e) {
        console.warn('[XeroxQ Spooler] Primary printer fetch failed, falling back to pdfToPrinter:', e.message);
        try {
          rawPrinters = await pdfToPrinter.getPrinters();
        } catch (e2) {
          console.error('[XeroxQ Spooler] pdfToPrinter fallback also failed:', e2.message);
        }
      }
    } else {
      rawPrinters = await getPrintersUnix();
    }

    // Deduplicate and standardize printer list
    const printerMap = new Map();
    for (const p of rawPrinters) {
      const name = typeof p === 'string' ? p : (p.name || p.displayName || p.deviceId || '');
      if (!name) continue;
      if (printerMap.has(name)) continue;
      printerMap.set(name, {
        name,
        displayName: (typeof p === 'object' && p.displayName) ? p.displayName : name,
        isDefault: (typeof p === 'object' && p.isDefault) ? true : false,
        status:    (typeof p === 'object' && p.status !== undefined) ? p.status : 0,
        isVirtual: isVirtualPrinter(name),
      });
    }

    // Sort: physical printers first, default printer at the very top, virtual last
    const printers = Array.from(printerMap.values()).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (!a.isVirtual && b.isVirtual) return -1;
      if (a.isVirtual && !b.isVirtual) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    console.log('[XeroxQ Spooler] Final printer list:', printers.map(p => `${p.displayName}${p.isDefault ? ' [DEFAULT]' : ''}${p.isVirtual ? ' [VIRTUAL]' : ''}`));
    return { success: true, printers };
  } catch (error) {
    console.error('[XeroxQ Spooler] Get Printers Error:', error);
    return { 
      success: false, 
      error: error.message,
      printers: []
    };
  }
});
