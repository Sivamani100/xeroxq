const { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell, nativeImage, protocol, net } = require('electron');
const path = require('path');
const pdfToPrinter = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');

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
  app.setAppUserModelId('com.xeroxq.desktop');
}

// ── Single Instance Lock (required for deep-link on Windows) ─────────────────
// Ensures only one instance runs at a time. When the system browser redirects
// to xeroxq://, Windows launches a second instance with the URL as an arg.
// We grab the lock here, and if we're that second instance, quit immediately
// (the 'second-instance' event on the primary instance handles it).
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
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
  try {
    const url = decodeURIComponent(rawUrl);
    const parsed = new URL(url);

    if (parsed.protocol !== 'xeroxq:' || (parsed.hostname !== 'auth' && !parsed.pathname.startsWith('/auth'))) {
      console.warn('[XeroxQ OAuth] Ignored untrusted deep-link target:', parsed.protocol, parsed.hostname);
      return;
    }

    console.log('[XeroxQ OAuth] Deep link received:', `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`);

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

let mainWindow;

// Resolve real filesystem paths (preferring app.asar.unpacked when packaged so Windows native APIs work)
function resolveAppAsset(relPath) {
  const unpackedCandidate = process.resourcesPath
    ? path.join(process.resourcesPath, 'app.asar.unpacked', relPath)
    : null;
  if (unpackedCandidate && fs.existsSync(unpackedCandidate)) {
    return unpackedCandidate;
  }
  return path.join(__dirname, '..', relPath);
}

// Returns a valid NativeImage (preferring 512x512 PNG because nativeImage decodes PNG cleanly on Windows/macOS/Linux)
function getAppIcon() {
  const candidates = [
    resolveAppAsset('build/icon.png'),
    resolveAppAsset('public/logo_color.png'),
    resolveAppAsset('public/icon.png'),
    resolveAppAsset('build/icon.ico'),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const img = nativeImage.createFromPath(candidate);
      if (img && !img.isEmpty()) {
        return { path: candidate, image: img };
      }
    } catch {
      // try next candidate
    }
  }
  const fallbackPath = resolveAppAsset('build/icon.ico');
  return { path: fallbackPath, image: null };
}

function getIcon() {
  return getAppIcon().path;
}

// Update icon dynamically when system theme changes
nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const { image } = getAppIcon();
    if (image && !image.isEmpty()) {
      mainWindow.setIcon(image);
    }
  }
});

function isAllowedAppNavigation(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (!app.isPackaged) {
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      );
    }
    return parsed.protocol === 'app:' && parsed.hostname === 'local';
  } catch {
    return false;
  }
}

function attachNavigationGuards(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isAllowedAppNavigation(targetUrl)) {
      console.warn('[XeroxQ Security] Blocked unexpected navigation:', targetUrl);
      event.preventDefault();
    }
  });
}

