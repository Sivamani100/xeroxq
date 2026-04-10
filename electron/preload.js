const { contextBridge, ipcRenderer } = require('electron');

const bridge = {
  printNative: (data) => ipcRenderer.invoke('print-native', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
};

contextBridge.exposeInMainWorld('electron', bridge);
contextBridge.exposeInMainWorld('electronAPI', bridge);
