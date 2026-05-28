const { ipcRenderer } = require('electron');

// Expor o ipcRenderer diretamente para o renderer process (contextIsolation: false)
window.ipcRenderer = ipcRenderer;

// Também expor como electronAPI para compatibilidade
window.electronAPI = {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args)
};

console.log('Preload script carregado - ipcRenderer exposto');
