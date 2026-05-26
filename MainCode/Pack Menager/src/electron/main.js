'use strict';

const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const net = require('net');
const { createApp, setPaths, getOutputPath } = require('../server/src/app');
const { setupAutoUpdater } = require('./autoUpdater');
const {
  setupDevTools,
  wantDevToolsOnStartup,
  unregisterGlobalDevToolsShortcuts,
} = require('./devtools');

// ─── Configuration ────────────────────────────────────────────────────────────
const DEFAULT_PORT = 3791;
const isDev = !app.isPackaged;

if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// Segurança: Garantir que o App seja executado apenas pelo Launcher
if (!isDev && !process.argv.includes('--token=TGS_SECURE_AUTH_2026')) {
  console.error('Acesso Negado: Este aplicativo deve ser iniciado pelo TGS Launcher.');
  app.quit();
  process.exit(1);
}
// Em dev, raiz do projeto = pasta "codigo fonte" (pai de src/), alinhado a app.js do server.
// Empacotado: incluir `[TGS-Fivem-Pack]` em extraResources do electron-builder → process.resourcesPath
const ROOT = isDev ? path.join(__dirname, '..', '..') : process.resourcesPath;

const BASE_PATH = path.join(ROOT, '[TGS-Fivem-Pack]');
const OUTPUT_PATH = path.join(ROOT, 'output');
const DIST_PATH = path.join(__dirname, '..', 'client', 'dist');

// ─── Express ──────────────────────────────────────────────────────────────────
function findAvailablePort(startPort, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryPort = (port) => {
      const tester = net.createServer();
      tester.once('error', () => {
        attempt += 1;
        if (attempt >= maxAttempts) {
          reject(new Error(`Nenhuma porta disponível a partir de ${startPort}`));
          return;
        }
        tryPort(port + 1);
      });
      tester.once('listening', () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, '127.0.0.1');
    };

    tryPort(startPort);
  });
}

function startServer(port) {
  // Set up IPC bridge for server to communicate with main process
  global.electronAPI = {
    openPacksFolder: async () => {
      try {
        await shell.openPath(getOutputPath());
        return { success: true, message: 'Pasta aberta com sucesso!' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  setPaths(BASE_PATH, OUTPUT_PATH, DIST_PATH);
  const expressApp = createApp(!isDev); // serve static only in production
  expressApp.listen(port, () =>
    console.log(`[Backend] Express em http://localhost:${port}  |  Output → ${OUTPUT_PATH}`)
  );
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 1100,
    minHeight: 680,
    title: 'FiveM Car Pack Manager',
    backgroundColor: '#09090b',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
    },
    show: false,
  });

  Menu.setApplicationMenu(null);

  const url = isDev ? 'http://localhost:5173' : `http://localhost:${port}`;
  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href);
    return { action: 'deny' };
  });

  setupDevTools(mainWindow, {
    openOnStart: isDev || wantDevToolsOnStartup(),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'bottom' });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ───────────────────────────────────────────────────────────
ipcMain.handle('open-external-url', async (_event, url) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return { success: false, error: 'URL inválida' };
    }
    await shell.openExternal(url.trim());
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-packs-folder', async () => {
  try {
    await shell.openPath(getOutputPath());
    return { success: true, message: 'Pasta aberta com sucesso!' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('toggle-devtools', () => {
  if (!mainWindow?.webContents) return { opened: false };
  const wc = mainWindow.webContents;
  if (wc.isDevToolsOpened()) {
    wc.closeDevTools();
    return { opened: false };
  }
  wc.openDevTools({ mode: 'detach' });
  return { opened: true };
});

ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    } else {
      mainWindow.setFullScreen(true);
    }
  }
});

app.whenReady().then(() => {
  // Request admin permissions for shell operations
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('net session', (error, stdout, stderr) => {
      if (error || stderr.includes('Access is denied')) {
        console.log('[Admin] Running without admin privileges - some features may be limited');
      } else {
        console.log('[Admin] Running with admin privileges');
      }
    });
  }
  
  if (isDev) {
    startServer(DEFAULT_PORT);
    createWindow(DEFAULT_PORT);
    setupAutoUpdater(mainWindow);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(DEFAULT_PORT);
    });
    return;
  }

  // Produção: evitar crash se a porta padrão já estiver em uso.
  findAvailablePort(DEFAULT_PORT)
    .then((port) => {
      startServer(port);
      createWindow(port);
      setupAutoUpdater(mainWindow);
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
      });
    })
    .catch((err) => {
      console.error('[Backend] Falha ao iniciar servidor:', err);
      app.quit();
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  unregisterGlobalDevToolsShortcuts();
});
