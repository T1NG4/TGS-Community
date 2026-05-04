const { contextBridge, ipcRenderer } = require('electron');

// Expose shell functionality to renderer process via IPC
contextBridge.exposeInMainWorld('electronAPI', {
  openPacksFolder: async () => {
    try {
      const result = await ipcRenderer.invoke('open-packs-folder');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  closeWindow: () => {
    ipcRenderer.send('close-window');
  },
  minimizeWindow: () => {
    ipcRenderer.send('minimize-window');
  },
  toggleFullscreen: () => {
    ipcRenderer.send('toggle-fullscreen');
  }
});
