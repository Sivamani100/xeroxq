const { contextBridge, ipcRenderer } = require('electron');

const bridge = {
  // ── Printing ──────────────────────────────────────────────────────────────
  printNative: (data) => ipcRenderer.invoke('print-native', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),

  // ── OAuth: open Google sign-in in the system browser ──────────────────────
  // Returns a promise that resolves once the URL has been opened externally.
  openOAuthUrl: (url) => ipcRenderer.invoke('open-oauth-url', url),

  // ── OAuth: listen for the deep-link token coming back from the browser ─────
  // callback receives { accessToken, refreshToken, error } parsed in main process.
  onOAuthCallback: (callback) => {
    ipcRenderer.on('oauth-callback', (_event, data) => callback(data));
    // Return a cleanup function
    return () => ipcRenderer.removeAllListeners('oauth-callback');
  },

  // ── Password Reset: open the reset link in the system browser ─────────────
  openResetPasswordUrl: (url) => ipcRenderer.invoke('open-reset-password-url', url),
};

contextBridge.exposeInMainWorld('electron', bridge);
contextBridge.exposeInMainWorld('electronAPI', bridge);
