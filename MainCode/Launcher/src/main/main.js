const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const logger = require('./logger');
const installer = require('./installer');
const config = require('./config');

let mainWindow;

// Configuração do auto-updater
autoUpdater.autoDownload = true; // Baixar automaticamente quando disponível
autoUpdater.autoInstallOnAppQuit = false; // Aguardar confirmação do usuário (melhor UX)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 780,
    height: 410,
    minWidth: 780,
    minHeight: 48,
    maxWidth: 780,
    maxHeight: 538,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png'),
    title: 'TGS Launcher',
    backgroundColor: '#060810',
  });

  const startUrl = isDev
    ? 'http://localhost:5175'
    : `file://${path.join(__dirname, '../../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Launcher window created');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Configurar auto-updater apenas em produção
  if (!isDev) {
    logger.info('[AutoUpdate] Iniciando verificação de updates...');
    
    // Configurar feed do GitHub (usando valores do package.json build.publish)
    const feedUrl = autoUpdater.getFeedURL();
    logger.info(`[AutoUpdate] Feed URL configurado: ${feedUrl || 'padrão do electron-builder'}`);
    
    // Iniciar verificação automática após 5 segundos (para não atrasar startup)
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        logger.error('[AutoUpdate] Erro ao verificar updates:', err);
      });
    }, 5000);
  } else {
    logger.info('[AutoUpdate] Modo de desenvolvimento - auto-update desabilitado');
  }

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    logger.info('Update available', info);
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available', info);
    mainWindow?.webContents.send('update-not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    logger.info('Download progress', progress);
    mainWindow?.webContents.send('download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded', info);
    mainWindow?.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    logger.error('Auto-updater error', err);
    mainWindow?.webContents.send('update-error', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('check-system', async () => {
  try {
    const result = await installer.checkSystem();
    logger.info('System check completed', result);
    return result;
  } catch (error) {
    logger.error('System check failed', error);
    throw error;
  }
});

ipcMain.handle('start-installation', async (event, config) => {
  try {
    const result = await installer.startInstallation(config, (progress) => {
      event.sender.send('installation-progress', progress);
    });
    logger.info('Installation completed', result);
    return result;
  } catch (error) {
    logger.error('Installation failed', error);
    throw error;
  }
});

ipcMain.handle('cancel-installation', async () => {
  try {
    await installer.cancelInstallation();
    logger.info('Installation cancelled');
    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel installation', error);
    throw error;
  }
});

ipcMain.handle('save-config', async (event, configData) => {
  try {
    await config.save(configData);
    logger.info('Configuration saved', configData);
    return { success: true };
  } catch (error) {
    logger.error('Failed to save configuration', error);
    throw error;
  }
});

ipcMain.handle('load-config', async () => {
  try {
    const configData = await config.load();
    logger.info('Configuration loaded', configData);
    return configData;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw error;
  }
});

ipcMain.handle('check-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    logger.info('Update check initiated');
    return { success: true };
  } catch (error) {
    logger.error('Update check failed', error);
    throw error;
  }
});

ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall();
    logger.info('Update installation initiated');
    return { success: true };
  } catch (error) {
    logger.error('Update installation failed', error);
    throw error;
  }
});

ipcMain.handle('get-logs', async () => {
  try {
    const logs = await logger.getLogs();
    return logs;
  } catch (error) {
    logger.error('Failed to get logs', error);
    throw error;
  }
});

ipcMain.handle('clear-cache', async () => {
  try {
    await installer.clearCache();
    logger.info('Cache cleared');
    return { success: true };
  } catch (error) {
    logger.error('Failed to clear cache', error);
    throw error;
  }
});

ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('window-resize', (event, { width, height }) => {
  if (mainWindow) {
    console.log(`[Main] Redimensionando para: ${width}x${height}`);
    mainWindow.setResizable(true);
    mainWindow.setSize(width, height);
    mainWindow.setResizable(false);
  }
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