function createWindow() {
  const { path: iconPath, image: appIcon } = getAppIcon();

  mainWindow = new BrowserWindow({
    title: 'XeroxQ',
    icon: (appIcon && !appIcon.isEmpty()) ? appIcon : iconPath,
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

  if (appIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }
  if (process.platform === 'darwin' && app.dock && appIcon && !appIcon.isEmpty()) {
    app.dock.setIcon(appIcon);
  }

  // Prevent Next.js page title (SEO metadata) from overwriting the clean app title bar
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  attachNavigationGuards(mainWindow);

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
}

function isSafeExternalUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const allowedHosts = ['accounts.google.com', 'supabase.co', 'xeroxq.arkio.in', 'localhost', '127.0.0.1'];
    return allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

// ── IPC: Open OAuth in system browser ────────────────────────────────────────
// Called by the renderer when the user clicks "Continue with Google".
// Opens the OAuth URL in the default system browser (Chrome, Edge, etc.)
ipcMain.handle('open-oauth-url', async (_event, url) => {
  if (!isSafeExternalUrl(url)) {
    console.error('[XeroxQ Security] Blocked untrusted OAuth URL:', url);
    return { success: false, error: 'Disallowed URL' };
  }
  await shell.openExternal(url);
  return { success: true };
});

// ── IPC: Open password reset link in system browser ───────────────────────────
ipcMain.handle('open-reset-password-url', async (_event, url) => {
  if (!isSafeExternalUrl(url)) {
    console.error('[XeroxQ Security] Blocked untrusted reset password URL:', url);
    return { success: false, error: 'Disallowed URL' };
  }
  await shell.openExternal(url);
  return { success: true };
});

// ── IPC: Open dedicated XeroxQ Studio window ──────────────────────────────
ipcMain.handle('open-studio-window', async (_event, params) => {
  try {
    const docPath = typeof params?.documentPath === 'string' ? params.documentPath.trim() : '';
    const allowedRemote = docPath.startsWith('http://') || docPath.startsWith('https://')
      ? isTrustedRemotePrintUrl(docPath)
      : docPath.startsWith('blob:') || docPath.startsWith('data:image/') || docPath.startsWith('data:application/pdf') || (docPath.startsWith('/') && !docPath.startsWith('//'));
    if (!docPath || !allowedRemote) {
      return { success: false, error: 'Untrusted document source blocked' };
    }

    const { path: iconPath, image: studioIcon } = getAppIcon();
    const studioWin = new BrowserWindow({
      title: 'XeroxQ Studio',
      icon: (studioIcon && !studioIcon.isEmpty()) ? studioIcon : iconPath,
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

    if (studioIcon && !studioIcon.isEmpty()) {
      studioWin.setIcon(studioIcon);
    }
    if (process.platform === 'darwin' && app.dock && studioIcon && !studioIcon.isEmpty()) {
      app.dock.setIcon(studioIcon);
    }

    studioWin.maximize();
    studioWin.show();

    studioWin.on('page-title-updated', (event) => event.preventDefault());
    attachNavigationGuards(studioWin);

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

  // Restrict application permissions to explicit safe list (notifications, clipboard)
  const SAFE_PERMISSIONS = new Set(['notifications', 'clipboard-read', 'clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(SAFE_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return SAFE_PERMISSIONS.has(permission);
  });

  // Handle app:// protocol requests for static files from out/
  protocol.handle('app', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let relativePath = parsedUrl.pathname;
      if (relativePath === '/' || relativePath === '') {
        relativePath = '/register';
      }

      const outDir = path.resolve(__dirname, '../out');
      let targetPath = path.normalize(path.join(outDir, relativePath));

      if (targetPath !== outDir && !targetPath.startsWith(outDir + path.sep)) {
        console.error('[XeroxQ Security] Path traversal blocked:', targetPath);
        return new Response('Access Denied', { status: 403 });
      }

      // Handle routes without file extensions (e.g. /register -> /register.html)
      if (!path.extname(targetPath)) {
        if (fs.existsSync(targetPath + '.html')) {
          targetPath = targetPath + '.html';
        } else if (fs.existsSync(path.join(targetPath, 'index.html'))) {
          targetPath = path.join(targetPath, 'index.html');
        }
      }

      if (!fs.existsSync(targetPath)) {
        return new Response('File not found', { status: 404 });
      }

      return net.fetch(pathToFileURL(targetPath).href);
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
    const safeToken = /^[a-zA-Z0-9._\-]{1,48}$/;
    const safePrinter = /^[a-zA-Z0-9._\- @]{1,128}$/;
    const args = [];
    if (options.printer) {
      const printer = String(options.printer).trim();
      if (!safePrinter.test(printer) || printer.startsWith('-')) {
        return reject(new Error('Invalid printer name'));
      }
      args.push('-d', printer);
    }
    if (options.copies) {
      const copies = Math.max(1, Math.min(999, Math.trunc(Number(options.copies) || 1)));
      args.push('-n', String(copies));
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
      const media = String(options.paperSize).trim();
      if (!safeToken.test(media)) {
        return reject(new Error('Invalid paperSize parameter'));
      }
      args.push('-o', `media=${media}`);
    }
    if (options.bin) {
      const bin = String(options.bin).trim();
      if (!safeToken.test(bin)) {
        return reject(new Error('Invalid paper tray bin parameter'));
      }
      args.push('-o', `InputSlot=${bin}`);
    }
    
    // End CUPS options before passing filePath
    args.push('--', filePath);
    
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

function isTrustedRemotePrintUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    let configuredHost = '';
    if (configuredSiteUrl) {
      try {
        configuredHost = new URL(configuredSiteUrl).hostname.toLowerCase();
      } catch {
        configuredHost = '';
      }
    }
    if (parsed.protocol === 'https:') {
      return (
        host.endsWith('.supabase.co') ||
        host.endsWith('.supabase.in') ||
        (configuredHost && host === configuredHost) ||
        host === 'localhost' ||
        host === '127.0.0.1'
      );
    }
    if (parsed.protocol === 'http:' && !app.isPackaged) {
      return host === 'localhost' || host === '127.0.0.1';
    }
    return false;
  } catch {
    return false;
  }
}

function downloadTrustedRemoteFile(rawUrl, destPath, redirectsLeft = 3) {
  const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    if (!isTrustedRemotePrintUrl(rawUrl)) {
      return reject(new Error('Untrusted remote print URL rejected'));
    }
    const parsed = new URL(rawUrl);
    const transport = parsed.protocol === 'https:' ? require('https') : require('http');
    const req = transport.get(parsed, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        if (redirectsLeft <= 0) {
          return reject(new Error('Too many redirects while fetching document'));
        }
        const redirectTarget = new URL(response.headers.location, parsed).toString();
        return downloadTrustedRemoteFile(redirectTarget, destPath, redirectsLeft - 1)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`Server returned status code ${response.statusCode}`));
      }

      const contentLength = Number(response.headers['content-length'] || 0);
      if (contentLength > MAX_DOWNLOAD_BYTES) {
        response.destroy();
        return reject(new Error('Document exceeds 50MB download limit'));
      }

      const file = fs.createWriteStream(destPath);
      let received = 0;
      response.on('data', (chunk) => {
        received += chunk.length;
        if (received > MAX_DOWNLOAD_BYTES) {
          response.destroy();
          file.close(() => {
            fs.unlink(destPath, () => {});
            reject(new Error('Document exceeds 50MB download limit'));
          });
        }
      });
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
      file.on('error', (err) => {
        file.close(() => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });
    });
    req.setTimeout(30000, () => {
      req.destroy(new Error('Document download timed out'));
    });
    req.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// IPC handler for printing natively
ipcMain.handle('print-native', async (_event, { filePath, base64Data, options = {} }) => {
  const resolvedJobsDir = path.resolve(printJobsDir);
  const isTempFile = !!(base64Data || (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))));
  let targetPath = '';

  try {
    // Handle incoming Base64 payload, trusted remote signed URL, or isolated printJobsDir file only
    if (base64Data) {
      if (typeof base64Data !== 'string') {
        throw new Error('Invalid base64 print payload');
      }
      const base64Content = base64Data.split(';base64,').pop() || '';
      if (!base64Content || base64Content.length > 70 * 1024 * 1024) {
        throw new Error('Base64 print payload empty or exceeds size limit');
      }
      let ext = '.pdf';
      if (base64Data.includes('data:image/png')) ext = '.png';
      else if (base64Data.includes('data:image/jpeg') || base64Data.includes('data:image/jpg')) ext = '.jpg';
      else if (base64Data.includes('data:image/webp')) ext = '.webp';
      else if (base64Data.includes('data:application/pdf')) ext = '.pdf';

      targetPath = path.join(resolvedJobsDir, `xeroxq-print-${Date.now()}${ext}`);
      fs.writeFileSync(targetPath, base64Content, { encoding: 'base64' });
    } else if (filePath && (filePath.startsWith('https://') || filePath.startsWith('http://'))) {
      if (!isTrustedRemotePrintUrl(filePath)) {
        throw new Error('Blocked untrusted remote document URL');
      }
      const pathname = new URL(filePath).pathname.toLowerCase();
      let ext = '.pdf';
      if (pathname.endsWith('.png')) ext = '.png';
      else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) ext = '.jpg';
      else if (pathname.endsWith('.webp')) ext = '.webp';

      targetPath = path.join(resolvedJobsDir, `xeroxq-remote-${Date.now()}${ext}`);
      await downloadTrustedRemoteFile(filePath, targetPath);
    } else if (typeof filePath === 'string' && filePath.trim()) {
      const candidatePath = path.resolve(filePath.trim());
      if (!candidatePath.startsWith(resolvedJobsDir + path.sep) || !fs.existsSync(candidatePath)) {
        throw new Error('Blocked arbitrary local or network file print path');
      }
      targetPath = candidatePath;
    } else {
      throw new Error('Missing print document source');
    }

    const sanitizedCopies = Math.max(1, Math.min(999, Math.trunc(Number(options.copies) || 1)));
    const sanitizedPrinter =
      typeof options.printer === 'string' && /^[a-zA-Z0-9._\- @]{1,128}$/.test(options.printer.trim()) && !options.printer.trim().startsWith('-')
        ? options.printer.trim()
        : undefined;
    const sanitizedPaperSize =
      typeof options.paperSize === 'string' && /^[a-zA-Z0-9._\-]{1,48}$/.test(options.paperSize.trim())
        ? options.paperSize.trim()
        : undefined;
    const sanitizedOrientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';

    // ── Map UI options → pdf-to-printer API (Windows) ────────────────────────
    // IMPORTANT: pdf-to-printer uses:
    //   - `side: 'duplex'|'duplexshort'|'duplexlong'|'simplex'`  (NOT a boolean)
    //   - `pages: '1,3,5'` or `'1-3,5'`  for custom page ranges
    //   - `subset: 'odd'|'even'`  for odd/even page filtering
    //   - `monochrome: true`  for black & white
    //   - `copies: number`  for number of copies
    const printOptions = {
      ...(sanitizedPrinter ? { printer: sanitizedPrinter } : {}),
      copies: sanitizedCopies,
      monochrome: options.monochrome === true,                       // B&W toggle
      side: options.side === 'duplex' ? 'duplex' : 'simplex',       // Duplex string
      orientation: sanitizedOrientation,
      scale: 'fit',                                                  // Fit content to page
    };

    // Paper size (only pass if explicitly set, not the default A4 fallback)
    if (sanitizedPaperSize && sanitizedPaperSize !== 'A4') {
      printOptions.paperSize = sanitizedPaperSize;
    }

    // ── Page Range mapping ───────────────────────────────────────────────────
    const pageRange = options.pageRange;
    if (pageRange === 'odd') {
      printOptions.subset = 'odd';                                   // Print only odd pages
    } else if (pageRange === 'even') {
      printOptions.subset = 'even';                                  // Print only even pages
    } else if (typeof pageRange === 'string' && pageRange !== 'all' && pageRange.trim()) {
      const cleanedPages = pageRange.replace(/\s+/g, '');
      if (/^[0-9,\-]+$/.test(cleanedPages)) {
        printOptions.pages = cleanedPages;
      }
    }
    // If 'all', don't set pages or subset — SumatraPDF prints everything by default

    console.log(`[XeroxQ] Spooling Protocol Initiated:`, { targetPath, printOptions });

    if (process.platform === 'win32') {
      await pdfToPrinter.print(targetPath, printOptions);
    } else {
      await printUnix(targetPath, {
        printer: sanitizedPrinter,
        copies: sanitizedCopies,
        monochrome: options.monochrome === true,
        side: options.side === 'duplex' ? 'duplex' : 'simplex',
        orientation: sanitizedOrientation,
        paperSize: sanitizedPaperSize,
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
