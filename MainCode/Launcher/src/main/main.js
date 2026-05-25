const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const logger = require('./logger');
const installer = require('./installer');
const config = require('./config');

let mainWindow;

function isNewerVersion(latest, current) {
  const latestParts = String(latest).split('.').map((n) => Number(n) || 0);
  const currentParts = String(current).split('.').map((n) => Number(n) || 0);
  const len = Math.max(latestParts.length, currentParts.length);

  for (let i = 0; i < len; i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

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
    : `file://${path.join(__dirname, '../../dist-renderer/index.html')}`;

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

ipcMain.handle('get-default-install-path', async () => {
  try {
    const cfg = await config.load();
    return path.normalize(cfg.installPath);
  } catch (err) {
    logger.warn('get-default-install-path', err);
    return path.join(app.getPath('appData'), 'TGS Launcher Apps');
  }
});

ipcMain.handle('pick-install-folder', async () => {
  const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const res = await dialog.showOpenDialog(parent, {
    title: 'Pasta dos aplicativos TGS (Pack / Mod Manager)',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths?.length) return null;
  return path.normalize(res.filePaths[0]);
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

async function resolveInstallRoot(baseInstallPath) {
  let root = baseInstallPath && String(baseInstallPath).trim();
  if (!root) {
    try {
      root = (await config.load()).installPath;
    } catch (_) {
      root = '';
    }
  }
  return root ? path.normalize(root) : '';
}

function resolveAppPaths(baseInstallPath, appType) {
  const { DOWNLOAD_URLS } = require('./constants');
  const urlDict = DOWNLOAD_URLS[appType];
  if (!urlDict || !urlDict.mainApp) {
    throw new Error(`URL do app não encontrada para appType=${appType}`);
  }
  const fileName = urlDict.fileName || path.basename(urlDict.mainApp);
  const appInstallDir = path.join(baseInstallPath, 'data', 'apps', appType);
  const exePath = path.join(appInstallDir, fileName);
  const versionPath = path.join(appInstallDir, 'version.json');
  return { urlDict, fileName, appInstallDir, exePath, versionPath };
}

async function getAppUpdateStatus(appType, baseInstallPath) {
  const fs = require('fs');
  const installer = require('./installer');

  const root = await resolveInstallRoot(baseInstallPath);
  if (!root) {
    return {
      success: true,
      appType,
      installedVersion: null,
      latestVersion: null,
      hasUpdate: false,
      notInstalled: true,
    };
  }

  const { versionPath, exePath } = resolveAppPaths(root, appType);
  const exeExists = fs.existsSync(exePath);

  let installedVersion = null;
  if (fs.existsSync(versionPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      installedVersion = data.version || null;
    } catch (err) {
      logger.warn(`Falha ao ler version.json de ${appType}`, err);
    }
  }

  const latestVersion = await installer.fetchLatestVersion(appType);

  const hasUpdate = !!(
    latestVersion &&
    exeExists &&
    (!installedVersion || isNewerVersion(latestVersion, installedVersion))
  );
  const notInstalled = !exeExists;

  return {
    success: true,
    appType,
    installedVersion,
    latestVersion,
    hasUpdate,
    notInstalled,
  };
}

ipcMain.handle('launch-app', async (event, appType, baseInstallPath) => {
  const { spawn } = require('child_process');
  const fs = require('fs');

  let root = await resolveInstallRoot(baseInstallPath);
  if (!root) {
    throw new Error('Pasta de instalação não definida. Escolha a pasta em "Alterar pasta" e instale de novo.');
  }

  const updateStatus = await getAppUpdateStatus(appType, baseInstallPath);
  if (updateStatus.hasUpdate) {
    const installed = updateStatus.installedVersion || '?';
    const latest = updateStatus.latestVersion || '?';
    throw new Error(
      `Atualização obrigatória (v${installed} → v${latest}). ` +
        'Clique em "Atualizar" no Launcher. Feche o aplicativo se estiver aberto antes de atualizar.'
    );
  }

  const { exePath } = resolveAppPaths(root, appType);

  if (!fs.existsSync(exePath)) {
    throw new Error(
      `Executável não encontrado em:\n${exePath}\n\n` +
        'Use "Alterar pasta" se instalou em outro disco (ex.: C:\\TGS) ou clique em Instalar de novo.'
    );
  }

  logger.info(`Iniciando aplicativo: ${exePath}`);

  await new Promise((r) => setTimeout(r, 150));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(300 * attempt);
    try {
      if (process.platform === 'win32') {
        const child = spawn(
          process.env.ComSpec || 'cmd.exe',
          ['/d', '/c', 'start', '""', exePath, '--token=TGS_SECURE_AUTH_2026'],
          {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            cwd: path.dirname(exePath),
          }
        );
        child.unref();
      } else {
        const child = spawn(exePath, ['--token=TGS_SECURE_AUTH_2026'], {
          detached: true,
          stdio: 'ignore',
          cwd: path.dirname(exePath),
        });
        child.unref();
      }
      return { success: true };
    } catch (err) {
      lastError = err;
      logger.warn(`launch-app tentativa ${attempt + 1} falhou`, err);
    }
  }
  logger.error('Falha ao iniciar aplicativo após várias tentativas', lastError);
  throw lastError || new Error('Falha ao iniciar o aplicativo');
});

ipcMain.handle('check-app-update', async (event, appType, baseInstallPath) => {
  try {
    const status = await getAppUpdateStatus(appType, baseInstallPath);
    logger.info(`Check update for ${appType}`, status);
    return status;
  } catch (error) {
    logger.error(`Falha ao verificar update do app ${appType}`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-installed-apps', async (event, baseInstallPath) => {
  const fs = require('fs');
  const { DOWNLOAD_URLS } = require('./constants');

  try {
    const installed = {};
    const root = await resolveInstallRoot(baseInstallPath);
    if (!root) {
      return { success: true, apps: {} };
    }
    for (const appType of Object.keys(DOWNLOAD_URLS)) {
      const { exePath, versionPath } = resolveAppPaths(root, appType);
      const exeExists = fs.existsSync(exePath);

      let version = null;
      if (fs.existsSync(versionPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
          version = data.version || null;
        } catch {
          // ignore
        }
      }

      installed[appType] = {
        installed: exeExists,
        version,
        exePath: exeExists ? exePath : null,
      };
    }
    return { success: true, apps: installed };
  } catch (error) {
    logger.error('Falha ao listar apps instalados', error);
    return { success: false, error: error.message };
  }
});
